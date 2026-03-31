"""Standards query endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from kg.query import get_standards, get_all_standards_for_grade, lookup_standards_by_codes
from kg.search import score_standards

router = APIRouter()


class StandardOut(BaseModel):
    code: str
    description: str
    description_plain: str
    domain: Optional[str] = None
    cluster: Optional[str] = None


class StandardsResponse(BaseModel):
    state: str
    grade: str
    subject: str
    standards: list[StandardOut]
    count: int


class SubjectStandards(BaseModel):
    subject: str
    standards: list[StandardOut]
    count: int


class AllStandardsResponse(BaseModel):
    state: str
    grade: str
    subjects: list[SubjectStandards]
    total: int


@router.get("/standards/{state}/{grade}/{subject}", response_model=StandardsResponse)
async def list_standards(state: str, grade: str, subject: str):
    """Return all standards for a given state / grade / subject."""
    rows = get_standards(state.upper(), grade, subject)

    if not rows:
        raise HTTPException(
            status_code=404,
            detail=f"No standards found for state={state}, grade={grade}, subject={subject}.",
        )

    return StandardsResponse(
        state=state.upper(),
        grade=grade,
        subject=subject,
        standards=[StandardOut(**r) for r in rows],
        count=len(rows),
    )


@router.get("/standards/{state}/{grade}", response_model=AllStandardsResponse)
async def list_all_standards(state: str, grade: str):
    """Return all standards for a state/grade grouped by subject. Single query."""
    by_subject = get_all_standards_for_grade(state.upper(), grade)

    subjects = []
    total = 0
    for subject_name, rows in sorted(by_subject.items()):
        stds = [StandardOut(**r) for r in rows]
        subjects.append(SubjectStandards(subject=subject_name, standards=stds, count=len(stds)))
        total += len(stds)

    return AllStandardsResponse(
        state=state.upper(),
        grade=grade,
        subjects=subjects,
        total=total,
    )


# ---------------------------------------------------------------------------
# Batch lookup by codes
# ---------------------------------------------------------------------------


class LookupRequest(BaseModel):
    codes: list[str] = Field(..., min_length=1, max_length=20)


class LookupItem(BaseModel):
    code: str
    description: str
    description_plain: str


@router.post("/standards/lookup")
async def lookup_standards(body: LookupRequest):
    """Look up standards by their codes. Returns descriptions for each."""
    results = lookup_standards_by_codes(body.codes)
    return {"results": results}


# ---------------------------------------------------------------------------
# Semantic search endpoint
# ---------------------------------------------------------------------------


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    state: str = Field(..., min_length=2, max_length=2)
    grade: str


class SearchResultItem(BaseModel):
    code: str
    description: str
    description_plain: str
    domain: Optional[str] = None
    cluster: Optional[str] = None
    subject: str
    score: float


class SearchResponse(BaseModel):
    query: str
    state: str
    grade: str
    results: list[SearchResultItem]
    total: int


@router.post("/search-standards", response_model=SearchResponse)
async def search_standards(body: SearchRequest):
    """Semantic keyword search across standards for a state/grade.

    Tokenises the query, expands with synonyms, and scores each standard
    by weighted keyword hits in description, domain, cluster, and code.
    Returns results ranked by relevance score (descending).
    """
    by_subject = get_all_standards_for_grade(body.state.upper(), body.grade)

    # Flatten standards with subject label
    flat: list[dict] = []
    for subject_name, rows in by_subject.items():
        for row in rows:
            flat.append({**row, "subject": subject_name})

    scored = score_standards(body.query, flat)

    results = [
        SearchResultItem(
            code=item["code"],
            description=item["description"],
            description_plain=item["description_plain"],
            domain=item.get("domain"),
            cluster=item.get("cluster"),
            subject=item["subject"],
            score=item["score"],
        )
        for item in scored
    ]

    return SearchResponse(
        query=body.query,
        state=body.state.upper(),
        grade=body.grade,
        results=results,
        total=len(results),
    )
