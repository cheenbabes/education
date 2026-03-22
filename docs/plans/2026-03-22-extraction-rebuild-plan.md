# Extraction Rebuild & Conflict Detection Plan — 2026-03-22

After auditing and rebalancing philosophy sources, we need to:
1. Extract all new sources (16 pending-extraction files)
2. Rebuild the knowledge graph
3. Run conflict detection across principles within each philosophy
4. Generate a dashboard of the new KG state

---

## Phase 1: Extract new sources

The pipeline caches by file SHA256 + extraction version. Existing extractions
for unchanged files will be reused. Only the 16 new files need LLM calls.

```bash
cd kg-service && source .venv/bin/activate
python -m ingest.extract --all
```

### New files to extract (by philosophy):

| Philosophy | New Files | Type | Est. Chunks |
|---|---|---|---|
| adaptive | Tomlinson-Differentiated_Classroom.epub | EPUB | ~3-4 |
| adaptive | Tomlinson-McTighe-Integrating_DI_and_UbD.pdf | PDF (210p) | ~2-3 |
| adaptive | CAST-UDL_Guidelines_v2.2_Full_Text.pdf | PDF (149p) | ~1-2 |
| adaptive | CAST-UDL_Guidelines_v3.0_Full_Text.txt | TXT (14KB) | 1 |
| adaptive | CAST-UDL_Guidelines_v3.0_Graphic_Organizer.pdf | PDF (1p) | 1 |
| adaptive | Gardner-Frames_of_Mind.epub | EPUB | ~4-5 |
| charlotte-mason | Macaulay-For_the_Childrens_Sake.pdf | PDF (180p) | ~2 |
| classical | Bauer-Well_Trained_Mind.epub | EPUB (224 sections) | ~5-8 |
| classical | Wilson-Recovering_Lost_Tools_of_Learning.epub | EPUB | ~2-3 |
| classical | Adler-Paideia_Proposal.pdf | PDF (100p) | ~1-2 |
| classical | Adler-How_to_Read_a_Book_1972.pdf | PDF (442p) | ~4-5 |
| place-nature-based | Smith-Sobel-Place_Community_Based_Education.epub | EPUB | ~2-3 |
| place-nature-based | Louv-Last_Child_in_the_Woods.epub | EPUB | ~3-4 |
| project-based-learning | Dewey-Experience_and_Education.pdf | PDF (40p) | 1 |
| project-based-learning | Larmer-Setting_Standard_for_PBL.pdf | PDF (258p) | ~3-4 |
| unschooling | Holt-How_Children_Learn.pdf | PDF (146p) | ~1-2 |

**Estimated total: ~35-50 chunks × 2s rate limit = ~2-3 minutes LLM time**
(plus text extraction overhead, ~5-10 min total)

### Gotchas:
- `.txt` files: Pipeline globs `*.pdf` and `*.epub` only. The CAST v3.0 text file
  may need to be handled separately or the glob extended.
- Adler PDF first ~4 pages are scanned images (title/copyright) — rest is text, fine.
- Pipeline handles EPUBs natively via PyMuPDF.

---

## Phase 2: Rebuild the KG

```bash
python -m ingest.rebuild --force --states MI
```

Uses CSV bulk loading (fast). Rebuilds all node tables:
Philosophy → Principle → ActivityType → MaterialType

Estimated time: ~2-3 minutes for MI-only, ~30-45 min for all 50 states.

---

## Phase 3: Conflict detection

After rebuild, run a per-philosophy conflict analysis. For each philosophy:

1. Load all extracted principles from `kg-service/extracted/{philosophy}/*.json`
2. Send to LLM with a conflict detection prompt:
   - **Duplicates**: Principles that say the same thing in different words
   - **Contradictions**: Principles that directly conflict
   - **Tension**: Principles that pull in different directions but aren't outright contradictory
   - **Source attribution**: Which source file each principle came from

### Conflict detection script approach:

```python
# For each philosophy:
#   1. Gather all principles with source attribution
#   2. Send to GPT-4.1 with conflict detection prompt
#   3. Output: duplicates, contradictions, tensions
#   4. Generate summary report
```

Output: `kg-service/reports/conflict-detection-{timestamp}.json`

---

## Phase 4: Dashboard

After extraction + rebuild, generate a dashboard showing:

| Philosophy | Sources | T1 | T2 | T3 | Principles | Activities | Materials | Conflicts | Duplicates |
|---|---|---|---|---|---|---|---|---|---|

Plus per-philosophy detail:
- List of all principles with source attribution
- Any flagged conflicts or duplicates
- Principle count delta vs. previous extraction

---

## Phase 5: Eval plan for lesson generation

Separate plan — after conflicts are resolved:
1. Generate 1 sample lesson per philosophy per grade band (K-2, 3-5, 6-8)
2. Check lessons reference principles from the KG
3. Verify no hallucinated principles
4. Check balance across philosophies
5. Expert review rubric
