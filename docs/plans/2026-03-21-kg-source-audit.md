# Knowledge Graph Source Audit — 2026-03-21

Rebalance philosophy reference library to 5-8 sources per philosophy,
tiered as **T1 Foundational / T2 Commentary / T3 Supplemental**,
targeting ~60-80 extracted principles each.

Current state: 8 to 121 principles per philosophy (15x spread).

---

## 1. Create source manifest system

- [ ] Create `docs/philosophy-references/manifest.yaml` with per-philosophy entries
- [ ] Each entry: filename, tier (T1/T2/T3), title, author, year, rationale for inclusion
- [ ] Update extraction pipeline to read manifest and tag principles with source tier
- [ ] This becomes the single source of truth for what's in the KG and why

---

## 2. Classical — CRITICAL (8 principles today, need ~60-80)

**Status:** Only Sayers essay extracted. Catastrophically thin.

- [ ] **Acquire T1:** *The Well-Trained Mind* (Bauer & Wise, 4th ed.) — ~$40, the classical homeschool bible. Stage-by-stage activities/materials K-12. Highest-impact single addition across the entire KG.
- [ ] **Acquire T2:** *Recovering the Lost Tools of Learning* (Douglas Wilson) — Archive.org borrow. Practical school model, Grammar→Rhetoric structure.
- [ ] **Acquire T2:** *The Paideia Proposal* (Mortimer Adler) — Archive.org borrow. Three pedagogical modes (didactic, coached, Socratic).
- [ ] **Acquire T2:** *How to Read a Book* (Adler, 1972 revised) — Archive.org borrow. Reading skill levels map to Trivium stages.
- [ ] Keep T1: `Sayers-Lost_Tools_of_Learning.pdf` (already extracted)
- [ ] Keep T3: `ClassicalConversations-What_is_the_Trivium.txt` (already extracted)
- [ ] Re-extract after acquisitions

---

## 3. Adaptive — IDENTITY PROBLEM (36 principles, wrong sources)

**Status:** 4 docs are developmental checklists and Core Knowledge sequences — none are *about* adaptive education as a philosophy. Need to ground it in differentiated instruction / UDL literature.

- [ ] **Decide:** Is "adaptive" a real philosophy with its own literature, or a meta-approach that blends differentiated instruction + developmental awareness? (Answer shapes everything below.)
- [ ] **Acquire T1:** *The Differentiated Classroom* (Carol Ann Tomlinson) — the canonical text on responsive teaching by readiness, interest, and learning profile
- [ ] **Acquire T1:** *Integrating Differentiated Instruction & Understanding by Design* (Tomlinson & McTighe) — bridges adaptive teaching with backward design
- [ ] **Acquire T2:** UDL Guidelines (CAST, free) — Universal Design for Learning framework
- [ ] **Acquire T2:** *Frames of Mind* (Howard Gardner) — multiple intelligences, foundational to "adapt to the learner"
- [ ] Reclassify existing CDC/Core Knowledge docs as T3 supplemental
- [ ] Re-extract with new sources

---

## 4. Place-Nature-Based — NO FOUNDATIONAL TEXTS (67 principles, all secondary)

**Status:** 8 ERIC papers and practical guides. Good secondary material but no anchor texts.

- [ ] **Acquire T1:** *Place-Based Education* (David Sobel) — the defining text. Already in directory but noted as scanned/unextractable image PDF. Find a text-extractable version or OCR it.
- [ ] **Acquire T1:** *Last Child in the Woods* (Richard Louv) — the cultural touchstone that launched the nature-based education movement
- [ ] Reclassify existing docs: literature review + guiding principles → T2, ERIC papers → T3
- [ ] Evaluate for trimming: 8 secondary docs may have significant overlap. Target keeping 4-5 of the strongest.
- [ ] Re-extract after acquisitions

---

## 5. PBL — NO FOUNDATIONAL TEXTS (64 principles, all secondary)

**Status:** 7 frameworks and lit reviews. Same problem as place-based — no anchor.

- [ ] **Acquire T1:** *Experience and Education* (John Dewey, 1938) — short, foundational, public domain. The philosophical root of all project-based learning.
- [ ] **Acquire T1:** *Setting the Standard for Project Based Learning* (Larmer, Mergendoller, Boss / PBLWorks) — the modern PBL bible from the Buck Institute
- [ ] Reclassify existing docs: MDRC lit review + Winthrop framework → T2, teachers' guides → T3
- [ ] Evaluate for trimming: 7 docs likely overlap. Target keeping 4-5.
- [ ] Re-extract after acquisitions

---

## 6. Unschooling — OVER-REPRESENTED, TRIM (121 principles from 11 docs)

**Status:** Noisiest philosophy. Includes tangentially related Kohn behaviorism work.

- [ ] **Acquire T1:** *How Children Learn* (John Holt) — THE foundational unschooling text, currently missing (noted in TODO). Archive.org borrow.
- [ ] **Promote to T1:** `Holt-Instead_of_Education.pdf` (already have)
- [ ] **Assign T2:** `Illich-Deschooling_Society.pdf`, `Gray-Riley-Challenges_Benefits_Unschooling_232_Families.pdf`, `Gatto-Weapons_of_Mass_Instruction.pdf`
- [ ] **Assign T3:** `FEE-Essential_Guide_Self_Directed_Education.pdf`, `Riley-Unschooling_SDT.pdf`
- [ ] **Drop from KG extraction:** `Kohn-Punished_by_Rewards.pdf` and `Kohn-Risks_of_Rewards.pdf` — these are about behaviorism/reward systems, not unschooling. Keep in directory for reference but exclude from extraction.
- [ ] **Evaluate for drop/keep:** `Kesson-We_Are_All_Unschoolers_Now.pdf`, `Holt-Escape_from_Childhood.pdf`, `Self_Directed_Learning_Guide_Parents.pdf` — are these adding unique principles or just noise?
- [ ] Re-extract after changes, verify principle count drops to 60-80 range

---

## 7. Charlotte Mason — STREAMLINE (109 principles from 4 volumes)

**Status:** Good primary sources but heavy overlap across Victorian-era volumes. No modern interpretive commentary.

- [ ] **Designate T1:** Vol 1 (*Home Education*) + Vol 6 (*Philosophy of Education*) — bookend her career, most distilled principles
- [ ] **Designate T2:** Vol 3 (*School Education*) — keeps the middle-years perspective
- [ ] **Acquire T2:** A modern interpreter — *Consider This* (Karen Glass) or *A Delectable Education* podcast companion. This would sharpen the principle extraction beyond Mason's verbose Victorian prose.
- [ ] **Designate T3:** Vol 2 (*Parents and Children*), Vol 4 (*Ourselves* — currently unextracted)
- [ ] **Decision:** Extract Vol 4 or skip? It's 160MB scanned PDF. May not be worth the effort if the other volumes already cover its principles.
- [ ] Re-extract with tier awareness, verify deduplication handles cross-volume overlap well

---

## 8. Waldorf — SLIGHT TRIM (113 principles from 8 docs)

**Status:** Decent balance but 8 docs have overlap between curriculum guides.

- [ ] **Designate T1:** `The_Education_of_the_Child-Rudolf_Steiner.pdf` + `Practical_Advice_to_Teachers-Rudolf_Steiner-294.pdf`
- [ ] **Designate T2:** `emerson-waldorf-curriculum-guide.pdf`, `essentials-waldorf-early-childhood.pdf`, `understanding-steiner-waldorf-approach.pdf`
- [ ] **Designate T3:** `waldorf-first-grade-overview.pdf`, `child-development-training-manual-steiner.pdf`
- [ ] **Evaluate for drop:** `waldorf-education-for-the-future-framework.pdf` — does it overlap heavily with the curriculum guide?
- [ ] Re-extract after tier assignment

---

## 9. Montessori — GOLD STANDARD, minor review (76 principles from 6 docs)

**Status:** Best-balanced philosophy. Montessori originals + AMS guides + ERIC research.

- [ ] **Designate T1:** `the-montessori-method-1912.pdf` + `spontaneous-activity-in-education-1917.pdf`
- [ ] **Designate T2:** `ams-early-childhood-materials.pdf`, `ams-elementary-materials.pdf`, `planes-of-development-sensitive-periods.pdf`
- [ ] **Designate T3:** `montessori-paradigm-of-learning-eric.pdf`
- [ ] No acquisitions needed. Use this as the template for other philosophies.

---

## 10. Post-audit re-extraction and validation

- [ ] After all acquisitions and tier assignments, run full re-extraction per philosophy
- [ ] Compare principle counts — target 60-80 per philosophy
- [ ] Spot-check extracted principles against source text for accuracy
- [ ] Rebuild KG with `--force` flag
- [ ] Run Playwright tests to verify nothing broke downstream
- [ ] Review lesson generation output for 1 lesson per philosophy — does balance feel right?

---

## Acquisition summary (updated 2026-03-21)

| # | Philosophy | Title | Author | Year | ISBN | Status | Link | Price |
|---|---|---|---|---|---|---|---|---|
| 1 | Classical | *The Well-Trained Mind* (4th ed.) | Susan Wise Bauer & Jessie Wise | 2016 | 978-0393253627 | `needs-purchase` | [Amazon](https://www.amazon.com/Well-Trained-Mind-Classical-Education-Fourth/dp/0393253627) | ~$35-40 |
| 2 | Classical | *Recovering the Lost Tools of Learning* | Douglas Wilson | 1991 | 978-0891075837 | `needs-purchase` | [Amazon](https://www.amazon.com/Recovering-Lost-Tools-Learning-Distinctively/dp/0891075836) / [Canon Press](https://canonpress.com/products/recovering-the-lost-tools-of-learning) | ~$15 |
| 3 | Classical | *The Paideia Proposal* | Mortimer Adler | 1982 | 978-0684841885 | `needs-purchase` | [Amazon](https://www.amazon.com/Paideia-Proposal-Educational-Manifesto/dp/0684841886) | ~$12 |
| 4 | Classical | *How to Read a Book* (1972 revised) | Mortimer Adler & Charles Van Doren | 1972 | 978-0671212094 | `downloaded` | [Archive.org (open)](https://archive.org/details/howtoreadabook1972edition) | Free |
| 5 | Adaptive | *The Differentiated Classroom* (2nd ed.) | Carol Ann Tomlinson | 2014 | 978-1416618607 | `needs-purchase` | [Amazon](https://www.amazon.com/Differentiated-Classroom-Responding-Needs-Learners/dp/1416618600) / [ASCD](https://www.ascd.org/books/the-differentiated-classroom-responding-to-the-needs-of-all-learners-2nd-edition?variant=108029) | ~$25-30 |
| 6 | Adaptive | *Integrating DI & UbD* | Tomlinson & McTighe | 2006 | 978-1416602842 | `needs-purchase` | [Amazon](https://www.amazon.com/Integrating-Differentiated-Instruction-Understanding-Design/dp/1416602844) / [ASCD](https://www.ascd.org/books/integrating-differentiated-instruction-and-understanding-by-design?variant=105004) | ~$26 |
| 7 | Adaptive | UDL Guidelines v3.0 + v2.2 Full Text | CAST | 2024/2018 | N/A | `downloaded` | [CAST Downloads](https://udlguidelines.cast.org/more/downloads/) | Free |
| 8 | Adaptive | *Frames of Mind* | Howard Gardner | 1983 | 978-0465024346 | `needs-purchase` | [Amazon](https://www.amazon.com/Frames-Mind-Theory-Multiple-Intelligences/dp/0465024335) | ~$18 |
| 9 | Place-Based | *Place-Based Education* (2nd ed.) | David Sobel | 2013 | 978-1935713050 | `needs-purchase` | [Amazon](https://www.amazon.com/Place-Based-Education-Connecting-Classrooms-Communities/dp/1935713051) / [ThriftBooks ~$8](https://www.thriftbooks.com/w/place-based-education-connecting-classrooms--communities-nature-literacy-series-vol-4-new-patriotism-series-4_david-sobel/318915/) | ~$8-15 |
| 10 | Place-Based | *Last Child in the Woods* | Richard Louv | 2008 | 978-1565126053 | `needs-purchase` | [Amazon](https://www.amazon.com/Last-Child-Woods-Children-Nature-Deficit/dp/156512605X) | ~$12-15 |
| 11 | PBL | *Experience and Education* | John Dewey | 1938 | 978-0684838281 | `downloaded` | [schoolofeducators.com](https://www.schoolofeducators.com/wp-content/uploads/2011/12/EXPERIENCE-EDUCATION-JOHN-DEWEY.pdf) | Free |
| 12 | PBL | *Setting the Standard for PBL* | Larmer, Mergendoller, Boss | 2015 | 978-1416620334 | `needs-purchase` | [Amazon](https://www.amazon.com/Setting-Standard-Project-Based-Learning/dp/1416620338) / [ASCD](https://www.ascd.org/books/setting-the-standard-for-project-based-learning?variant=114017) | ~$28 |
| 13 | Unschooling | *How Children Learn* (revised) | John Holt | 1967/1983 | 978-0201484045 | `downloaded` | [schoolofeducators.com](http://schoolofeducators.com/wp-content/uploads/2011/12/HOW-CHILDREN-LEARN-JOHN-HOLT.pdf) | Free |
| 14 | Charlotte Mason | *Consider This* | Karen Glass | 2014 | 978-1500808037 | `needs-purchase` | [Amazon](https://www.amazon.com/Consider-This-Charlotte-Classical-Tradition/dp/1500808032) | ~$15 |

### Download details

**Downloaded (4 items, all text-extractable):**
- `classical/Adler-How_to_Read_a_Book_1972.pdf` — 442 pages, 97% text-extractable. Archive.org community upload (open access).
- `adaptive/CAST-UDL_Guidelines_v2.2_Full_Text.pdf` — 149 pages, 100% extractable. Official CAST download.
- `adaptive/CAST-UDL_Guidelines_v3.0_Graphic_Organizer.pdf` — 1-page overview. Official CAST download.
- `adaptive/CAST-UDL_Guidelines_v3.0_Full_Text.txt` — 14KB structured text scraped from udlguidelines.cast.org. All 3 principles, 9 guidelines, ~40 checkpoints with descriptions.
- `project-based-learning/Dewey-Experience_and_Education.pdf` — 40 pages, 100% extractable. Hosted on schoolofeducators.com.
- `unschooling/Holt-How_Children_Learn.pdf` — 146 pages, 100% extractable. Hosted on schoolofeducators.com. **Note:** still under copyright; consider purchasing to support the author's estate.

**Needs purchase (8 items, estimated ~$160-185 total):**
- Items 1, 2, 3, 5, 6, 8, 9, 10, 12, 14 above.
- Archive.org has items 2, 3, 8 as controlled-digital-lending (borrow only, not downloadable).
- Sobel (#9) — the UCCS-hosted PDF is a scanned image (not text-extractable). Must purchase the 2nd edition for a clean copy.

**Not available free/open:**
- *Recovering the Lost Tools of Learning* (Wilson) — Archive.org CDL only.
- *The Paideia Proposal* (Adler) — Archive.org CDL only.
- *Frames of Mind* (Gardner) — Archive.org CDL only.
- All Tomlinson, Louv, Larmer, and Glass titles — copyrighted, no free versions found.

**Estimated total for remaining purchases: ~$160-185**

---

## Shopping list — books to purchase

| # | Philosophy | Title | Author | Year | ISBN | Best Price | Link |
|---|---|---|---|---|---|---|---|
| 1 | Classical | *The Well-Trained Mind* (4th ed.) | Susan Wise Bauer & Jessie Wise | 2016 | 978-0393253627 | ~$35-40 | [Amazon](https://www.amazon.com/Well-Trained-Mind-Classical-Education-Fourth/dp/0393253627) |
| 2 | Classical | *Recovering the Lost Tools of Learning* | Douglas Wilson | 1991 | 978-0891075837 | ~$15 | [Canon Press](https://canonpress.com/products/recovering-the-lost-tools-of-learning) |
| 3 | Classical | *The Paideia Proposal* | Mortimer Adler | 1982 | 978-0684841885 | ~$12 | [Amazon](https://www.amazon.com/Paideia-Proposal-Educational-Manifesto/dp/0684841886) |
| 4 | Adaptive | *The Differentiated Classroom* (2nd ed.) | Carol Ann Tomlinson | 2014 | 978-1416618607 | ~$25-30 | [ASCD](https://www.ascd.org/books/the-differentiated-classroom-responding-to-the-needs-of-all-learners-2nd-edition?variant=108029) |
| 5 | Adaptive | *Integrating DI & UbD* | Tomlinson & McTighe | 2006 | 978-1416602842 | ~$26 | [ASCD](https://www.ascd.org/books/integrating-differentiated-instruction-and-understanding-by-design?variant=105004) |
| 6 | Adaptive | *Frames of Mind* | Howard Gardner | 1983 | 978-0465024346 | ~$18 | [Amazon](https://www.amazon.com/Frames-Mind-Theory-Multiple-Intelligences/dp/0465024335) |
| 7 | Place-Based | *Place-Based Education* (2nd ed.) | David Sobel | 2013 | 978-1935713050 | ~$8 | [ThriftBooks](https://www.thriftbooks.com/w/place-based-education-connecting-classrooms--communities-nature-literacy-series-vol-4-new-patriotism-series-4_david-sobel/318915/) |
| 8 | Place-Based | *Last Child in the Woods* | Richard Louv | 2008 | 978-1565126053 | ~$12-15 | [Amazon](https://www.amazon.com/Last-Child-Woods-Children-Nature-Deficit/dp/156512605X) |
| 9 | PBL | *Setting the Standard for PBL* | Larmer, Mergendoller, Boss | 2015 | 978-1416620334 | ~$28 | [ASCD](https://www.ascd.org/books/setting-the-standard-for-project-based-learning?variant=114017) |
| 10 | Charlotte Mason | *Consider This* | Karen Glass | 2014 | 978-1500808037 | ~$15 | [Amazon](https://www.amazon.com/Consider-This-Charlotte-Classical-Tradition/dp/1500808032) |

**Total: ~$160-185 for 10 books**

> **Note on format:** Most of these are available as Kindle/ebook editions at lower prices, but we need PDF or EPUB for text extraction. Prioritize physical-to-PDF or publisher ebook formats. ASCD titles often have DRM-free PDF options when purchased directly.
