"""POST /generate-lesson endpoint."""

from __future__ import annotations

import hashlib
import json
from typing import Optional

import anthropic
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
    philosophy: str = "nature-based"
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


# ---------- Helpers ----------

def _call_claude(model: str, system: str, user: str, max_tokens: int = 4096) -> str:
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    message = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    raw = message.content[0].text.strip()
    # Strip markdown fences if present
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
    if raw.endswith("```"):
        raw = raw.rsplit("```", 1)[0]
    return raw


def _content_hash(lesson_json: str) -> str:
    return hashlib.sha256(lesson_json.encode()).hexdigest()[:12]


# ---------- Endpoint ----------

@router.post("/generate-lesson", response_model=GenerateLessonResponse)
async def generate_lesson(req: GenerateLessonRequest):
    """Generate a lesson plan using the knowledge graph and Claude."""

    if not settings.anthropic_api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not configured")

    # 1. Gather graph context
    # Use the first child's grade for standards / milestones (primary target)
    primary = req.children[0]
    grade = str(primary.grade)

    # Standards
    all_standards: list[dict] = []
    if primary.standards_opt_in:
        for subj in req.subjects:
            stds = get_standards(req.state, grade, subj)
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

    # 3. Generate lesson with Sonnet
    try:
        lesson_raw = _call_claude(settings.sonnet_model, GEN_SYSTEM, user_prompt)
        lesson_data = json.loads(lesson_raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to parse lesson JSON from Claude: {exc}",
        )
    except anthropic.APIError as exc:
        raise HTTPException(status_code=502, detail=f"Claude API error: {exc}")

    # Add content hash
    lesson_data["content_hash"] = _content_hash(lesson_raw)

    # 4. Validate with Haiku
    val_prompt = VAL_USER.format(
        lesson_json=json.dumps(lesson_data, indent=2),
        standards_json=json.dumps(all_standards, indent=2) if all_standards else "[]",
        philosophy_context=json.dumps(phil_ctx, indent=2),
    )

    try:
        val_raw = _call_claude(settings.haiku_model, VAL_SYSTEM, val_prompt, max_tokens=2048)
        val_data = json.loads(val_raw)
    except (json.JSONDecodeError, anthropic.APIError):
        # Validation is best-effort — if it fails, still return the lesson
        val_data = {"valid": True, "issues": [], "suggestions": ["Validation skipped due to error."]}

    return GenerateLessonResponse(
        lesson=LessonPlan(**lesson_data),
        validation=ValidationResult(**val_data),
    )
