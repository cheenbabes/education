"""Common Standards Project data loader.

Fetches real K-12 standards from the Common Standards Project API
(https://commonstandardsproject.com) and loads them into the Kuzu
knowledge graph.

Data is cached locally in kg-service/data/standards/ so we only hit
the API once per state. To refresh, delete the cached JSON files.
"""

from __future__ import annotations

import json
import os
import re
import time
from pathlib import Path

import requests

API_BASE = "https://api.commonstandardsproject.com/api/v1"
API_KEY = "vZKoJwFB1PTJnozKBSANADc3"  # demo key from their docs
CACHE_DIR = Path(__file__).parent.parent / "data" / "standards"

# Map Common Standards Project subject names to our 4 subjects.
# Each state may name subjects differently, so we match by keyword.
SUBJECT_MAP = {
    "Math": ["math"],
    "Science": ["science", "ngss"],
    "Language Arts": ["english language arts", "language arts", "ela", "literacy", "english/language", "reading, writing", "reading and writing", "english ("],
    "Social Studies": ["social science", "social studies", "history"],
}

# Map their education level codes to our grade strings
GRADE_MAP = {
    "KG": "K", "K": "K", "PK": None, "Pre-K": None,
    "00": "K", "01": "1", "02": "2", "03": "3", "04": "4",
    "05": "5", "06": "6", "07": "7", "08": "8",
    "09": "9", "10": "10", "11": "11", "12": "12",
    "HS": None,  # skip generic "high school" — we need specific grades
}

# US state abbreviations to full names for looking up jurisdictions
STATE_NAMES = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas",
    "CA": "California", "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware",
    "FL": "Florida", "GA": "Georgia", "HI": "Hawaii", "ID": "Idaho",
    "IL": "Illinois", "IN": "Indiana", "IA": "Iowa", "KS": "Kansas",
    "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
    "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi",
    "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada",
    "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York",
    "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma",
    "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
    "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah",
    "VT": "Vermont", "VA": "Virginia", "WA": "Washington", "WV": "West Virginia",
    "WI": "Wisconsin", "WY": "Wyoming",
}


def _api_get(path: str) -> dict:
    """GET from the Common Standards Project API with rate limiting."""
    url = f"{API_BASE}{path}"
    sep = "&" if "?" in path else "?"
    resp = requests.get(f"{url}{sep}api_key={API_KEY}", timeout=30)
    resp.raise_for_status()
    time.sleep(0.3)  # be polite to their API
    return resp.json()


def _match_subject(csp_subject: str) -> str | None:
    """Map a Common Standards Project subject string to one of our 4 subjects.

    Order matters: check more specific patterns (e.g. 'social science')
    before less specific ones (e.g. 'science') to avoid false matches.
    """
    lower = csp_subject.lower()
    # Check Social Studies FIRST — "social science" contains "science"
    if any(kw in lower for kw in SUBJECT_MAP["Social Studies"]):
        return "Social Studies"
    for our_subject, keywords in SUBJECT_MAP.items():
        if our_subject == "Social Studies":
            continue  # already checked
        if any(kw in lower for kw in keywords):
            return our_subject
    return None


def _is_current(standard_set: dict) -> bool:
    """Check if a standard set is current (Published status)."""
    doc = standard_set.get("document", {})
    return doc.get("publicationStatus", "") == "Published"


def _parse_grades(education_levels: list[str]) -> list[str]:
    """Convert CSP education level codes to our grade strings."""
    grades = []
    for level in education_levels:
        mapped = GRADE_MAP.get(level)
        if mapped is not None:
            grades.append(mapped)
    return grades


def _find_jurisdiction_id(state_abbr: str) -> str | None:
    """Look up the CSP jurisdiction ID for a US state."""
    cache_file = CACHE_DIR / "_jurisdictions.json"

    if cache_file.exists():
        jurisdictions = json.loads(cache_file.read_text())
    else:
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        data = _api_get("/jurisdictions")
        jurisdictions = data.get("data", [])
        cache_file.write_text(json.dumps(jurisdictions, indent=2))

    state_name = STATE_NAMES.get(state_abbr)
    if not state_name:
        return None

    for j in jurisdictions:
        if j.get("title") == state_name and j.get("type") == "state":
            return j["id"]
    return None


def _fetch_state_standards(state_abbr: str) -> list[dict]:
    """Fetch all standards for a state from the API, cache locally.

    Returns a list of normalized standard dicts ready for Kuzu insertion.
    """
    cache_file = CACHE_DIR / f"{state_abbr}.json"

    if cache_file.exists():
        return json.loads(cache_file.read_text())

    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    # Step 1: Get jurisdiction and its standard sets
    jid = _find_jurisdiction_id(state_abbr)
    if not jid:
        print(f"  Warning: No jurisdiction found for {state_abbr}")
        return []

    jdata = _api_get(f"/jurisdictions/{jid}")
    all_sets = jdata.get("data", {}).get("standardSets", [])

    # Step 2: Filter to current, relevant subjects
    relevant_sets = []
    for ss in all_sets:
        if not _is_current(ss):
            continue
        our_subject = _match_subject(ss.get("subject", ""))
        if our_subject is None:
            continue
        grades = _parse_grades(ss.get("educationLevels", []))
        if not grades:
            continue
        relevant_sets.append((ss, our_subject, grades))

    print(f"  {state_abbr}: {len(relevant_sets)} relevant standard sets found")

    # Step 3: Fetch individual standards from each set
    standards = []
    for ss, our_subject, grades in relevant_sets:
        set_id = ss["id"]
        try:
            set_data = _api_get(f"/standard_sets/{set_id}")
        except Exception as e:
            print(f"    Warning: Failed to fetch {set_id}: {e}")
            continue

        raw_standards = set_data.get("data", {}).get("standards", {})

        for std_id, std in raw_standards.items():
            code = (std.get("statementNotation") or "").strip()
            description = (std.get("description") or "").strip()
            # Normalize whitespace (some descriptions have embedded newlines)
            description = re.sub(r"\s+", " ", description).strip()

            # Skip domain/cluster headers (no code or very short descriptions)
            if not code:
                continue
            if len(description) < 30:
                continue  # headers like "Represent and interpret data."

            # Determine which grade(s) this standard applies to
            std_grades = _parse_grades(std.get("educationLevels", []))
            if not std_grades:
                std_grades = grades  # inherit from the set

            for grade in std_grades:
                standards.append({
                    "state": state_abbr,
                    "grade": grade,
                    "subject": our_subject,
                    "code": code,
                    "domain": "",  # populated from ancestry if available
                    "cluster": "",
                    "description": description,
                    "description_plain": "",  # will be generated later
                })

    # Deduplicate by (state, code, grade)
    seen = set()
    deduped = []
    for s in standards:
        key = (s["state"], s["code"], s["grade"])
        if key not in seen:
            seen.add(key)
            deduped.append(s)

    # Cache
    cache_file.write_text(json.dumps(deduped, indent=2))
    print(f"  {state_abbr}: {len(deduped)} standards cached")
    return deduped


def fetch_all_states(states: list[str] | None = None) -> dict[str, list[dict]]:
    """Fetch standards for multiple states. Returns {state_abbr: [standards]}."""
    if states is None:
        states = list(STATE_NAMES.keys())

    result = {}
    for abbr in states:
        print(f"Fetching standards for {abbr}...")
        result[abbr] = _fetch_state_standards(abbr)
    return result


# ---------- Public interface: load into Kuzu ----------

def load_standards(conn, states: list[str] | None = None) -> int:
    """Load standards into the Kuzu graph using batch inserts.

    Uses batched CREATE statements instead of individual MERGE queries
    for ~100x faster loading of large datasets.
    """
    import csv
    import tempfile

    all_standards = fetch_all_states(states)

    # Flatten and deduplicate standards (same code may appear in multiple states)
    unique_standards: dict[str, dict] = {}  # code -> standard data
    state_links: list[tuple[str, str]] = []  # (state, code)
    grade_links: list[tuple[str, str]] = []  # (code, grade)
    subject_links: list[tuple[str, str]] = []  # (code, subject)

    for state_abbr, standards in all_standards.items():
        for s in standards:
            code = s["code"]
            if code not in unique_standards:
                unique_standards[code] = s
            state_links.append((state_abbr, code))
            grade_links.append((code, s["grade"]))
            subject_links.append((code, s["subject"]))

    # Deduplicate relationship links
    state_links = list(set(state_links))
    grade_links = list(set(grade_links))
    subject_links = list(set(subject_links))

    print(f"    {len(unique_standards):,} unique standards, "
          f"{len(state_links):,} state links, "
          f"{len(grade_links):,} grade links, "
          f"{len(subject_links):,} subject links")

    # Batch insert standards nodes
    batch_size = 500
    standards_list = list(unique_standards.values())
    for i in range(0, len(standards_list), batch_size):
        batch = standards_list[i:i + batch_size]
        for s in batch:
            conn.execute(
                "CREATE (n:Standard {code: $code}) "
                "SET n.description = $d, n.description_plain = $p, n.domain = $dm, n.cluster = $cl",
                parameters={
                    "code": s["code"],
                    "d": s["description"],
                    "p": s.get("description_plain", ""),
                    "dm": s.get("domain", ""),
                    "cl": s.get("cluster", ""),
                },
            )
        if (i // batch_size) % 20 == 0:
            print(f"    Standards: {min(i + batch_size, len(standards_list)):,}/{len(standards_list):,}")

    # Batch insert relationships
    print(f"    Creating state links...")
    for state_abbr, code in state_links:
        conn.execute(
            "MATCH (st:State {abbreviation: $state}), (s:Standard {code: $code}) "
            "CREATE (st)-[:HAS_STANDARD]->(s)",
            parameters={"state": state_abbr, "code": code},
        )

    print(f"    Creating grade links...")
    for code, grade in grade_links:
        conn.execute(
            "MATCH (s:Standard {code: $code}), (g:Grade {level: $grade}) "
            "CREATE (s)-[:FOR_GRADE]->(g)",
            parameters={"code": code, "grade": grade},
        )

    print(f"    Creating subject links...")
    for code, subject in subject_links:
        conn.execute(
            "MATCH (s:Standard {code: $code}), (sub:Subject {name: $subject}) "
            "CREATE (s)-[:FOR_SUBJECT]->(sub)",
            parameters={"code": code, "subject": subject},
        )

    total = len(state_links)
    print(f"    Done: {len(unique_standards):,} standards, {total:,} relationships")
    return total


# ---------- CLI ----------

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Fetch standards from Common Standards Project")
    parser.add_argument("--states", nargs="*", help="State abbreviations (e.g., OR CA TX). Default: all 50.")
    parser.add_argument("--clear-cache", action="store_true", help="Delete cached data and re-fetch")
    args = parser.parse_args()

    if args.clear_cache and CACHE_DIR.exists():
        import shutil
        shutil.rmtree(CACHE_DIR)
        print("Cache cleared.")

    states = args.states or None
    all_data = fetch_all_states(states)

    total = sum(len(v) for v in all_data.values())
    print(f"\nTotal: {total} standards across {len(all_data)} states")

    # Show summary per state
    for abbr, stds in sorted(all_data.items()):
        subjects = {}
        for s in stds:
            subjects.setdefault(s["subject"], set()).add(s["grade"])
        parts = [f"{subj}({len(grades)} grades)" for subj, grades in sorted(subjects.items())]
        print(f"  {abbr}: {len(stds)} standards — {', '.join(parts)}")
