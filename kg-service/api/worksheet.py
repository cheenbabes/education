"""POST /generate-worksheet endpoint."""

from __future__ import annotations

import json
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from config import settings
from api.generate import _call_llm, _calc_cost

router = APIRouter()

WORKSHEET_SYSTEM_PROMPT = """You are an expert homeschool educator creating a printable worksheet that accompanies a lesson.
Generate a worksheet with 3-4 sections appropriate for the educational philosophy and grade level.

Philosophy-appropriate section types:
- charlotte-mason: narration_prompt (tell back in own words), copywork (sentence to copy), nature_journal (draw/observe)
- montessori-inspired: observation (record what you see/do), sorting_activity (categorize items), hands_on_record
- classical: grammar_work (parse/diagram), memory_work (recite/copy), short_essay
- project-based-learning: planning_grid (steps to complete project), reflection (what worked/why), checklist
- place-nature-based: field_notes (observe outdoors), sketch (draw what you found), connection (local relevance)
- unschooling: free_exploration (open-ended questions), interest_map (connections to other interests)
- waldorf-adjacent: artistic_response (draw/paint/describe aesthetically), rhythm_activity, imagination_prompt
- adaptive: mixed_modalities (visual + written + hands-on options)

Each section has: { "type": string, "title": string, "instructions": string, "lines": number (optional), "drawing_space": boolean (optional), "visual": { "type": string, "params": {...} } (optional) }

If the child has learning_notes, add subtle accommodations in instructions (shorter prompts, visual options, movement suggestions) without changing the philosophy structure.

Math notation: Use LaTeX notation for all mathematical expressions within instructions:
- Inline math: $\\frac{3}{4}$, $2^3$, $\\sqrt{16}$, $4 \\times 3$
- Display math (standalone problem): $$\\frac{3}{4} + \\frac{1}{4} = ?$$
- Write fractions AS LaTeX, not as "3/4" or "three-fourths" in math contexts
- Example instruction: "Solve: $$\\frac{2}{3} + \\frac{1}{6} = ?$$ Show your work on the lines below."

Visual section types — Math manipulatives (K–5):
  "type": "fraction_bars"        → visual: { "type": "fraction_bar",   "params": { "numerator": 3, "denominator": 4 } }
  "type": "number_line"          → visual: { "type": "number_line",    "params": { "start": 0, "end": 10, "marked": [3, 7] } }
  "type": "ten_frame"            → visual: { "type": "ten_frame",      "params": { "filled": 7 } }
  "type": "fraction_circle"      → visual: { "type": "fraction_circle","params": { "numerator": 2, "denominator": 3 } }
  "type": "multiplication_array" → visual: { "type": "multiplication_array", "params": { "rows": 3, "cols": 4 } }
  "type": "coordinate_grid"      → visual: { "type": "coordinate_grid","params": { "quadrant": 1, "points": [{"x": 2, "y": 3}] } }  (K–5 only)
  "type": "analog_clock"         → visual: { "type": "analog_clock",   "params": { "hour": 3, "minute": 30 } }

Visual section types — Advanced math (Grades 6–8, USE THESE instead of coordinate_grid):
  "type": "coordinate_plane_problem" → visual: { "type": "mafs_coordinate_plane", "params": { "xRange": [-5, 5], "yRange": [-5, 5], "points": [{"x": 2, "y": 3}] } }
  "type": "function_graph"           → visual: { "type": "mafs_function",         "params": { "fn": "2*x + 1" } }
  "type": "geometry_figure"          → visual: { "type": "mafs_polygon",          "params": { "vertices": [[0,0],[3,0],[1.5,2.6]] } }

Visual section types — Graphic organizers (ALL subjects, use freely):
  "type": "compare_contrast"     → visual: { "type": "venn_diagram",   "params": { "label1": "Frogs", "label2": "Toads", "overlap_label": "Both" } }
  "type": "kwl_activity"         → visual: { "type": "kwl_chart",      "params": { "topic": "Animal Habitats" } }
  "type": "t_chart"              → visual: { "type": "t_chart",        "params": { "left_label": "Fiction", "right_label": "Non-Fiction", "rows": 5 } }
  "type": "observation_table"    → visual: { "type": "data_table",     "params": { "headers": ["What I Observed", "What I Think It Means"], "rows": 4 } }
  "type": "timeline_activity"    → visual: { "type": "timeline",       "params": { "events": ["Event 1", "Event 2", "Event 3"], "orientation": "horizontal" } }
  "type": "story_structure"      → visual: { "type": "story_map",      "params": {} }

Visual section types — Science diagrams (use when topic matches):
  "type": "plant_labeling"       → visual: { "type": "plant_diagram",  "params": {} }
  "type": "food_chain_activity"  → visual: { "type": "food_chain",     "params": { "organisms": ["Grass", "Grasshopper", "Frog", "Hawk"] } }

Rules for using visual sections:
- For MATH worksheets: include at least one visual section when the topic involves fractions, multiplication, counting, coordinates, or time
- For Grades 6–8 MATH: ALWAYS use the advanced visual types (mafs_coordinate_plane, mafs_function, mafs_polygon) instead of coordinate_grid
- For SCIENCE worksheets: use plant_diagram for plant topics, food_chain for food web/chain topics, observation_table for experiment/nature observation sections, kwl_activity for introduction sections
- For LANGUAGE ARTS: use story_structure for narrative writing sections, t_chart for compare/contrast, venn_diagram for comparing two things
- For HISTORY/SOCIAL STUDIES: use timeline_activity for sequence of events, t_chart for cause/effect or compare/contrast
- For MATH worksheets on fractions, multiplication, or counting: ALWAYS include at least one section with a math visual (fraction_bar, fraction_circle, multiplication_array, ten_frame) — add it to the most hands-on or activity-focused section, even if it's an observation, hands_on_record, or sketch section
- For SCIENCE worksheets: use plant_diagram for plant topics, food_chain for food web topics, observation_table for experiment sections, kwl_chart for intro/preview sections
- For ELA worksheets: use story_map for narrative writing, venn_diagram for compare/contrast, t_chart for two-sided analysis
- NEVER add a visual to: memory_work, copywork, short_essay, grammar_work, artistic_response, imagination_prompt, free_exploration, interest_map, rhythm_activity
- These section types CAN have a supporting visual if it genuinely helps: observation, hands_on_record, sorting_activity, sketch, planning_grid, nature_journal, reflection, connection, checklist
- Always write instructions to reference the visual: "Use the fraction bar above to show your answer."
- The `visual` field is optional for most sections — but REQUIRED for at least one section in any fractions, multiplication, or counting math worksheet

Return ONLY valid JSON: { "sections": [...] }"""

WORKSHEET_USER_TEMPLATE = """Lesson: {lesson_title}
Theme/Interest: {interest}
Philosophy: {philosophy}
Child: {child_name}, Grade {grade}
Learning notes: {learning_notes}

Lesson sections summary:
{lesson_sections_summary}

Standards addressed: {standards_summary}

Generate a 3-4 section worksheet."""


# ---------- Request / Response Models ----------

class LessonSectionInput(BaseModel):
    title: str
    type: str = ""
    instructions: str = ""
    duration_minutes: int = 0


class StandardInput(BaseModel):
    code: str = ""
    description_plain: str = ""


class GenerateWorksheetRequest(BaseModel):
    lesson_title: str
    interest: str
    philosophy: str
    child_name: str
    grade: str
    lesson_sections: list[dict] = Field(default_factory=list)
    standards_addressed: list[dict] = Field(default_factory=list)
    learning_notes: Optional[str] = None


class WorksheetVisual(BaseModel):
    type: str
    params: dict = Field(default_factory=dict)


class WorksheetSection(BaseModel):
    model_config = {"extra": "ignore"}
    type: str
    title: str
    instructions: str
    lines: Optional[int] = None
    drawing_space: Optional[bool] = None
    visual: Optional[WorksheetVisual] = None


class WorksheetContent(BaseModel):
    title: str
    child_name: str
    grade: str
    philosophy: str
    sections: list[WorksheetSection]


class GenerateWorksheetResponse(BaseModel):
    worksheet: WorksheetContent
    cost_usd: float = 0.0


# ---------- Endpoint ----------

@router.post("/generate-worksheet", response_model=GenerateWorksheetResponse)
async def generate_worksheet(req: GenerateWorksheetRequest):
    """Generate a printable worksheet for a lesson."""

    # Build lesson sections summary (first 2-3 sections)
    sections_to_summarize = req.lesson_sections[:3]
    lesson_sections_summary = "\n".join(
        f"- {s.get('title', 'Section')}: {s.get('instructions', '')[:120]}"
        for s in sections_to_summarize
    ) or "No sections provided."

    # Build standards summary (top 2)
    top_standards = req.standards_addressed[:2]
    standards_summary = "; ".join(
        s.get("description_plain", s.get("code", ""))
        for s in top_standards
        if s.get("description_plain") or s.get("code")
    ) or "None"

    user_prompt = WORKSHEET_USER_TEMPLATE.format(
        lesson_title=req.lesson_title,
        interest=req.interest,
        philosophy=req.philosophy,
        child_name=req.child_name,
        grade=req.grade,
        learning_notes=req.learning_notes or "none",
        lesson_sections_summary=lesson_sections_summary,
        standards_summary=standards_summary,
    )

    model = settings.openai_validation_model  # gpt-4.1-mini per config
    try:
        raw, cost = _call_llm(
            model,
            WORKSHEET_SYSTEM_PROMPT,
            user_prompt,
            max_tokens=2048,
            call_type="worksheet_generation",
        )
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to parse worksheet JSON from LLM: {exc}\n\nRaw: {raw[:500]}",
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"LLM API error: {exc}")

    sections = [WorksheetSection(**s) for s in data.get("sections", [])]

    worksheet = WorksheetContent(
        title=f"Worksheet: {req.lesson_title} — {req.child_name}, Grade {req.grade}",
        child_name=req.child_name,
        grade=req.grade,
        philosophy=req.philosophy,
        sections=sections,
    )

    return GenerateWorksheetResponse(
        worksheet=worksheet,
        cost_usd=round(cost, 6),
    )
