# Books to Download Manually

These two John Holt books are essential for the unschooling philosophy KG.
They're available on Internet Archive via controlled digital lending (free account required).

## 1. How Children Learn — John Holt (1967/1983)
- **Why**: THE foundational unschooling text. Detailed observations of how children naturally learn through play, curiosity, and exploration. Full of concrete activity examples and the parent/facilitator role.
- **Internet Archive**: https://archive.org/search?query=how+children+learn+john+holt
- **Download as**: `Holt-How_Children_Learn.pdf`

## 2. Teach Your Own — John Holt (1981)
- **Why**: The practical homeschooling guide. Covers what to do day-to-day, how to structure (or not structure) time, resources, dealing with doubts. Most directly useful for generating unschooling-style activities.
- **Internet Archive**: https://archive.org/search?query=teach+your+own+john+holt
- **Download as**: `Holt-Teach_Your_Own.pdf`

## After downloading:
Drop the PDFs in this folder, then run:
```bash
cd kg-service && source .venv/bin/activate
python -m ingest.extract --philosophy unschooling
python -m ingest.rebuild --force --states MI
```
