"""Lesson generation eval suite.

Generates sample lessons across all philosophies × grade bands × subjects,
then scores them on multiple dimensions using an LLM judge.

Usage:
    # Full eval (8 philosophies × 3 grade bands × 4 subjects = 96 lessons)
    python -m evals.lesson_eval

    # Quick smoke test (1 lesson per philosophy = 8 lessons)
    python -m evals.lesson_eval --quick

    # Single philosophy
    python -m evals.lesson_eval --philosophy classical

    # Dry run (show what would be generated, no LLM calls)
    python -m evals.lesson_eval --dry-run
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from datetime import datetime
from pathlib import Path

from config import settings
from kg.query import get_philosophy_context, get_standards, get_milestones
from prompts.generate_lesson import SYSTEM_PROMPT as GEN_SYSTEM
from prompts.generate_lesson import USER_PROMPT_TEMPLATE as GEN_USER

PHILOSOPHIES = [
    "adaptive", "charlotte-mason", "classical", "montessori-inspired",
    "place-nature-based", "project-based-learning", "unschooling", "waldorf-adjacent",
]

GRADE_BANDS = {
    "K-2": {"grade": "2", "age": 7, "child_name": "Emma"},
    "3-5": {"grade": "4", "age": 9, "child_name": "Jack"},
    "6-8": {"grade": "7", "age": 12, "child_name": "Maya"},
}

SUBJECTS = ["Math", "Science", "Language Arts", "Social Studies"]

INTERESTS = {
    "K-2": "dinosaurs",
    "3-5": "space exploration",
    "6-8": "marine biology",
}

STATE = "MI"

EVAL_PROMPT = """\
You are an expert evaluator of homeschool lesson plans. Rate the following lesson
on each dimension using the rubric below.

## Philosophy: {philosophy}
## Grade Band: {grade_band}
## Subject: {subject}
## Interest: {interest}

## Philosophy Principles Available in KG
{principles_summary}

## Lesson Plan
{lesson_json}

## Evaluation Rubric

Score each dimension 1-5:

1. **PHILOSOPHY_ALIGNMENT** (1-5): Does the lesson reflect the core principles of
   {philosophy}? Are activities, materials, and approaches consistent with the
   philosophy? Does the philosophy_connection text in each section cite real
   principles from the KG?
   - 5: Every section clearly embodies philosophy principles
   - 3: General alignment but generic, could be any philosophy
   - 1: Contradicts or ignores the philosophy entirely

2. **PRINCIPLE_GROUNDING** (1-5): Are the principles referenced in the lesson
   actually present in the KG? No hallucinated principles?
   - 5: All referenced principles traceable to KG
   - 3: Some references vague or not clearly from KG
   - 1: Makes up principles that don't exist

3. **AGE_APPROPRIATENESS** (1-5): Are activities, duration, complexity, and
   language appropriate for the grade band?
   - 5: Perfectly calibrated to developmental stage
   - 3: Mostly appropriate with minor mismatches
   - 1: Wildly inappropriate for the age

4. **STANDARDS_INTEGRATION** (1-5): Are state standards addressed naturally
   (not force-fit)? Do the standard codes look real?
   - 5: Standards woven seamlessly into activities
   - 3: Standards mentioned but feel bolted on
   - 1: Standards completely wrong or missing

5. **LESSON_QUALITY** (1-5): Is this a lesson a real homeschool parent would
   want to use? Clear instructions, engaging, complete arc?
   - 5: Ready to use, delightful
   - 3: Usable but bland or incomplete
   - 1: Confusing, incomplete, or generic

6. **DIFFERENTIATION** (1-5): If multiple children, are differentiation notes
   meaningful? If single child, is content well-targeted?
   - 5: Thoughtful, specific differentiation
   - 3: Generic age-adjustment notes
   - 1: No differentiation or one-size-fits-all

7. **PHILOSOPHY_DISTINCTIVENESS** (1-5): Would this lesson look noticeably
   different from a lesson generated for a different philosophy?
   - 5: Unmistakably this philosophy
   - 3: Some philosophy flavor but mostly generic
   - 1: Indistinguishable from any other philosophy

Respond in JSON:
{{
  "scores": {{
    "philosophy_alignment": 4,
    "principle_grounding": 5,
    "age_appropriateness": 4,
    "standards_integration": 3,
    "lesson_quality": 4,
    "differentiation": 3,
    "philosophy_distinctiveness": 4
  }},
  "overall_score": 3.9,
  "hallucinated_principles": ["any principle names mentioned in lesson but not in KG"],
  "strengths": ["..."],
  "weaknesses": ["..."],
  "critical_issues": ["any dealbreakers"]
}}
"""


def _call_llm(system: str, user: str, model: str | None = None, max_tokens: int = 4096) -> str:
    """Call the LLM (same pattern as generate.py)."""
    from openai import OpenAI
    client = OpenAI()
    m = model or settings.openai_generation_model
    token_param = "max_completion_tokens" if m.startswith("gpt-5") or m.startswith("o") else "max_tokens"
    kwargs = {
        "model": m,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        token_param: max_tokens,
        "temperature": 0.7,
    }
    resp = client.chat.completions.create(**kwargs)
    return resp.choices[0].message.content


def generate_one(philosophy: str, grade_band: str, subject: str) -> dict:
    """Generate a single lesson and return the raw data."""
    band = GRADE_BANDS[grade_band]
    interest = INTERESTS[grade_band]

    children_data = [{
        "child_id": f"eval-child-{grade_band}",
        "name": band["child_name"],
        "grade": band["grade"],
        "age": band["age"],
    }]

    phil_ctx = get_philosophy_context(philosophy)
    standards = get_standards(STATE, band["grade"], subject)
    milestones = get_milestones(band["grade"])

    user_prompt = GEN_USER.format(
        children_json=json.dumps(children_data, indent=2),
        interest=interest,
        subjects=subject,
        philosophy_context=json.dumps(phil_ctx, indent=2),
        standards_json=json.dumps(standards, indent=2) if standards else "Standards opt-out.",
        milestones_json=json.dumps(milestones, indent=2),
        past_hashes="None",
    )

    raw = _call_llm(GEN_SYSTEM, user_prompt)
    # Strip markdown fences if present
    if raw.strip().startswith("```"):
        raw = raw.strip().split("\n", 1)[1].rsplit("```", 1)[0]
    return json.loads(raw)


def evaluate_one(lesson: dict, philosophy: str, grade_band: str, subject: str) -> dict:
    """Score a generated lesson using LLM judge."""
    phil_ctx = get_philosophy_context(philosophy)
    principles_summary = "\n".join(
        f"- {p['name']}: {p['description'][:100]}..."
        for p in phil_ctx.get("principles", [])[:30]  # Cap at 30 to fit context
    )

    eval_user = EVAL_PROMPT.format(
        philosophy=philosophy,
        grade_band=grade_band,
        subject=subject,
        interest=INTERESTS[grade_band],
        principles_summary=principles_summary,
        lesson_json=json.dumps(lesson, indent=2),
    )

    raw = _call_llm(
        "You are a rigorous lesson plan evaluator. Respond only with valid JSON.",
        eval_user,
        model=settings.openai_extraction_model,  # GPT-4.1 for eval (not 5.2)
        max_tokens=2048,
    )
    if raw.strip().startswith("```"):
        raw = raw.strip().split("\n", 1)[1].rsplit("```", 1)[0]
    return json.loads(raw)


def run_eval(
    philosophies: list[str] | None = None,
    quick: bool = False,
    dry_run: bool = False,
) -> list[dict]:
    """Run the full eval suite."""
    phils = philosophies or PHILOSOPHIES
    cases = []

    if quick:
        # 1 lesson per philosophy: grade 3-5, Math, space exploration
        for phil in phils:
            cases.append((phil, "3-5", "Math"))
    else:
        for phil in phils:
            for band in GRADE_BANDS:
                for subj in SUBJECTS:
                    cases.append((phil, band, subj))

    print(f"Eval suite: {len(cases)} lessons to generate and evaluate")
    if dry_run:
        for phil, band, subj in cases:
            print(f"  {phil} / {band} / {subj}")
        return []

    results = []
    for i, (phil, band, subj) in enumerate(cases, 1):
        print(f"\n[{i}/{len(cases)}] {phil} / {band} / {subj}")

        # Generate
        print(f"  Generating...", end=" ", flush=True)
        try:
            lesson = generate_one(phil, band, subj)
            print(f"OK ({lesson.get('title', '?')[:50]})")
        except Exception as e:
            print(f"FAILED: {e}")
            results.append({
                "philosophy": phil, "grade_band": band, "subject": subj,
                "error": str(e), "scores": None,
            })
            continue

        # Evaluate
        print(f"  Evaluating...", end=" ", flush=True)
        try:
            eval_result = evaluate_one(lesson, phil, band, subj)
            scores = eval_result.get("scores", {})
            overall = eval_result.get("overall_score", 0)
            print(f"OK (overall: {overall})")
        except Exception as e:
            print(f"FAILED: {e}")
            eval_result = {"error": str(e), "scores": None}
            scores = {}
            overall = 0

        results.append({
            "philosophy": phil,
            "grade_band": band,
            "subject": subj,
            "lesson_title": lesson.get("title", ""),
            "scores": scores,
            "overall_score": overall,
            "hallucinated_principles": eval_result.get("hallucinated_principles", []),
            "strengths": eval_result.get("strengths", []),
            "weaknesses": eval_result.get("weaknesses", []),
            "critical_issues": eval_result.get("critical_issues", []),
            "lesson": lesson,
        })

        time.sleep(1)  # Rate limit courtesy

    return results


def print_summary(results: list[dict]):
    """Print a summary table of eval results."""
    print(f"\n{'='*80}")
    print("  EVAL SUMMARY")
    print(f"{'='*80}")

    # Per-philosophy averages
    from collections import defaultdict
    phil_scores = defaultdict(list)
    dim_scores = defaultdict(list)
    all_hallucinated = []
    all_critical = []

    for r in results:
        if not r.get("scores"):
            continue
        phil_scores[r["philosophy"]].append(r["overall_score"])
        for dim, score in r["scores"].items():
            dim_scores[dim].append(score)
        all_hallucinated.extend(r.get("hallucinated_principles", []))
        all_critical.extend(r.get("critical_issues", []))

    print(f"\n{'Philosophy':<25} {'Avg':>5} {'Min':>5} {'Max':>5} {'N':>3}")
    print("-" * 45)
    for phil in PHILOSOPHIES:
        scores = phil_scores.get(phil, [])
        if scores:
            avg = sum(scores) / len(scores)
            print(f"{phil:<25} {avg:>5.1f} {min(scores):>5.1f} {max(scores):>5.1f} {len(scores):>3}")

    print(f"\n{'Dimension':<30} {'Avg':>5}")
    print("-" * 37)
    for dim in ["philosophy_alignment", "principle_grounding", "age_appropriateness",
                "standards_integration", "lesson_quality", "differentiation",
                "philosophy_distinctiveness"]:
        scores = dim_scores.get(dim, [])
        if scores:
            avg = sum(scores) / len(scores)
            print(f"{dim:<30} {avg:>5.2f}")

    if all_hallucinated:
        print(f"\nHallucinated principles ({len(all_hallucinated)}):")
        for h in set(all_hallucinated):
            print(f"  - {h}")

    if all_critical:
        print(f"\nCritical issues ({len(all_critical)}):")
        for c in all_critical:
            print(f"  - {c}")


def main():
    parser = argparse.ArgumentParser(description="Evaluate lesson generation against the KG")
    parser.add_argument("--philosophy", type=str, help="Evaluate a single philosophy")
    parser.add_argument("--quick", action="store_true", help="Quick smoke test (1 per philosophy)")
    parser.add_argument("--dry-run", action="store_true", help="Show test matrix without running")
    args = parser.parse_args()

    phils = [args.philosophy] if args.philosophy else None
    results = run_eval(philosophies=phils, quick=args.quick, dry_run=args.dry_run)

    if not results:
        return

    # Save results
    reports_dir = Path("reports")
    reports_dir.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    suffix = "-quick" if args.quick else ""
    report_path = reports_dir / f"lesson-eval{suffix}-{timestamp}.json"
    report_path.write_text(json.dumps(results, indent=2))
    print(f"\nResults saved: {report_path}")

    print_summary(results)


if __name__ == "__main__":
    main()
