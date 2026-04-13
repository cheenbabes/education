import asyncio

import pytest
from fastapi import HTTPException

from api import standards as standards_api


def test_list_standards_returns_models_and_normalizes_state(monkeypatch):
    captured = {}

    def fake_get_standards(state, grade, subject):
        captured["args"] = (state, grade, subject)
        return [
            {
                "code": "3.MATH.1",
                "description": "Use place value understanding to round whole numbers.",
                "description_plain": "Round whole numbers using place value understanding.",
                "domain": "Number Sense",
                "cluster": "Place Value",
            }
        ]

    monkeypatch.setattr(standards_api, "get_standards", fake_get_standards)

    result = asyncio.run(standards_api.list_standards("mi", "3", "math"))

    assert captured["args"] == ("MI", "3", "math")
    assert result.state == "MI"
    assert result.grade == "3"
    assert result.subject == "math"
    assert result.count == 1
    assert result.standards[0].code == "3.MATH.1"
    assert result.standards[0].domain == "Number Sense"


def test_list_standards_raises_404_when_no_rows(monkeypatch):
    monkeypatch.setattr(standards_api, "get_standards", lambda *_: [])

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(standards_api.list_standards("mi", "3", "math"))

    assert exc_info.value.status_code == 404
    assert "No standards found" in exc_info.value.detail


def test_list_all_standards_groups_subjects_and_counts_total(monkeypatch):
    captured = {}

    def fake_all_standards(state, grade):
        captured["args"] = (state, grade)
        return {
            "science": [
                {
                    "code": "3.SCI.1",
                    "description": "Observe patterns in weather across the week.",
                    "description_plain": "Observe patterns in weather across the week.",
                }
            ],
            "math": [
                {
                    "code": "3.MATH.1",
                    "description": "Multiply and divide within 100.",
                    "description_plain": "Multiply and divide within 100.",
                },
                {
                    "code": "3.MATH.2",
                    "description": "Solve two-step word problems using the four operations.",
                    "description_plain": "Solve two-step word problems using the four operations.",
                },
            ],
        }

    monkeypatch.setattr(standards_api, "get_all_standards_for_grade", fake_all_standards)

    result = asyncio.run(standards_api.list_all_standards("wa", "3"))

    assert captured["args"] == ("WA", "3")
    assert result.state == "WA"
    assert result.total == 3
    assert [subject.subject for subject in result.subjects] == ["math", "science"]
    assert result.subjects[0].count == 2
    assert result.subjects[1].count == 1


def test_lookup_standards_returns_lookup_results(monkeypatch):
    monkeypatch.setattr(
        standards_api,
        "lookup_standards_by_codes",
        lambda codes: [
            {
                "code": code,
                "description": f"Description for {code}",
                "description_plain": f"Plain description for {code}",
            }
            for code in codes
        ],
    )

    result = asyncio.run(
        standards_api.lookup_standards(
            standards_api.LookupRequest(codes=["3.MATH.1", "3.SCI.1"])
        )
    )

    assert result == {
        "results": [
            {
                "code": "3.MATH.1",
                "description": "Description for 3.MATH.1",
                "description_plain": "Plain description for 3.MATH.1",
            },
            {
                "code": "3.SCI.1",
                "description": "Description for 3.SCI.1",
                "description_plain": "Plain description for 3.SCI.1",
            },
        ]
    }


def test_search_standards_flattens_subjects_and_returns_scored_results(monkeypatch):
    captured = {}

    def fake_all_standards(state, grade):
        captured["all_args"] = (state, grade)
        return {
            "math": [
                {
                    "code": "3.MATH.1",
                    "description": "Represent fractions on a number line diagram.",
                    "description_plain": "Represent fractions on a number line diagram.",
                    "domain": "Fractions",
                }
            ],
            "science": [
                {
                    "code": "3.SCI.1",
                    "description": "Construct explanations from evidence about habitats.",
                    "description_plain": "Construct explanations from evidence about habitats.",
                    "cluster": "Ecosystems",
                }
            ],
        }

    def fake_score(query, flat_rows):
        captured["score_args"] = (query, flat_rows)
        return [
            {
                "code": "3.SCI.1",
                "description": "Construct explanations from evidence about habitats.",
                "description_plain": "Construct explanations from evidence about habitats.",
                "subject": "science",
                "cluster": "Ecosystems",
                "score": 0.88,
            }
        ]

    monkeypatch.setattr(standards_api, "get_all_standards_for_grade", fake_all_standards)
    monkeypatch.setattr(standards_api, "score_standards", fake_score)

    result = asyncio.run(
        standards_api.search_standards(
            standards_api.SearchRequest(query="habitats", state="or", grade="3")
        )
    )

    assert captured["all_args"] == ("OR", "3")
    assert captured["score_args"][0] == "habitats"
    assert {row["subject"] for row in captured["score_args"][1]} == {"math", "science"}
    assert result.state == "OR"
    assert result.total == 1
    assert result.results[0].code == "3.SCI.1"
    assert result.results[0].subject == "science"
    assert result.results[0].score == 0.88
