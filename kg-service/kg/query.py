"""Graph traversal functions for querying the education knowledge graph."""

from __future__ import annotations

import kuzu

from config import settings


def _get_connection() -> kuzu.Connection:
    db = kuzu.Database(str(settings.kuzu_db_path))
    return kuzu.Connection(db)


def get_standards(
    state: str, grade: str, subject: str, conn: kuzu.Connection | None = None
) -> list[dict]:
    """Return all standards for a given state / grade / subject."""
    conn = conn or _get_connection()
    result = conn.execute(
        """
        MATCH (st:State)-[:HAS_STANDARD]->(s:Standard)-[:FOR_GRADE]->(g:Grade),
              (s)-[:FOR_SUBJECT]->(sub:Subject)
        WHERE st.abbreviation = $state
          AND g.level = $grade
          AND sub.name = $subject
        RETURN s.code AS code,
               s.description AS description,
               s.description_plain AS description_plain,
               s.domain AS domain,
               s.cluster AS cluster
        """,
        parameters={"state": state, "grade": grade, "subject": subject},
    )
    rows = []
    while result.has_next():
        row = result.get_next()
        rows.append(
            {
                "code": row[0],
                "description": row[1],
                "description_plain": row[2],
                "domain": row[3],
                "cluster": row[4],
            }
        )
    return rows


def get_philosophy_context(philosophy: str, conn: kuzu.Connection | None = None) -> dict:
    """Return philosophy info, principles, activity types, and materials."""
    conn = conn or _get_connection()

    # Philosophy node
    res = conn.execute(
        """
        MATCH (p:Philosophy)
        WHERE p.name = $name
        RETURN p.name, p.description, p.disclaimer
        """,
        parameters={"name": philosophy},
    )
    phil = None
    if res.has_next():
        r = res.get_next()
        phil = {"name": r[0], "description": r[1], "disclaimer": r[2]}

    # Principles
    res = conn.execute(
        """
        MATCH (p:Philosophy)-[:VALUES]->(pr:Principle)
        WHERE p.name = $name
        RETURN pr.name, pr.description
        """,
        parameters={"name": philosophy},
    )
    principles = []
    while res.has_next():
        r = res.get_next()
        principles.append({"name": r[0], "description": r[1]})

    # Activity types via principles
    res = conn.execute(
        """
        MATCH (p:Philosophy)-[:VALUES]->(pr:Principle)-[:SUGGESTS]->(a:ActivityType)
        WHERE p.name = $name
        RETURN DISTINCT a.name, a.description, a.indoor_outdoor,
               a.age_range_low, a.age_range_high
        """,
        parameters={"name": philosophy},
    )
    activities = []
    while res.has_next():
        r = res.get_next()
        activities.append(
            {
                "name": r[0],
                "description": r[1],
                "indoor_outdoor": r[2],
                "age_range_low": r[3],
                "age_range_high": r[4],
            }
        )

    # Materials via activity types
    res = conn.execute(
        """
        MATCH (p:Philosophy)-[:VALUES]->(:Principle)-[:SUGGESTS]->(a:ActivityType)-[:USES]->(m:MaterialType)
        WHERE p.name = $name
        RETURN DISTINCT m.name, m.category, m.household_alternative
        """,
        parameters={"name": philosophy},
    )
    materials = []
    while res.has_next():
        r = res.get_next()
        materials.append(
            {"name": r[0], "category": r[1], "household_alternative": r[2]}
        )

    return {
        "philosophy": phil,
        "principles": principles,
        "activities": activities,
        "materials": materials,
    }


def get_milestones(grade: str, conn: kuzu.Connection | None = None) -> list[dict]:
    """Return developmental milestones for a grade."""
    conn = conn or _get_connection()
    res = conn.execute(
        """
        MATCH (g:Grade)-[:HAS_MILESTONE]->(m:DevelopmentalMilestone)
        WHERE g.level = $grade
        RETURN m.description, m.domain, m.age_range_low, m.age_range_high
        """,
        parameters={"grade": grade},
    )
    rows = []
    while res.has_next():
        r = res.get_next()
        rows.append(
            {
                "description": r[0],
                "domain": r[1],
                "age_range_low": r[2],
                "age_range_high": r[3],
            }
        )
    return rows


def get_overlapping_standards(
    standard_code: str, conn: kuzu.Connection | None = None
) -> list[dict]:
    """Return standards that overlap with the given standard."""
    conn = conn or _get_connection()
    res = conn.execute(
        """
        MATCH (s1:Standard)-[o:OVERLAPS_WITH]->(s2:Standard)
        WHERE s1.code = $code
        RETURN s2.code, s2.description_plain, o.overlap_type
        """,
        parameters={"code": standard_code},
    )
    rows = []
    while res.has_next():
        r = res.get_next()
        rows.append(
            {"code": r[0], "description_plain": r[1], "overlap_type": r[2]}
        )
    return rows


def get_progress_summary(
    completed_codes: list[str], state: str, grade: str, conn: kuzu.Connection | None = None
) -> dict:
    """Return per-subject progress given completed standard codes."""
    conn = conn or _get_connection()

    # Total standards per subject for this state/grade
    res = conn.execute(
        """
        MATCH (st:State)-[:HAS_STANDARD]->(s:Standard)-[:FOR_GRADE]->(g:Grade),
              (s)-[:FOR_SUBJECT]->(sub:Subject)
        WHERE st.abbreviation = $state AND g.level = $grade
        RETURN sub.name AS subject, count(s) AS total
        """,
        parameters={"state": state, "grade": grade},
    )
    totals: dict[str, int] = {}
    while res.has_next():
        r = res.get_next()
        totals[r[0]] = r[1]

    # Count completed per subject
    if completed_codes:
        res = conn.execute(
            """
            MATCH (s:Standard)-[:FOR_SUBJECT]->(sub:Subject)
            WHERE s.code IN $codes
            RETURN sub.name AS subject, count(s) AS completed
            """,
            parameters={"codes": completed_codes},
        )
    completed: dict[str, int] = {}
    if completed_codes:
        while res.has_next():
            r = res.get_next()
            completed[r[0]] = r[1]

    summary = {}
    for subject, total in totals.items():
        done = completed.get(subject, 0)
        summary[subject] = {
            "total": total,
            "completed": done,
            "remaining": total - done,
            "percent": round(done / total * 100, 1) if total > 0 else 0,
        }
    return summary
