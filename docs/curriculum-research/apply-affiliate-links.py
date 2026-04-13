#!/usr/bin/env python3
"""
Apply affiliate tracking links from the registration dashboard export
to all-curricula.json (and web/prisma copy).

Usage:
  # From a saved file:
  python3 apply-affiliate-links.py patch.json

  # From clipboard (macOS):
  pbpaste | python3 apply-affiliate-links.py

After running, you still need to seed the database:

  LOCAL:
    cd web && npx tsx prisma/seed-curricula.ts

  RAILWAY (production):
    railway run npx tsx prisma/seed-curricula.ts
    # or via Railway CLI:
    railway link   (if not already linked)
    railway run -- npx tsx prisma/seed-curricula.ts
"""

import json
import sys
from pathlib import Path

CURRICULA_PATH = Path(__file__).parent / "all-curricula.json"
WEB_CURRICULA_PATH = Path(__file__).parent.parent.parent / "web" / "prisma" / "all-curricula.json"


def main():
    # Read patch data from file arg or stdin
    if len(sys.argv) > 1:
        with open(sys.argv[1]) as f:
            patches = json.load(f)
    else:
        print("Reading JSON patch from stdin (paste and press Ctrl+D)...")
        patches = json.load(sys.stdin)

    if not patches:
        print("No patches to apply.")
        return

    # Read current curricula
    with open(CURRICULA_PATH) as f:
        curricula = json.load(f)

    # Build lookup: (name, publisher) -> index
    lookup = {}
    for i, c in enumerate(curricula):
        lookup[(c["name"], c["publisher"])] = i

    updated = 0
    skipped = []

    for patch in patches:
        key = (patch["curriculum_name"], patch["publisher"])
        if key in lookup:
            idx = lookup[key]
            old_url = curricula[idx].get("affiliate_url", "")
            new_url = patch["affiliate_url"]
            curricula[idx]["affiliate_url"] = new_url
            updated += 1
            print(f"  Updated: {patch['curriculum_name']}")
            if old_url:
                print(f"    was: {old_url}")
            print(f"    now: {new_url}")
        else:
            skipped.append(patch["curriculum_name"])
            print(f"  SKIPPED (not found): {patch['curriculum_name']} by {patch['publisher']}")

    # Write back to both locations
    for path in [CURRICULA_PATH, WEB_CURRICULA_PATH]:
        if path.exists():
            with open(path, "w") as f:
                json.dump(curricula, f, indent=2, ensure_ascii=False)
                f.write("\n")
            print(f"  Wrote: {path}")

    print(f"\n{'='*50}")
    print(f"Done. {updated} curricula updated, {len(skipped)} skipped.")
    print(f"{'='*50}")
    print()
    print("Next steps:")
    print("  1. Seed locally:   cd web && npx tsx prisma/seed-curricula.ts")
    print("  2. Seed Railway:   cd web && railway run npx tsx prisma/seed-curricula.ts")
    print("  3. Commit:         git add docs/curriculum-research/all-curricula.json web/prisma/all-curricula.json")


if __name__ == "__main__":
    main()
