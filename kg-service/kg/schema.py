"""Kuzu node and relationship type definitions for the education knowledge graph."""

from __future__ import annotations

# ---------- Node table DDL ----------

NODE_TABLES: list[str] = [
    """
    CREATE NODE TABLE State (
        abbreviation STRING,
        name STRING,
        PRIMARY KEY (abbreviation)
    )
    """,
    """
    CREATE NODE TABLE Grade (
        level STRING,
        age_range_low INT16,
        age_range_high INT16,
        PRIMARY KEY (level)
    )
    """,
    """
    CREATE NODE TABLE Subject (
        name STRING,
        PRIMARY KEY (name)
    )
    """,
    """
    CREATE NODE TABLE Standard (
        code STRING,
        description STRING,
        description_plain STRING,
        domain STRING,
        cluster STRING,
        PRIMARY KEY (code)
    )
    """,
    """
    CREATE NODE TABLE Philosophy (
        name STRING,
        description STRING,
        disclaimer STRING,
        PRIMARY KEY (name)
    )
    """,
    """
    CREATE NODE TABLE Principle (
        id STRING,
        name STRING,
        description STRING,
        philosophy_name STRING,
        PRIMARY KEY (id)
    )
    """,
    """
    CREATE NODE TABLE ActivityType (
        id STRING,
        name STRING,
        description STRING,
        indoor_outdoor STRING,
        age_range_low INT16,
        age_range_high INT16,
        PRIMARY KEY (id)
    )
    """,
    """
    CREATE NODE TABLE MaterialType (
        id STRING,
        name STRING,
        category STRING,
        household_alternative STRING,
        PRIMARY KEY (id)
    )
    """,
    """
    CREATE NODE TABLE DevelopmentalMilestone (
        id STRING,
        description STRING,
        domain STRING,
        age_range_low INT16,
        age_range_high INT16,
        PRIMARY KEY (id)
    )
    """,
]

# ---------- Relationship table DDL ----------

REL_TABLES: list[str] = [
    "CREATE REL TABLE HAS_STANDARD (FROM State TO Standard)",
    "CREATE REL TABLE FOR_GRADE (FROM Standard TO Grade)",
    "CREATE REL TABLE FOR_SUBJECT (FROM Standard TO Subject)",
    "CREATE REL TABLE OVERLAPS_WITH (FROM Standard TO Standard, overlap_type STRING)",
    "CREATE REL TABLE VALUES (FROM Philosophy TO Principle)",
    "CREATE REL TABLE SUGGESTS (FROM Principle TO ActivityType)",
    "CREATE REL TABLE USES (FROM ActivityType TO MaterialType)",
    "CREATE REL TABLE HAS_MILESTONE (FROM Grade TO DevelopmentalMilestone)",
]


def create_schema(conn) -> None:
    """Drop existing tables and create fresh schema."""
    # Drop relationship tables first (order matters for foreign keys)
    for stmt in reversed(REL_TABLES):
        table_name = stmt.split("TABLE")[1].strip().split()[0]
        try:
            conn.execute(f"DROP TABLE {table_name}")
        except Exception:
            pass

    for stmt in reversed(NODE_TABLES):
        table_name = stmt.split("TABLE")[1].strip().split("(")[0].strip()
        try:
            conn.execute(f"DROP TABLE {table_name}")
        except Exception:
            pass

    for stmt in NODE_TABLES:
        conn.execute(stmt)
    for stmt in REL_TABLES:
        conn.execute(stmt)
