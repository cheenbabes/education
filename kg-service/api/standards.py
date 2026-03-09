"""GET /standards/{state}/{grade}/{subject} endpoint."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from kg.query import get_standards

router = APIRouter()


class StandardOut(BaseModel):
    code: str
    description: str
    description_plain: str
    domain: str
    cluster: str


class StandardsResponse(BaseModel):
    state: str
    grade: str
    subject: str
    standards: list[StandardOut]
    count: int


@router.get("/standards/{state}/{grade}/{subject}", response_model=StandardsResponse)
async def list_standards(state: str, grade: str, subject: str):
    """Return all standards for a given state / grade / subject in plain language."""
    rows = get_standards(state.upper(), grade, subject)

    if not rows:
        raise HTTPException(
            status_code=404,
            detail=f"No standards found for state={state}, grade={grade}, subject={subject}. "
                   "Standards data may not be loaded yet — run `python -m ingest.rebuild`.",
        )

    return StandardsResponse(
        state=state.upper(),
        grade=grade,
        subject=subject,
        standards=[StandardOut(**r) for r in rows],
        count=len(rows),
    )
