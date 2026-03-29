"""Standards query endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from kg.query import get_standards, get_all_standards_for_grade

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
