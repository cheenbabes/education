import asyncio

from api import progress as progress_api


def test_child_progress_normalizes_state_and_builds_subject_models(monkeypatch):
    captured = {}

    def fake_summary(completed, state, grade):
        captured["args"] = (completed, state, grade)
        return {
            "math": {
                "total": 12,
                "completed": 3,
                "remaining": 9,
                "percent": 25.0,
            },
            "science": {
                "total": 8,
                "completed": 2,
                "remaining": 6,
                "percent": 25.0,
            },
        }

    monkeypatch.setattr(progress_api, "get_progress_summary", fake_summary)

    result = asyncio.run(
        progress_api.child_progress(
            "child_1",
            state="mi",
            grade="4",
            completed=["4.MATH.1", "4.SCI.2"],
        )
    )

    assert captured["args"] == (["4.MATH.1", "4.SCI.2"], "MI", "4")
    assert result.child_id == "child_1"
    assert result.state == "MI"
    assert result.grade == "4"
    assert result.subjects["math"].completed == 3
    assert result.subjects["science"].remaining == 6


def test_child_progress_accepts_the_route_default_values(monkeypatch):
    captured = {}

    def fake_summary(completed, state, grade):
        captured["args"] = (completed, state, grade)
        return {}

    monkeypatch.setattr(progress_api, "get_progress_summary", fake_summary)

    result = asyncio.run(
        progress_api.child_progress("child_2", state="OR", grade="2", completed=[])
    )

    assert captured["args"] == ([], "OR", "2")
    assert result.child_id == "child_2"
    assert result.state == "OR"
    assert result.grade == "2"
    assert result.subjects == {}
