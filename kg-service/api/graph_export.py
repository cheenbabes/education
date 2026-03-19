"""Export full graph data for the constellation visualization."""

from fastapi import APIRouter
import kuzu
from config import settings

router = APIRouter()

@router.get("/graph-export")
async def graph_export():
    db = kuzu.Database(str(settings.kuzu_db_path), read_only=True)
    conn = kuzu.Connection(db)

    # Philosophies
    r = conn.execute("MATCH (p:Philosophy) RETURN p.name, p.description")
    philosophies = []
    while r.has_next():
        row = r.get_next()
        philosophies.append({"name": row[0], "description": row[1]})

    # Count nodes per philosophy using philosophy_name field on Principle
    r = conn.execute("MATCH (pr:Principle) RETURN pr.philosophy_name, count(pr)")
    principle_counts = {}
    while r.has_next():
        row = r.get_next()
        principle_counts[row[0]] = row[1]

    # Activity counts via edge traversal
    r = conn.execute("""
        MATCH (ph:Philosophy)-[:VALUES]->(pr:Principle)-[:SUGGESTS]->(a:ActivityType)
        RETURN ph.name, count(DISTINCT a)
    """)
    activity_counts = {}
    while r.has_next():
        row = r.get_next()
        activity_counts[row[0]] = row[1]

    # Material counts via edge traversal
    r = conn.execute("""
        MATCH (ph:Philosophy)-[:VALUES]->(pr:Principle)-[:SUGGESTS]->(a:ActivityType)-[:USES]->(m:MaterialType)
        RETURN ph.name, count(DISTINCT m)
    """)
    material_counts = {}
    while r.has_next():
        row = r.get_next()
        material_counts[row[0]] = row[1]

    for p in philosophies:
        p["principleCount"] = principle_counts.get(p["name"], 0)
        p["activityCount"] = activity_counts.get(p["name"], 0)
        p["materialCount"] = material_counts.get(p["name"], 0)

    # Principles
    r = conn.execute("MATCH (pr:Principle) RETURN pr.id, pr.name, pr.description, pr.philosophy_name")
    principles = []
    while r.has_next():
        row = r.get_next()
        principles.append({"id": row[0], "name": row[1], "description": row[2], "philosophyId": row[3]})

    # Activities (via edge traversal to get philosophy)
    r = conn.execute("""
        MATCH (ph:Philosophy)-[:VALUES]->(pr:Principle)-[:SUGGESTS]->(a:ActivityType)
        RETURN DISTINCT a.id, a.name, a.description, a.indoor_outdoor, ph.name
    """)
    activities = []
    seen_acts = set()
    while r.has_next():
        row = r.get_next()
        if row[0] not in seen_acts:
            seen_acts.add(row[0])
            activities.append({"id": row[0], "name": row[1], "description": row[2], "indoorOutdoor": row[3], "philosophyId": row[4]})

    # Materials (via edge traversal)
    r = conn.execute("""
        MATCH (ph:Philosophy)-[:VALUES]->(pr:Principle)-[:SUGGESTS]->(a:ActivityType)-[:USES]->(m:MaterialType)
        RETURN DISTINCT m.id, m.name, m.category, ph.name
    """)
    materials = []
    seen_mats = set()
    while r.has_next():
        row = r.get_next()
        if row[0] not in seen_mats:
            seen_mats.add(row[0])
            materials.append({"id": row[0], "name": row[1], "category": row[2], "philosophyId": row[3]})

    return {
        "philosophies": philosophies,
        "principles": principles,
        "activities": activities,
        "materials": materials,
    }
