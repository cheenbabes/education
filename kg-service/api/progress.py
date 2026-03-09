"""GET /progress/{child_id} endpoint."""

from __future__ import annotations

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

from kg.query import get_progress_summary

router = APIRouter()


class SubjectProgress(BaseModel):
    total: int
    completed: int
    remaining: int
    percent: float


class ProgressResponse(BaseModel):
    child_id: str
    state: str
    grade: str
    subjects: dict[str, SubjectProgress]


@router.get("/progress/{child_id}", response_model=ProgressResponse)
async def child_progress(
    child_id: str,
    state: str = Query(default="OR", description="State abbreviation"),
    grade: str = Query(default="2", description="Grade level (K, 1-12)"),
    completed: list[str] = Query(default=[], description="List of completed standard codes"),
):
    """Return per-subject progress summary for a child.

    Pass completed standard codes as repeated query params:
    /progress/child1?state=OR&grade=2&completed=2.OA.1&completed=2.MD.1
    """
    summary = get_progress_summary(completed, state.upper(), grade)

    return ProgressResponse(
        child_id=child_id,
        state=state.upper(),
        grade=grade,
        subjects={k: SubjectProgress(**v) for k, v in summary.items()},
    )
