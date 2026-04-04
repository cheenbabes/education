"""POST /generate-standard-worksheet — generates structured, grade-appropriate
worksheet problems for a topic cluster, keyed by (grade, subject, standards).

Unlike the philosophy worksheet endpoint, this generates problem-based exercises
with answer keys, not philosophy-aligned sections.
"""
from __future__ import annotations
import json
from typing import Literal, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from config import settings
from api.generate import _call_llm, _call_anthropic

router = APIRouter()

PROBLEM_TYPES = {
    "identify": ["identify_visual", "multiple_choice", "label_diagram", "match"],
    "practice": ["fill_in", "compute", "short_answer", "order_sequence"],
    "extend":   ["short_answer", "word_problem", "create_example", "explain"],
}

SYSTEM_PROMPT = """You are an expert K-12 curriculum designer creating printable worksheet problems.

Generate exactly {num_problems} problems for a {worksheet_type} worksheet.

WORKSHEET TYPE DEFINITIONS:
- "identify": Recognition and identification tasks. Students identify, match, label, or select from options.
  Good problem types: multiple_choice (4 options), identify_visual (write what they see), label_diagram, match_columns
- "practice": Application of the concept. Students compute, fill in, sequence, or write short answers.
  Good problem types: fill_in (blank to complete), compute (show work), short_answer (1-3 sentences), order_sequence
- "extend": Challenge and creative application. Word problems, real-world scenarios, create-your-own.
  Good problem types: word_problem, create_example, explain_your_thinking, short_answer

GRADE CALIBRATION for Grade {grade}:
{grade_context}

PROBLEM STRUCTURE:
Each problem MUST have:
- "id": integer (1-based)
- "type": one of the types above
- "prompt": the question/instruction text (clear, grade-appropriate, parent-friendly)
- "answer": the correct answer (string)
- "answerLines": number of lines to provide for written responses (1-4)

Optional fields:
- "options": array of 4 strings for multiple_choice (include exactly 1 correct answer)
- "visual": {{ "type": "...", "params": {{...}} }} — EXACT param schemas (use ONLY these, no other field names):

MATH VISUALS — use these exact param names:
  fraction_circle    → {{ "numerator": 3, "denominator": 4 }}          (one circle showing 3/4)
  fraction_bar       → {{ "numerator": 3, "denominator": 8, "shaded": 3 }}  (bar divided in 8, 3 shaded)
  fraction_grid      → {{ "fractions": [{{ "n": 1, "d": 4 }}, {{ "n": 2, "d": 4 }}, {{ "n": 3, "d": 4 }}, {{ "n": 1, "d": 2 }}] }}  (grid of 4 fraction circles for MC options A-D)
  number_line        → {{ "start": 0, "end": 10, "marked": [3, 7] }}   (line from 0-10 with dots at 3 and 7)
  ten_frame          → {{ "filled": 7 }}                                 (7 of 10 cells filled)
  multiplication_array → {{ "rows": 3, "cols": 4 }}                    (3×4 dot grid)
  number_bonds       → {{ "whole": 10, "part1": 6, "part2": null }}    (null = blank for student to fill)
  place_value_chart  → {{ "columns": ["Hundreds","Tens","Ones"], "values": [1, 4, 7] }}
  ruler              → {{ "length": 6, "unit": "in" }}
  bar_graph          → {{ "labels": ["Mon","Tue","Wed"], "values": [4, 7, 2], "title": "Books Read" }}
  area_grid          → {{ "rows": 4, "cols": 6, "shaded": 12 }}       (grid showing area)
  thermometer        → {{ "current": 72, "min": 0, "max": 100 }}
  analog_clock       → {{ "hour": 3, "minute": 30 }}
  protractor         → {{}}
  equation_balance   → {{ "left_side": "x + 3", "right_side": "7" }}
  labeled_shape      → {{ "shape": "rectangle", "dimensions": ["6 cm", "4 cm"] }}  (shape: triangle/rectangle/square/circle)
  number_grid        → {{ "highlight": [5, 10, 15, 20, 25] }}         (100-chart with highlighted cells)
  base_ten_blocks    → {{ "hundreds": 1, "tens": 3, "ones": 7 }}

SCIENCE VISUALS:
  plant_diagram      → {{}}                                             (labeled plant for fill-in)
  food_chain         → {{ "organisms": ["Grass","Rabbit","Fox","Eagle"] }}
  lifecycle_diagram  → {{ "stages": ["Egg","Caterpillar","Chrysalis","Butterfly"] }}
  earth_layers       → {{}}
  atom_model         → {{ "protons": 6, "neutrons": 6, "electrons": 6 }}
  weather_symbols    → {{ "symbols": ["sun","cloud","rain","snow"] }}
  water_cycle        → {{}}
  cell_diagram       → {{ "cell_type": "animal" }}
  body_diagram       → {{}}

ELA/GENERAL VISUALS:
  venn_diagram       → {{ "label1": "Dogs", "label2": "Cats", "overlap_label": "Both" }}
  t_chart            → {{ "left_label": "Fiction", "right_label": "Non-Fiction", "rows": 4 }}
  word_web           → {{ "center_word": "Brave", "related_words": ["bold","fearless","daring"] }}
  cause_effect       → {{ "cause": "It rained all day", "effect": "The game was cancelled" }}
  timeline           → {{ "events": ["1776","1800","1850","1900"], "orientation": "horizontal" }}
  sequence_arrows    → {{ "steps": 4, "labels": ["First","Next","Then","Finally"] }}
  kwl_chart          → {{ "topic": "Fractions" }}
  story_map          → {{}}
  paragraph_organizer → {{}}

RULES FOR VISUALS:
- For fraction MC questions showing 4 different circles (A/B/C/D): use fraction_grid with 4 fractions
- NEVER invent param names — use ONLY the exact names shown above
- ONE visual per problem (not multiple)
- The visual renders ABOVE the prompt text on the page. For identify_visual and label_diagram types, ALWAYS say "above" (e.g., "Look at the clock above." "Look at the fraction bar above.")
- For multiple_choice problems with a visual: say "Look at the [visual] above. Which answer is correct?" — do NOT repeat the visual content in the options text
- NEVER embed a list or schedule as bullet points (•) inside the prompt text. If a problem needs a list/schedule/table, use a data_table visual instead and reference it: "Use the table above to answer the question."

IMPORTANT:
- Problems must be appropriate for Grade {grade} — not too easy, not too hard
- Use concrete, real-world contexts the child will relate to
- Write prompts in second person ("Write the fraction..." not "Students will write...")
- Multiple choice: make distractors plausible (not obviously wrong)
- Short answers need clear criteria for correctness
- Vary problem types within the worksheet
- CRITICAL JSON RULE: Do NOT use LaTeX backslash sequences (like \\frac, \\div, \\cdot, \\leq) anywhere inside the JSON "prompt", "answer", or "options" fields. These break JSON parsing. Instead write math as plain text: "3/4", "3 divided by 4", "2 x 3 = 6", "less than or equal to". Use the × character (not \times), the ÷ character (not \div), and / for fractions in JSON strings.

Return ONLY valid JSON: {{ "problems": [...], "answerKey": [{{"problemId": 1, "answer": "..."}}] }}"""

GRADE_CONTEXT = {
    "K":  "Kindergartners: count to 20, recognize shapes, sort objects, trace letters, understand beginning/middle/end. Simple vocabulary. Very short sentences.",
    "1":  "Grade 1: add/subtract to 20, measure with non-standard units, write simple sentences, identify main idea in short texts.",
    "2":  "Grade 2: add/subtract to 100, measure with rulers, write opinion sentences, compare texts.",
    "3":  "Grade 3: multiply/divide within 100, understand fractions 1/2-1/8, write paragraphs, identify text structure.",
    "4":  "Grade 4: multi-digit multiplication, equivalent fractions, compare fractions, write multi-paragraph essays.",
    "5":  "Grade 5: fraction operations (add/subtract/multiply), decimal place value, analyze author's purpose.",
    "6":  "Grade 6: ratios and proportions, negative numbers, expressions, analyze informational text structure.",
    "7":  "Grade 7: proportional relationships, probability, linear expressions, compare multiple texts.",
    "8":  "Grade 8: linear equations, functions, transformations, analyze argument and evidence.",
    "9":  "Grade 9: algebraic functions, quadratic equations, literary analysis with textual evidence.",
    "10": "Grade 10: geometric proofs, logarithms, synthesis across multiple sources.",
    "11": "Grade 11: statistics, pre-calculus, evaluate rhetoric and argument in complex texts.",
    "12": "Grade 12: calculus concepts, complex analysis, research writing with citations.",
}

USER_TEMPLATE = """Topic: {title}
Grade: {grade}
Subject: {subject}
Worksheet Type: {worksheet_type} (problems {num_problems} of this type)

Standards covered:
{standards_text}

Generate {num_problems} worksheet problems of type "{worksheet_type}"."""


class StandardWorksheetRequest(BaseModel):
    cluster_key: str
    cluster_title: str
    grade: str
    subject: str
    worksheet_type: Literal["identify", "practice", "extend"]
    standard_codes: list[str] = Field(default_factory=list)
    standard_descriptions: list[str] = Field(default_factory=list)
    num_problems: int = 6
    context_paragraph: Optional[str] = None  # If None, LLM generates it


class WorksheetProblem(BaseModel):
    model_config = {"extra": "allow"}
    id: int
    type: str
    prompt: str
    answer: str
    answerLines: int = 2
    options: Optional[list[str]] = None
    visual: Optional[dict] = None


class StandardWorksheetResponse(BaseModel):
    cluster_key: str
    grade: str
    subject: str
    worksheet_type: str
    context: str
    problems: list[WorksheetProblem]
    answer_key: list[dict]
    cost_usd: float = 0.0


@router.post("/generate-standard-worksheet", response_model=StandardWorksheetResponse)
async def generate_standard_worksheet(req: StandardWorksheetRequest):
    grade_context = GRADE_CONTEXT.get(req.grade, f"Grade {req.grade} student.")
    standards_text = "\n".join(
        f"- {code}: {desc}"
        for code, desc in zip(req.standard_codes[:5], req.standard_descriptions[:5])
    ) or "See topic title."

    system = SYSTEM_PROMPT.format(
        num_problems=req.num_problems,
        worksheet_type=req.worksheet_type,
        grade=req.grade,
        grade_context=grade_context,
    )
    user = USER_TEMPLATE.format(
        title=req.cluster_title,
        grade=req.grade,
        subject=req.subject,
        worksheet_type=req.worksheet_type,
        num_problems=req.num_problems,
        standards_text=standards_text,
    )

    # Generate context paragraph if not provided
    context = req.context_paragraph
    if not context:
        ctx_system = f"Write a 2-3 sentence context paragraph for a Grade {req.grade} {req.subject} worksheet about: {req.cluster_title}. Use simple, clear language. Explain the key concept in words a {req.grade}th grader and their parent will understand. Return only the paragraph text, no JSON."
        ctx_raw, _ = _call_anthropic(
            "claude-haiku-4-5-20251001",
            ctx_system,
            req.cluster_title,
            max_tokens=200,
        )
        context = ctx_raw.strip()

    # Generate problems — use Claude Sonnet 4.6 via Netflix proxy
    raw, cost = _call_anthropic(
        "claude-sonnet-4-6",
        system,
        user,
        max_tokens=3000,
    )
    if raw.strip().startswith("```"):
        raw = raw.strip().split("\n", 1)[1].rsplit("```", 1)[0]

    # Fix invalid JSON escape sequences from LaTeX (e.g. \frac → \\frac)
    import re as _re
    clean = _re.sub(r'\\([^"\\/bfnrtu])', r'\\\\\1', raw)
    try:
        data = json.loads(clean)
    except json.JSONDecodeError:
        # Last resort: strip all backslash sequences that aren't valid JSON
        clean2 = _re.sub(r'\\(?!["\\/bfnrtu])', r'', raw)
        data = json.loads(clean2)
    problems = [WorksheetProblem(**p) for p in data.get("problems", [])]
    answer_key = data.get("answerKey", [])

    return StandardWorksheetResponse(
        cluster_key=req.cluster_key,
        grade=req.grade,
        subject=req.subject,
        worksheet_type=req.worksheet_type,
        context=context,
        problems=problems,
        answer_key=answer_key,
        cost_usd=round(cost, 6),
    )
