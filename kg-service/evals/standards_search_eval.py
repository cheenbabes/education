"""Eval harness for standards search.

Simulates what real homeschool parents would type into the /standards search
box and checks whether the top-ranked results are actually relevant.

Runs two rankers side-by-side:
  - keyword: the existing synonym + stem scorer (kg/search.py)
  - semantic: OpenAI embeddings cosine ranker (kg/embeddings.py)

Usage:
  # From the kg-service venv, with OPENAI_API_KEY set:
  python -m evals.standards_search_eval             # MI, grade 3, both rankers
  python -m evals.standards_search_eval --grade 5   # different grade
  python -m evals.standards_search_eval --state CA --grade 2

Each case has:
  - query: what a parent would actually type
  - expect_any: tokens where at least ONE should appear in the top-3 code or description
  - expect_subjects: subjects that should appear in top-5 (checks we don't drift)

The script prints a per-query summary, top-3 codes/descriptions from each ranker,
and a pass/fail judgment. Exit code is non-zero if semantic is worse than keyword
on net — useful for regression gating.
"""

from __future__ import annotations

import argparse
import os
import sys
from dataclasses import dataclass, field
from pathlib import Path


# Load .env before importing anything that reads OPENAI_API_KEY.
def _load_dotenv() -> None:
    path = Path(__file__).resolve().parent.parent / ".env"
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        val = val.strip().strip('"').strip("'")
        # .env overrides shell (same policy as main.py)
        os.environ[key] = val


_load_dotenv()

from kg.search import score_standards  # noqa: E402
from kg.embeddings import semantic_rank  # noqa: E402
from kg.query import get_all_standards_for_grade  # noqa: E402


@dataclass
class Case:
    query: str
    expect_any: list[str] = field(default_factory=list)
    expect_subjects: list[str] = field(default_factory=list)
    note: str = ""


# Queries a real homeschool parent of a grade 2-4 kid would plausibly type.
# These deliberately include conversational / fuzzy phrasing so we can tell
# whether the ranker handles more than just dictionary keywords.
CASES_GRADE_3: list[Case] = [
    Case(
        query="my kid needs to practice fractions",
        expect_any=["fraction", "numerator", "denominator", "equal part", "whole"],
        expect_subjects=["Math"],
        note="Obvious keyword — baseline both rankers should nail this.",
    ),
    Case(
        query="we're learning about animal habitats",
        expect_any=["habitat", "organism", "environment", "ecosystem", "plant and animal"],
        expect_subjects=["Science"],
    ),
    Case(
        query="she's struggling with reading aloud fluently",
        expect_any=["fluency", "read", "oral", "expression", "accuracy"],
        expect_subjects=["Language Arts", "English"],
        note="Conversational phrasing — keyword search often misses 'fluency'.",
    ),
    Case(
        query="how do I help him with handwriting",
        expect_any=["write", "handwrit", "print", "letter", "legible"],
        expect_subjects=["Language Arts", "English"],
        note="'Handwriting' not in synonym map — semantic should win.",
    ),
    Case(
        query="learning to tell time on a clock",
        expect_any=["time", "clock", "hour", "minute", "elapsed"],
        expect_subjects=["Math"],
    ),
    Case(
        query="we want to study the solar system and planets",
        expect_any=["solar", "planet", "space", "sun", "moon", "orbit", "star"],
        expect_subjects=["Science"],
    ),
    Case(
        query="understanding main idea in a story",
        expect_any=["main idea", "central", "detail", "key idea", "theme", "story"],
        expect_subjects=["Language Arts", "English"],
    ),
    Case(
        query="kids struggling with multiplication tables",
        expect_any=["multipl", "product", "factor", "times", "array"],
        expect_subjects=["Math"],
    ),
    Case(
        query="what causes the seasons",
        expect_any=["season", "earth", "sun", "weather", "climate", "pattern"],
        expect_subjects=["Science"],
        note="'Seasons' is in synonym map as a related term only.",
    ),
    Case(
        query="writing a paragraph with a topic sentence",
        expect_any=["paragraph", "topic", "write", "compose", "sentence", "opinion", "inform"],
        expect_subjects=["Language Arts", "English"],
    ),
    Case(
        query="my son wants to learn about dinosaurs",
        expect_any=["organism", "living", "animal", "fossil", "extinct", "plant and animal"],
        expect_subjects=["Science"],
        note="Dinosaurs rarely named in standards — semantic needs to bridge to life-science concepts.",
    ),
    Case(
        query="teach her about money and coins",
        expect_any=["money", "dollar", "cent", "coin", "value"],
        expect_subjects=["Math"],
    ),
    Case(
        query="how plants grow from a seed",
        expect_any=["plant", "seed", "grow", "life cycle", "organism", "living"],
        expect_subjects=["Science"],
    ),
    Case(
        query="american history for kids",
        expect_any=["history", "america", "united states", "government", "community", "past", "culture"],
        expect_subjects=["Social Studies"],
        note="Broad conversational — keyword search likely returns irrelevant hits.",
    ),
    Case(
        query="rounding numbers to the nearest ten",
        expect_any=["round", "nearest", "ten", "place value", "hundred"],
        expect_subjects=["Math"],
    ),
]


GREEN = "\033[32m"
RED = "\033[31m"
YELLOW = "\033[33m"
DIM = "\033[2m"
BOLD = "\033[1m"
RESET = "\033[0m"


def _flatten(by_subject: dict[str, list[dict]]) -> list[dict]:
    flat: list[dict] = []
    for subject, rows in by_subject.items():
        for row in rows:
            flat.append({**row, "subject": subject})
    return flat


def _contains_any(text: str, needles: list[str]) -> bool:
    lowered = text.lower()
    return any(n.lower() in lowered for n in needles)


def _check(top: list[dict], case: Case) -> tuple[bool, list[str]]:
    reasons: list[str] = []
    if not top:
        reasons.append("no results")
        return False, reasons

    top3 = top[:3]
    blob = " ".join((t.get("description_plain") or t.get("description") or "") + " " + t.get("code", "") for t in top3)
    if case.expect_any and not _contains_any(blob, case.expect_any):
        reasons.append(f"top-3 missing any of {case.expect_any}")

    if case.expect_subjects:
        top5_subjects = {t.get("subject", "") for t in top[:5]}
        if not any(s in top5_subjects for s in case.expect_subjects):
            reasons.append(f"top-5 subjects {top5_subjects} missed expected {case.expect_subjects}")

    return len(reasons) == 0, reasons


def _print_top(label: str, top: list[dict], width: int = 88):
    print(f"  {DIM}{label}:{RESET}")
    if not top:
        print(f"    (no results)")
        return
    for i, std in enumerate(top[:3], 1):
        desc = (std.get("description_plain") or std.get("description") or "").strip()
        if len(desc) > width - 20:
            desc = desc[: width - 23] + "..."
        score = std.get("score", 0.0)
        subject = std.get("subject", "?")
        print(f"    {i}. [{subject}] {std.get('code', '?'):<16} {DIM}({score:.2f}){RESET} {desc}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--state", default="MI")
    parser.add_argument("--grade", default="3")
    parser.add_argument("--min-score", type=float, default=0.25, help="semantic similarity floor")
    args = parser.parse_args()

    by_subject = get_all_standards_for_grade(args.state.upper(), args.grade)
    if not by_subject:
        print(f"{RED}No standards loaded for {args.state}/{args.grade}{RESET}")
        return 2
    flat = _flatten(by_subject)
    total = len(flat)
    print(f"{BOLD}Standards search eval — {args.state} grade {args.grade} ({total} standards){RESET}\n")

    cases = CASES_GRADE_3
    keyword_pass = 0
    semantic_pass = 0
    semantic_available = True

    for case in cases:
        print(f"{BOLD}Q:{RESET} {case.query}")
        if case.note:
            print(f"  {DIM}{case.note}{RESET}")

        kw_top = score_standards(case.query, flat)
        kw_ok, kw_reasons = _check(kw_top, case)
        tag = f"{GREEN}PASS{RESET}" if kw_ok else f"{RED}FAIL{RESET}"
        print(f"  keyword:  {tag}" + ("" if kw_ok else f" — {'; '.join(kw_reasons)}"))
        _print_top("keyword top-3", kw_top)

        sem_top = semantic_rank(case.query, flat, args.state, args.grade, min_score=args.min_score)
        if sem_top is None:
            print(f"  semantic: {YELLOW}unavailable (no OPENAI_API_KEY / API error){RESET}")
            semantic_available = False
        else:
            sem_ok, sem_reasons = _check(sem_top, case)
            tag = f"{GREEN}PASS{RESET}" if sem_ok else f"{RED}FAIL{RESET}"
            print(f"  semantic: {tag}" + ("" if sem_ok else f" — {'; '.join(sem_reasons)}"))
            _print_top("semantic top-3", sem_top)
            if sem_ok:
                semantic_pass += 1

        if kw_ok:
            keyword_pass += 1
        print()

    print(f"{BOLD}Summary{RESET}")
    print(f"  keyword:  {keyword_pass}/{len(cases)}")
    if semantic_available:
        print(f"  semantic: {semantic_pass}/{len(cases)}")
        if semantic_pass < keyword_pass:
            print(f"  {RED}regression: semantic underperforms keyword{RESET}")
            return 1
        if semantic_pass > keyword_pass:
            print(f"  {GREEN}improvement: +{semantic_pass - keyword_pass} queries handled correctly{RESET}")
    else:
        print(f"  {YELLOW}semantic ranker unavailable — skipping comparison{RESET}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
