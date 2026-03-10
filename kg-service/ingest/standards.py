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
    "Language Arts": ["english language arts", "ela", "literacy"],
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
    """Load standards into the Kuzu graph for the given states.

    Fetches from the Common Standards Project API (with local caching).

    Args:
        conn: Kuzu connection.
        states: State abbreviations to load. None = all 50 states.

    Returns:
        Number of standards loaded.
    """
    all_standards = fetch_all_states(states)

    count = 0
    for state_abbr, standards in all_standards.items():
        for s in standards:
            conn.execute(
                "MERGE (st:Standard {code: $code}) "
                "SET st.description = $description, "
                "    st.description_plain = $plain, "
                "    st.domain = $domain, "
                "    st.cluster = $cluster",
                parameters={
                    "code": s["code"],
                    "description": s["description"],
                    "plain": s["description_plain"],
                    "domain": s["domain"],
                    "cluster": s["cluster"],
                },
            )
            # Link to state
            conn.execute(
                "MATCH (st:State {abbreviation: $state}), (s:Standard {code: $code}) "
                "MERGE (st)-[:HAS_STANDARD]->(s)",
                parameters={"state": s["state"], "code": s["code"]},
            )
            # Link to grade
            conn.execute(
                "MATCH (s:Standard {code: $code}), (g:Grade {level: $grade}) "
                "MERGE (s)-[:FOR_GRADE]->(g)",
                parameters={"code": s["code"], "grade": s["grade"]},
            )
            # Link to subject
            conn.execute(
                "MATCH (s:Standard {code: $code}), (sub:Subject {name: $subject}) "
                "MERGE (s)-[:FOR_SUBJECT]->(sub)",
                parameters={"code": s["code"], "subject": s["subject"]},
            )
            count += 1

    return count


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
