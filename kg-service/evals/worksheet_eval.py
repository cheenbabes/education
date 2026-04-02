"""Worksheet generation eval suite.

Generates sample worksheets across philosophies × grade bands × subjects,
then scores them on 5 dimensions using an LLM judge. Focus is on math and
science to catch low-value generic outputs (e.g. "observe and draw what you
see" for a fractions worksheet).

Usage:
    # Quick smoke test (1 per subject = 16 worksheets)
    python -m evals.worksheet_eval --quick

    # Full suite (8 philosophies × 2 grade bands × 2 subjects = 32 worksheets)
    python -m evals.worksheet_eval

    # Single subject
    python -m evals.worksheet_eval --subject math
    python -m evals.worksheet_eval --subject science

    # Single grade band
    python -m evals.worksheet_eval --grade k3
    python -m evals.worksheet_eval --grade 48
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from datetime import datetime
from pathlib import Path

from config import settings
from api.generate import _call_llm, _calc_cost

# ── Test matrix ──────────────────────────────────────────────────────────────

PHILOSOPHIES = [
    "adaptive", "charlotte-mason", "classical", "montessori-inspired",
    "place-nature-based", "project-based-learning", "unschooling", "waldorf-adjacent",
]

GRADE_BANDS = {
    "K-3": {"grade": "3", "age": 8, "child_name": "Emma"},
    "4-8": {"grade": "5", "age": 10, "child_name": "Jack"},
}

SUBJECTS = {
    "math": {
        "K-3": {
            "lesson_title": "Introduction to Fractions",
            "interest": "baking",
            "lesson_sections": [
                {"title": "Understanding Halves and Quarters", "instructions": "Use a pizza or pie to show how we split things equally into parts."},
                {"title": "Drawing Fractions", "instructions": "Draw a shape and divide it into equal parts. Color in the fraction."},
            ],
            "standards_addressed": [
                {"code": "3.NF.1", "description_plain": "Understand a fraction 1/b as the quantity formed by 1 part when a whole is partitioned into b equal parts."},
            ],
        },
        "4-8": {
            "lesson_title": "Fractions, Decimals, and Percentages",
            "interest": "sports statistics",
            "lesson_sections": [
                {"title": "Converting Fractions to Decimals", "instructions": "Divide the numerator by the denominator to convert."},
                {"title": "Real-world Fractions", "instructions": "Use batting averages and field goal percentages as examples."},
            ],
            "standards_addressed": [
                {"code": "5.NF.1", "description_plain": "Add and subtract fractions with unlike denominators."},
            ],
        },
    },
    "science": {
        "K-3": {
            "lesson_title": "Animal Habitats and Adaptations",
            "interest": "animals",
            "lesson_sections": [
                {"title": "Where Animals Live", "instructions": "Learn about forests, oceans, deserts, and grasslands as habitats."},
                {"title": "How Animals Survive", "instructions": "Discuss how animals are adapted to their environments (fur, fins, camouflage)."},
            ],
            "standards_addressed": [
                {"code": "2-LS4-1", "description_plain": "Make observations of plants and animals to compare the diversity of life in different habitats."},
            ],
        },
        "4-8": {
            "lesson_title": "Ecosystems and Food Webs",
            "interest": "nature exploration",
            "lesson_sections": [
                {"title": "Producers, Consumers, Decomposers", "instructions": "Learn the roles of different organisms in an ecosystem."},
                {"title": "Building a Food Web", "instructions": "Map out energy transfer from plants to herbivores to carnivores."},
            ],
            "standards_addressed": [
                {"code": "5-LS2-1", "description_plain": "Develop a model to describe the movement of matter among plants, animals, decomposers, and the environment."},
            ],
        },
    },
}

# ── Eval prompt ───────────────────────────────────────────────────────────────

EVAL_SYSTEM = "You are an expert homeschool curriculum evaluator. Respond only with valid JSON."

EVAL_PROMPT = """\
You are evaluating a generated worksheet for a homeschool student. Rate it on each
dimension below using a 1-5 scale and identify any critical issues.

## Context
- Subject: {subject}
- Grade Band: {grade_band}
- Philosophy: {philosophy}
- Lesson topic: {lesson_title}

## Worksheet Content
{worksheet_json}

## Scoring Rubric

Rate each dimension 1–5:

**SUBJECT_SPECIFICITY** — Does the worksheet contain specific subject content?
  5: Specific fractions, equations, named organisms, chemical reactions, etc.
  3: Some subject references but mostly generic prompts
  1: Could be for any subject — no specific content at all

**PHILOSOPHY_ALIGNMENT** — Do the section types match the philosophy?
  5: Section types are exactly right for the philosophy (e.g. Charlotte Mason = narration + copywork)
  3: Sections are acceptable but not distinctively philosophy-driven
  1: Section types contradict or ignore the philosophy entirely

**GRADE_APPROPRIATENESS** — Is complexity suitable for the grade band ({grade_band})?
  5: Perfectly calibrated — vocabulary, complexity, and tasks match the age
  3: Mostly appropriate with minor issues
  1: Way too easy or too hard for this grade

**PRACTICALITY** — Can a homeschool parent use this without special equipment?
  5: Everything needed is common household items or pencil + paper
  3: Mostly practical with 1-2 borderline items
  1: Requires lab equipment, classroom materials, or impossible-to-source items

**VALUE_DENSITY** — Does the student have enough meaningful work?
  5: 3-4 rich tasks with real cognitive engagement
  3: Some tasks but feels thin or padded
  1: Just one generic box or a few blank lines — basically nothing to do

## Critical Issues
List any of these if present (empty array if none):
- "generic_box": A section that could apply to any subject (e.g. "observe and draw")
- "wrong_subject": Instructions that don't match the subject at all
- "wrong_philosophy": Section type directly contradicts the philosophy
- "impossible_task": Requires resources a homeschool family won't have
- "too_easy" or "too_hard": Clear grade mismatch

Respond with JSON only:
{{
  "scores": {{
    "subject_specificity": <1-5>,
    "philosophy_alignment": <1-5>,
    "grade_appropriateness": <1-5>,
    "practicality": <1-5>,
    "value_density": <1-5>
  }},
  "overall_score": <average, 1-5>,
  "critical_issues": ["..."],
  "strengths": ["..."],
  "weaknesses": ["..."]
}}
"""

# ── Worksheet generation ──────────────────────────────────────────────────────

WORKSHEET_SYSTEM = """\
You are an expert homeschool educator creating a printable worksheet that accompanies a lesson.
Generate a worksheet with 3-4 sections appropriate for the educational philosophy and grade level.

Each section must have: { "type": string, "title": string, "instructions": string, "lines": number (optional), "drawing_space": boolean (optional) }

CRITICAL: The worksheet MUST contain subject-specific content. For math: include actual problems,
specific numbers, equations. For science: include specific organism names, processes, terminology.
Do NOT generate generic observation prompts that could apply to any subject.

Return ONLY valid JSON: { "sections": [...] }"""


def generate_worksheet(
    philosophy: str,
    grade_band: str,
    subject: str,
    case: dict,
) -> tuple[dict, float]:
    """Call the LLM directly to generate a worksheet for the test case."""
    band = GRADE_BANDS[grade_band]
    sections_summary = "\n".join(
        f"- {s['title']}: {s['instructions'][:100]}"
        for s in case["lesson_sections"]
    )
    standards_summary = "; ".join(
        s.get("description_plain", s.get("code", ""))
        for s in case["standards_addressed"][:2]
    )

    user_prompt = f"""\
Lesson: {case['lesson_title']}
Theme/Interest: {case['interest']}
Philosophy: {philosophy}
Child: {band['child_name']}, Grade {band['grade']}
Learning notes: none

Lesson sections summary:
{sections_summary}

Standards addressed: {standards_summary}

Generate a 3-4 section worksheet."""

    model = settings.openai_validation_model  # gpt-4.1-mini
    raw, cost = _call_llm(
        model,
        WORKSHEET_SYSTEM,
        user_prompt,
        max_tokens=2048,
        call_type="worksheet_eval",
    )
    if raw.strip().startswith("```"):
        raw = raw.strip().split("\n", 1)[1].rsplit("```", 1)[0]
    return json.loads(raw), cost


def evaluate_worksheet(
    worksheet: dict,
    philosophy: str,
    grade_band: str,
    subject: str,
    lesson_title: str,
) -> dict:
    """Score a generated worksheet using LLM judge."""
    eval_user = EVAL_PROMPT.format(
        subject=subject,
        grade_band=grade_band,
        philosophy=philosophy,
        lesson_title=lesson_title,
        worksheet_json=json.dumps(worksheet, indent=2),
    )

    model = settings.openai_extraction_model  # GPT-4.1 for eval
    raw, _ = _call_llm(
        model,
        EVAL_SYSTEM,
        eval_user,
        max_tokens=1024,
        call_type="worksheet_eval_judge",
    )
    if raw.strip().startswith("```"):
        raw = raw.strip().split("\n", 1)[1].rsplit("```", 1)[0]
    return json.loads(raw)


# ── Eval runner ───────────────────────────────────────────────────────────────

def run_eval(
    subject_filter: str | None = None,
    grade_filter: str | None = None,
    quick: bool = False,
    dry_run: bool = False,
) -> list[dict]:
    """Run the worksheet eval suite."""
    subjects = [subject_filter] if subject_filter else list(SUBJECTS.keys())
    grades = [grade_filter.upper().replace("-", "")] if grade_filter else list(GRADE_BANDS.keys())

    # Normalize grade filter
    grade_map = {"K3": "K-3", "48": "4-8", "K-3": "K-3", "4-8": "4-8"}
    grades = [grade_map.get(g, g) for g in grades]

    cases = []
    if quick:
        # 1 per philosophy per subject — 8 × 2 = 16 cases (grade K-3)
        for phil in PHILOSOPHIES:
            for subj in subjects:
                if "K-3" in grades:
                    cases.append((phil, "K-3", subj))
    else:
        for phil in PHILOSOPHIES:
            for grade in grades:
                for subj in subjects:
                    cases.append((phil, grade, subj))

    print(f"\n{'DRY RUN — ' if dry_run else ''}Worksheet eval: {len(cases)} worksheets "
          f"({len(PHILOSOPHIES)} philosophies × {len(grades)} grade bands × {len(subjects)} subjects)\n")

    if dry_run:
        for i, (phil, grade, subj) in enumerate(cases, 1):
            print(f"  {i:3d}. {phil:<30} {grade:<6} {subj}")
        return []

    results = []
    total_cost = 0.0

    for i, (phil, grade, subj) in enumerate(cases, 1):
        case = SUBJECTS[subj][grade]
        print(f"[{i:3d}/{len(cases)}] {phil:<30} {grade:<6} {subj} — ", end="", flush=True)

        try:
            t0 = time.time()
            worksheet, gen_cost = generate_worksheet(phil, grade, subj, case)
            scores = evaluate_worksheet(worksheet, phil, grade, subj, case["lesson_title"])
            elapsed = time.time() - t0
            total_cost += gen_cost

            overall = scores.get("overall_score", 0)
            issues = scores.get("critical_issues", [])
            flag = " ⚠" if issues else ""
            print(f"overall={overall:.1f}{flag}  ({elapsed:.1f}s)")

            results.append({
                "philosophy": phil,
                "grade_band": grade,
                "subject": subj,
                "lesson_title": case["lesson_title"],
                "worksheet": worksheet,
                "scores": scores,
                "gen_cost_usd": gen_cost,
                "elapsed_s": round(elapsed, 2),
            })

        except Exception as e:
            print(f"ERROR: {e}")
            results.append({
                "philosophy": phil,
                "grade_band": grade,
                "subject": subj,
                "error": str(e),
            })

        time.sleep(0.3)  # gentle rate limiting

    _print_summary(results)
    _save_results(results, quick)
    print(f"\nTotal generation cost: ${total_cost:.4f}")
    return results


def _print_summary(results: list[dict]) -> None:
    """Print a summary table of scores."""
    scored = [r for r in results if "scores" in r]
    if not scored:
        return

    dims = ["subject_specificity", "philosophy_alignment", "grade_appropriateness",
            "practicality", "value_density"]

    print("\n" + "=" * 90)
    print(f"{'PHILOSOPHY':<30} {'GRADE':<6} {'SUBJECT':<12} {'SPEC':>4} {'PHIL':>4} "
          f"{'GRADE':>5} {'PRAC':>4} {'VAL':>4} {'OVR':>4}  ISSUES")
    print("-" * 90)

    for r in scored:
        s = r["scores"].get("scores", {})
        issues = r["scores"].get("critical_issues", [])
        issue_str = ", ".join(issues[:2]) if issues else ""
        print(
            f"{r['philosophy']:<30} {r['grade_band']:<6} {r['subject']:<12} "
            f"{s.get('subject_specificity', 0):>4.1f} "
            f"{s.get('philosophy_alignment', 0):>4.1f} "
            f"{s.get('grade_appropriateness', 0):>5.1f} "
            f"{s.get('practicality', 0):>4.1f} "
            f"{s.get('value_density', 0):>4.1f} "
            f"{r['scores'].get('overall_score', 0):>4.1f}  {issue_str}"
        )

    print("=" * 90)

    # Averages per subject
    for subj in set(r.get("subject") for r in scored):
        subj_results = [r for r in scored if r.get("subject") == subj]
        avg_scores = {}
        for dim in dims:
            vals = [r["scores"].get("scores", {}).get(dim, 0) for r in subj_results if "scores" in r["scores"]]
            avg_scores[dim] = sum(vals) / len(vals) if vals else 0
        overall_vals = [r["scores"].get("overall_score", 0) for r in subj_results]
        avg_overall = sum(overall_vals) / len(overall_vals) if overall_vals else 0
        critical = sum(1 for r in subj_results if r["scores"].get("critical_issues"))
        print(f"\n{subj.upper()} averages: "
              f"specificity={avg_scores['subject_specificity']:.2f}  "
              f"philosophy={avg_scores['philosophy_alignment']:.2f}  "
              f"grade={avg_scores['grade_appropriateness']:.2f}  "
              f"practicality={avg_scores['practicality']:.2f}  "
              f"value={avg_scores['value_density']:.2f}  "
              f"overall={avg_overall:.2f}  "
              f"critical_issues={critical}/{len(subj_results)}")


def _save_results(results: list[dict], quick: bool) -> None:
    """Save results to reports directory."""
    reports_dir = Path(__file__).parent.parent / "reports"
    reports_dir.mkdir(exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    suffix = "-quick" if quick else ""
    out_path = reports_dir / f"worksheet-eval{suffix}-{ts}.json"
    out_path.write_text(json.dumps(results, indent=2))
    print(f"\nResults saved to {out_path}")


# ── CLI ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Worksheet generation eval suite")
    parser.add_argument("--quick", action="store_true", help="Smoke test: 1 per philosophy per subject")
    parser.add_argument("--subject", choices=["math", "science"], help="Run only one subject")
    parser.add_argument("--grade", choices=["k3", "48", "K-3", "4-8"], help="Run only one grade band")
    parser.add_argument("--dry-run", action="store_true", help="Show test matrix without running")
    args = parser.parse_args()

    run_eval(
        subject_filter=args.subject,
        grade_filter=args.grade,
        quick=args.quick,
        dry_run=args.dry_run,
    )
