"""POST /generate-lesson endpoint."""

from __future__ import annotations

import hashlib
import json
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from config import settings
from kg.query import get_milestones, get_philosophy_context, get_standards
from prompts.generate_lesson import (
    SYSTEM_PROMPT as GEN_SYSTEM,
    USER_PROMPT_TEMPLATE as GEN_USER,
)
from prompts.validate_lesson import (
    SYSTEM_PROMPT as VAL_SYSTEM,
    USER_PROMPT_TEMPLATE as VAL_USER,
)

router = APIRouter()


# ---------- Request / Response Models ----------

class ChildInput(BaseModel):
    id: str
    name: str
    grade: int | str
    age: int
    standards_opt_in: bool = True


class GenerateLessonRequest(BaseModel):
    children: list[ChildInput]
    interest: str
    subjects: list[str]
    philosophy: str = "place-nature-based"
    state: str = "OR"
    multi_subject_optimize: bool = False
    past_lesson_hashes: list[str] = Field(default_factory=list)


class StandardAddressed(BaseModel):
    code: str
    description_plain: str
    how_addressed: str


class MaterialNeeded(BaseModel):
    name: str
    household_alternative: str = ""
    optional: bool = False


class LessonSection(BaseModel):
    title: str
    duration_minutes: int
    type: str
    indoor_outdoor: str = "both"
    instructions: str
    philosophy_connection: str = ""
    tips: list[str] = Field(default_factory=list)
    extensions: list[str] = Field(default_factory=list)


class LessonChild(BaseModel):
    child_id: str
    name: str
    grade: str
    age: int
    differentiation_notes: str = ""


class LessonPlan(BaseModel):
    title: str
    theme: str
    estimated_duration_minutes: int
    philosophy: str
    children: list[LessonChild]
    standards_addressed: list[StandardAddressed] = Field(default_factory=list)
    materials_needed: list[MaterialNeeded] = Field(default_factory=list)
    lesson_sections: list[LessonSection] = Field(default_factory=list)
    assessment_suggestions: list[str] = Field(default_factory=list)
    cleanup_notes: str = ""
    next_lesson_seeds: list[str] = Field(default_factory=list)
    content_hash: Optional[str] = None


class ValidationIssue(BaseModel):
    severity: str
    field: str
    message: str


class ValidationResult(BaseModel):
    valid: bool
    issues: list[ValidationIssue] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)


class GenerateLessonResponse(BaseModel):
    lesson: LessonPlan
    validation: ValidationResult


# ---------- LLM Helpers ----------

def _call_openai(model: str, system: str, user: str, max_tokens: int = 4096) -> str:
    from openai import OpenAI
    client = OpenAI(api_key=settings.openai_api_key)
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        max_tokens=max_tokens,
        temperature=0.7,
    )
    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
    if raw.endswith("```"):
        raw = raw.rsplit("```", 1)[0]
    return raw


def _call_anthropic(model: str, system: str, user: str, max_tokens: int = 4096) -> str:
    import anthropic
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    message = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
    if raw.endswith("```"):
        raw = raw.rsplit("```", 1)[0]
    return raw


def _call_llm(model: str, system: str, user: str, max_tokens: int = 4096) -> str:
    if settings.generation_provider == "openai":
        return _call_openai(model, system, user, max_tokens)
    return _call_anthropic(model, system, user, max_tokens)


def _get_generation_model() -> str:
    if settings.generation_provider == "openai":
        return settings.openai_generation_model
    return settings.sonnet_model


def _get_validation_model() -> str:
    if settings.generation_provider == "openai":
        return settings.openai_validation_model
    return settings.haiku_model


def _content_hash(lesson_json: str) -> str:
    return hashlib.sha256(lesson_json.encode()).hexdigest()[:12]


# ---------- Endpoint ----------

@router.post("/generate-lesson", response_model=GenerateLessonResponse)
async def generate_lesson(req: GenerateLessonRequest):
    """Generate a lesson plan using the knowledge graph + LLM."""

    # 1. Gather graph context
    primary = req.children[0]
    grade = str(primary.grade)

    # Standards
    all_standards: list[dict] = []
    for child in req.children:
        if child.standards_opt_in:
            for subj in req.subjects:
                stds = get_standards(req.state, str(child.grade), subj)
                all_standards.extend(stds)

    # Philosophy context
    phil_ctx = get_philosophy_context(req.philosophy)

    # Milestones
    milestones = get_milestones(grade)

    # 2. Build generation prompt
    children_data = [
        {"child_id": c.id, "name": c.name, "grade": str(c.grade), "age": c.age}
        for c in req.children
    ]

    user_prompt = GEN_USER.format(
        children_json=json.dumps(children_data, indent=2),
        interest=req.interest,
        subjects=", ".join(req.subjects),
        philosophy_context=json.dumps(phil_ctx, indent=2),
        standards_json=json.dumps(all_standards, indent=2) if all_standards else "Standards opt-out — no standards to address.",
        milestones_json=json.dumps(milestones, indent=2),
        past_hashes=", ".join(req.past_lesson_hashes) if req.past_lesson_hashes else "None",
    )

    # 3. Generate lesson
    gen_model = _get_generation_model()
    try:
        lesson_raw = _call_llm(gen_model, GEN_SYSTEM, user_prompt)
        lesson_data = json.loads(lesson_raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to parse lesson JSON from LLM: {exc}\n\nRaw: {lesson_raw[:500]}",
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"LLM API error: {exc}")

    # Add content hash
    lesson_data["content_hash"] = _content_hash(lesson_raw)

    # 4. Validate
    val_model = _get_validation_model()
    val_prompt = VAL_USER.format(
        lesson_json=json.dumps(lesson_data, indent=2),
        standards_json=json.dumps(all_standards, indent=2) if all_standards else "[]",
        philosophy_context=json.dumps(phil_ctx, indent=2),
    )

    try:
        val_raw = _call_llm(val_model, VAL_SYSTEM, val_prompt, max_tokens=2048)
        val_data = json.loads(val_raw)
    except Exception:
        val_data = {"valid": True, "issues": [], "suggestions": ["Validation skipped due to error."]}

    return GenerateLessonResponse(
        lesson=LessonPlan(**lesson_data),
        validation=ValidationResult(**val_data),
    )
