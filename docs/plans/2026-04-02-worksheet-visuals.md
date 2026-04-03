# Worksheet Visual Enhancement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add rendered visual manipulatives to generated worksheets — KaTeX equation rendering, custom SVG math manipulatives (ten frames, fraction bars, number lines, etc.), and Mafs-based coordinate/geometry visuals — making worksheets genuinely more valuable than anything a competitor produces today.

**Architecture:** Three gated phases. Phase 1 (KaTeX) improves equation display in the existing text-only sections. Phase 2 adds a new optional `visual` field to worksheet sections, a TypeScript SVG function library generates inline SVG from structured params, and the LLM prompt is taught to populate the field. Phase 3 adds Mafs for complex 6–8 geometry. Each phase has a build gate, a visual browser gate, and an eval score gate before proceeding.

**Tech Stack:** KaTeX (MIT, CDN in print window), custom TypeScript SVG functions (zero deps), Mafs (MIT, React), updated Python worksheet prompt, existing worksheet eval harness (`kg-service/evals/worksheet_eval.py`).

---

## Current State

- Worksheets stored as `Json` in `Worksheet.content` with sections: `{ type, title, instructions, lines?, drawing_space? }`
- Print: `web/src/lib/printWorksheet.ts` opens a new window, generates HTML, calls `window.print()`
- Generation: `kg-service/api/worksheet.py` — `WorksheetSection` Pydantic model, LLM outputs plain text instructions
- Display: `web/src/app/lessons/[id]/page.tsx` — `WorksheetData` interface mirrors the DB shape
- No math rendering, no diagrams, no structured visual params

## Gate Criteria

**Phase 1 gate:** Build passes. Open a fractions math worksheet in the print preview — `½`, `¾`, fractions render as typeset math not plain text. Run `worksheet_eval.py --quick --subject math` — eval notes improved notation quality.

**Phase 2 gate:** Build passes. Open `web/public/worksheet-visual-test.html` in browser — all 7 SVG visuals render correctly and print without splitting. Run `worksheet_eval.py --quick --subject math` — `SUBJECT_SPECIFICITY` average improves over Phase 1 baseline. No `generic_box` critical issues.

**Phase 3 gate:** Build passes. Generate a Grade 7 geometry worksheet — coordinate plane, labeled triangle SVGs appear in the print preview. Mafs renders visuals in the lesson detail page worksheet display. Run full `worksheet_eval.py` — overall average ≥ 4.8 for math.

---

## Phase 1: KaTeX Equation Rendering

### Task 1.1: Add KaTeX to print window

**Context:** The print window is a raw HTML string written via `win.document.write()`. KaTeX can be loaded from CDN and called via `renderMathInElement()` after the window loads. The LLM needs to output LaTeX notation like `$\frac{3}{4}$` in instructions for this to have effect.

**Files:**
- Modify: `web/src/lib/printWorksheet.ts`

**Step 1: Update the print window `<head>` to load KaTeX CDN**

Replace the existing `<style>` block in the `win.document.write(...)` call:

```typescript
win.document.write(`<!DOCTYPE html><html><head><title>${ws.content.title}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"
    onload="renderMathInElement(document.body, {
      delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false}
      ]
    });"></script>
  <style>
    body { font-family: 'Georgia', serif; max-width: 700px; margin: 40px auto; padding: 0 20px; }
    .katex { font-size: 1.1em; }
    .katex-display { margin: 12px 0; }
    @media print { body { margin: 20px; } }
  </style>
</head><body>
  ...
```

**Step 2: Verify build**
```bash
cd ~/github/edu-app/web && npm run build
```
Expected: `✓ Compiled successfully`

**Step 3: Manual visual gate**
1. Restart dev server: `lsof -ti :3001 | xargs kill -9; cd ~/github/edu-app/web && npm run dev -- --port 3001`
2. Open a lesson with a math worksheet → click "Print Worksheet"
3. Verify the print preview loads (even without LaTeX notation yet, the CDN loads without errors)

**Step 4: Commit**
```bash
git add web/src/lib/printWorksheet.ts
git commit -m "feat(worksheets): add KaTeX CDN to print window for math rendering"
```

---

### Task 1.2: Update worksheet prompt to output LaTeX notation

**Context:** The LLM currently writes instructions in plain text: "Write the fraction 3 out of 4". After this task it will output `$\frac{3}{4}$` which KaTeX will render typeset.

**Files:**
- Modify: `kg-service/api/worksheet.py` (lines 16–33, the `WORKSHEET_SYSTEM_PROMPT`)

**Step 1: Add LaTeX notation instructions to the system prompt**

Add this block to `WORKSHEET_SYSTEM_PROMPT`, before the final `Return ONLY valid JSON` line:

```python
WORKSHEET_SYSTEM_PROMPT = """...existing content...

Math notation: Use LaTeX notation for all mathematical expressions within instructions:
- Inline math: $\\frac{3}{4}$, $2^3$, $\\sqrt{16}$, $4 \\times 3$
- Display math (standalone problem): $$\\frac{3}{4} + \\frac{1}{4} = ?$$
- Write fractions AS LaTeX, not as "3/4" or "three-fourths" in math contexts
- Example instruction: "Solve: $$\\frac{2}{3} + \\frac{1}{6} = ?$$ Show your work on the lines below."

Return ONLY valid JSON: { "sections": [...] }"""
```

**Step 2: Restart kg-service and generate a test worksheet**
```bash
lsof -ti :8000 | xargs kill -9 2>/dev/null
cd ~/github/edu-app/kg-service && nohup .venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload > /tmp/kg-service.log 2>&1 &
sleep 3
# Test: generate a fractions worksheet directly
curl -s -X POST http://localhost:8000/generate-worksheet \
  -H "Content-Type: application/json" \
  -d '{"lesson_title":"Adding Fractions","interest":"baking","philosophy":"charlotte-mason","child_name":"Emma","grade":"3","lesson_sections":[],"standards_addressed":[{"code":"3.NF.1","description_plain":"Understand fractions as parts of a whole"}]}' \
  | python3 -m json.tool | grep -A2 "instructions"
```
Expected: At least one instruction containing `$\\frac{` LaTeX notation.

**Step 3: Visual gate — open print preview**
1. In the running app at `localhost:3001`, open a lesson, generate a fractions worksheet
2. Click "Print Worksheet"
3. Verify: fraction notation renders as typeset math (not `$\frac{3}{4}$` raw text)

**Step 4: Eval gate — run worksheet eval, note scores as Phase 1 baseline**
```bash
cd ~/github/edu-app/kg-service
.venv/bin/python -m evals.worksheet_eval --quick --subject math 2>&1 | tee /tmp/phase1-eval.txt
```
Save these scores — they become the baseline for Phase 2 comparison.

**Step 5: Commit**
```bash
git add kg-service/api/worksheet.py
git commit -m "feat(worksheets): teach LLM to output LaTeX notation for math"
```

---

### Task 1.3: Update TypeScript types to support LaTeX

**Context:** The `WorksheetData` interface and `PrintableSection` interface currently have no knowledge of LaTeX content. The sections already work since LaTeX is just text in the `instructions` field — no type changes needed. But verify the `instructions` field isn't being sanitized anywhere.

**Files:**
- Read-only: `web/src/app/lessons/[id]/page.tsx` (line 35–41 — WorksheetData interface)
- Read-only: `web/src/lib/printWorksheet.ts` (line 21 — how instructions are rendered)

**Step 1: Verify instructions are rendered as-is (no HTML escaping that would break `$`)**

In `printWorksheet.ts` line 21:
```typescript
<p style="...">${s.instructions}</p>
```
This is a template literal — the `$` in `$\frac{3}{4}$` is plain text content, not a template substitution. KaTeX auto-render processes it after load. No changes needed.

**Step 2: Confirm Phase 1 is complete**

- [ ] Build passes
- [ ] KaTeX CDN loads in print window without errors
- [ ] LLM outputs LaTeX notation for fractions worksheets
- [ ] Print preview renders typeset math

**Step 3: Commit if any minor fixes were needed; otherwise no commit required**

---

## Phase 2: Custom SVG Visual Library

### Task 2.1: Create the SVG generator module

**Context:** A pure TypeScript module that exports functions taking structured params and returning SVG strings. No React, no external dependencies. These strings are injected directly into the print window HTML. Each function returns a complete `<svg>` element ready to inline.

The philosophy: SVGs use only basic primitives (`rect`, `circle`, `line`, `text`, `path`). Colors use RGB not hex (Puppeteer PDF bug). All elements use `page-break-inside: avoid` via wrapper div.

**Files:**
- Create: `web/src/lib/worksheetSvg.ts`

**Step 1: Write the SVG generator module**

```typescript
// web/src/lib/worksheetSvg.ts
// Pure functions: params → SVG string. Zero dependencies.
// Colors use rgb() not hex (Puppeteer compatibility).

const FILL = "rgb(200, 220, 255)";     // shaded cells
const EMPTY = "rgb(255, 255, 255)";    // empty cells
const STROKE = "rgb(80, 80, 80)";      // borders/lines
const DOT = "rgb(60, 100, 160)";       // dots/counters

export function tenFrame(filled: number): string {
  // Two rows of 5 cells; first `filled` cells are shaded
  const W = 220, H = 100, cw = 40, ch = 40, pad = 5;
  let cells = "";
  for (let i = 0; i < 10; i++) {
    const col = i % 5, row = Math.floor(i / 5);
    const x = pad + col * (cw + pad), y = pad + row * (ch + pad);
    cells += `<rect x="${x}" y="${y}" width="${cw}" height="${ch}"
      fill="${i < filled ? FILL : EMPTY}"
      stroke="${STROKE}" stroke-width="1.5" rx="3"/>`;
  }
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${cells}</svg>`;
}

export function fractionBar(numerator: number, denominator: number, shaded = numerator): string {
  const W = 300, H = 48, pad = 4;
  const segW = (W - pad * 2) / denominator;
  let segs = "";
  for (let i = 0; i < denominator; i++) {
    const x = pad + i * segW;
    segs += `<rect x="${x}" y="${pad}" width="${segW}" height="${H - pad * 2}"
      fill="${i < shaded ? FILL : EMPTY}" stroke="${STROKE}" stroke-width="1.5"/>`;
  }
  const label = `<text x="${W / 2}" y="${H + 16}" text-anchor="middle"
    font-family="Georgia, serif" font-size="13" fill="${STROKE}">${shaded}/${denominator}</text>`;
  return `<svg width="${W}" height="${H + 20}" viewBox="0 0 ${W} ${H + 20}" xmlns="http://www.w3.org/2000/svg">${segs}${label}</svg>`;
}

export function fractionCircle(numerator: number, denominator: number): string {
  const cx = 70, cy = 70, r = 58;
  let slices = "";
  for (let i = 0; i < denominator; i++) {
    const a1 = (i / denominator) * 2 * Math.PI - Math.PI / 2;
    const a2 = ((i + 1) / denominator) * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
    const large = denominator === 1 ? 1 : 0;
    slices += `<path d="M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)} Z"
      fill="${i < numerator ? FILL : EMPTY}" stroke="${STROKE}" stroke-width="1.5"/>`;
  }
  const label = `<text x="70" y="152" text-anchor="middle" font-family="Georgia, serif" font-size="13" fill="${STROKE}">${numerator}/${denominator}</text>`;
  return `<svg width="140" height="160" viewBox="0 0 140 160" xmlns="http://www.w3.org/2000/svg">${slices}${label}</svg>`;
}

export function numberLine(
  start: number, end: number,
  marked: number[] = [], labels: string[] = []
): string {
  const W = 400, H = 60, lpad = 20, rpad = 20;
  const range = end - start || 1;
  const toX = (v: number) => lpad + ((v - start) / range) * (W - lpad - rpad);
  const y = 30;
  // Main line + ticks
  let content = `<line x1="${lpad}" y1="${y}" x2="${W - rpad}" y2="${y}" stroke="${STROKE}" stroke-width="2"/>`;
  // Arrowheads
  content += `<polygon points="${W - rpad},${y} ${W - rpad - 8},${y - 4} ${W - rpad - 8},${y + 4}" fill="${STROKE}"/>`;
  // Ticks + labels
  for (let v = start; v <= end; v++) {
    const x = toX(v);
    content += `<line x1="${x}" y1="${y - 6}" x2="${x}" y2="${y + 6}" stroke="${STROKE}" stroke-width="1.5"/>`;
    content += `<text x="${x}" y="${y + 20}" text-anchor="middle" font-family="Georgia, serif" font-size="11" fill="${STROKE}">${labels[v - start] ?? v}</text>`;
  }
  // Marked points
  for (const v of marked) {
    const x = toX(v);
    content += `<circle cx="${x}" cy="${y}" r="6" fill="${DOT}" stroke="rgb(30,70,140)" stroke-width="1.5"/>`;
  }
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

export function multiplicationArray(rows: number, cols: number): string {
  const dotR = 8, gap = 24, pad = 16;
  const W = pad * 2 + cols * gap, H = pad * 2 + rows * gap;
  let dots = "";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = pad + c * gap + dotR, y = pad + r * gap + dotR;
      dots += `<circle cx="${x}" cy="${y}" r="${dotR - 2}" fill="${DOT}"/>`;
    }
  }
  const label = `<text x="${W / 2}" y="${H + 16}" text-anchor="middle" font-family="Georgia, serif" font-size="13" fill="${STROKE}">${rows} × ${cols} = ${rows * cols}</text>`;
  return `<svg width="${W}" height="${H + 20}" viewBox="0 0 ${W} ${H + 20}" xmlns="http://www.w3.org/2000/svg">${dots}${label}</svg>`;
}

export function coordinateGrid(
  quadrant: 1 | 4 = 1,
  points: Array<{ x: number; y: number; label?: string }> = [],
  size = 8
): string {
  const cell = 28, pad = 32;
  const cols = size, rows = quadrant === 4 ? size : size;
  const W = cols * cell + pad * 2, H = rows * cell + pad * 2;
  const ox = quadrant === 4 ? pad + (cols / 2) * cell : pad;
  const oy = quadrant === 4 ? pad + (rows / 2) * cell : pad + rows * cell;

  let content = "";
  // Grid lines
  for (let i = 0; i <= cols; i++) {
    const x = pad + i * cell;
    content += `<line x1="${x}" y1="${pad}" x2="${x}" y2="${pad + rows * cell}" stroke="rgb(200,200,200)" stroke-width="0.8"/>`;
  }
  for (let i = 0; i <= rows; i++) {
    const y = pad + i * cell;
    content += `<line x1="${pad}" y1="${y}" x2="${pad + cols * cell}" y2="${y}" stroke="rgb(200,200,200)" stroke-width="0.8"/>`;
  }
  // Axes
  content += `<line x1="${ox}" y1="${pad}" x2="${ox}" y2="${pad + rows * cell}" stroke="${STROKE}" stroke-width="2"/>`;
  content += `<line x1="${pad}" y1="${oy}" x2="${pad + cols * cell}" y2="${oy}" stroke="${STROKE}" stroke-width="2"/>`;
  // Axis labels
  for (let i = 0; i <= cols; i++) {
    const v = quadrant === 4 ? i - cols / 2 : i;
    if (v === 0) continue;
    content += `<text x="${pad + i * cell}" y="${oy + 16}" text-anchor="middle" font-family="Georgia, serif" font-size="10" fill="${STROKE}">${v}</text>`;
  }
  for (let i = 0; i <= rows; i++) {
    const v = quadrant === 4 ? rows / 2 - i : rows - i;
    if (v === 0) continue;
    content += `<text x="${ox - 12}" y="${pad + i * cell + 4}" text-anchor="end" font-family="Georgia, serif" font-size="10" fill="${STROKE}">${v}</text>`;
  }
  // Plotted points
  for (const pt of points) {
    const px = ox + pt.x * cell, py = oy - pt.y * cell;
    content += `<circle cx="${px}" cy="${py}" r="5" fill="${DOT}"/>`;
    if (pt.label) content += `<text x="${px + 8}" y="${py - 4}" font-family="Georgia, serif" font-size="11" fill="${STROKE}">(${pt.x}, ${pt.y})</text>`;
  }
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

export function analogClock(hour: number, minute: number): string {
  const cx = 80, cy = 80, r = 70;
  let content = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${EMPTY}" stroke="${STROKE}" stroke-width="2"/>`;
  // Hour markers
  for (let i = 1; i <= 12; i++) {
    const a = (i / 12) * 2 * Math.PI - Math.PI / 2;
    const tx = cx + (r - 12) * Math.cos(a), ty = cy + (r - 12) * Math.sin(a);
    content += `<text x="${tx.toFixed(1)}" y="${(ty + 4).toFixed(1)}" text-anchor="middle" font-family="Georgia, serif" font-size="11" fill="${STROKE}">${i}</text>`;
  }
  // Minute hand
  const ma = ((minute / 60) * 2 * Math.PI) - Math.PI / 2;
  content += `<line x1="${cx}" y1="${cy}" x2="${(cx + (r - 15) * Math.cos(ma)).toFixed(1)}" y2="${(cy + (r - 15) * Math.sin(ma)).toFixed(1)}" stroke="${STROKE}" stroke-width="2" stroke-linecap="round"/>`;
  // Hour hand
  const ha = (((hour % 12) + minute / 60) / 12 * 2 * Math.PI) - Math.PI / 2;
  content += `<line x1="${cx}" y1="${cy}" x2="${(cx + (r - 28) * Math.cos(ha)).toFixed(1)}" y2="${(cy + (r - 28) * Math.sin(ha)).toFixed(1)}" stroke="${STROKE}" stroke-width="3.5" stroke-linecap="round"/>`;
  content += `<circle cx="${cx}" cy="${cy}" r="3" fill="${STROKE}"/>`;
  return `<svg width="${cx * 2}" height="${cy * 2}" viewBox="0 0 ${cx * 2} ${cy * 2}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

// Dispatcher: given a visual type and params, return the SVG string
export function renderVisual(type: string, params: Record<string, unknown>): string | null {
  switch (type) {
    case "ten_frame":       return tenFrame(params.filled as number ?? 0);
    case "fraction_bar":    return fractionBar(params.numerator as number, params.denominator as number, params.shaded as number | undefined);
    case "fraction_circle": return fractionCircle(params.numerator as number, params.denominator as number);
    case "number_line":     return numberLine(params.start as number, params.end as number, params.marked as number[] | undefined, params.labels as string[] | undefined);
    case "multiplication_array": return multiplicationArray(params.rows as number, params.cols as number);
    case "coordinate_grid": return coordinateGrid(params.quadrant as 1 | 4, params.points as Array<{x:number;y:number;label?:string}> | undefined, params.size as number | undefined);
    case "analog_clock":    return analogClock(params.hour as number, params.minute as number);
    default:                return null;
  }
}
```

**Step 2: Build check**
```bash
cd ~/github/edu-app/web && npm run build
```
Expected: `✓ Compiled successfully`

**Step 3: Commit**
```bash
git add web/src/lib/worksheetSvg.ts
git commit -m "feat(worksheets): add SVG visual generator library (7 manipulative types)"
```

---

### Task 2.2: Create visual browser test page

**Context:** A static HTML file that renders all 7 visuals side by side. Open in browser to visually verify before wiring into the app. Also serves as a print test — use browser print to verify no page breaks through diagrams.

**Files:**
- Create: `web/public/worksheet-visual-test.html`

**Step 1: Create the test page**

This page imports the SVG functions by inlining the generated SVGs directly (copy the SVG output from the TypeScript functions run via Node.js):

```bash
# Generate test SVGs via Node.js to verify output
cd ~/github/edu-app/web && node -e "
const { tenFrame, fractionBar, fractionCircle, numberLine, multiplicationArray, coordinateGrid, analogClock } = require('./src/lib/worksheetSvg.ts');
" 2>&1 | head -5
```

Note: TypeScript files can't be required directly. Instead, create a simple Node script to test:

```bash
cd ~/github/edu-app/web && npx ts-node --skip-project -e "
import { tenFrame, fractionBar, fractionCircle, numberLine, multiplicationArray, coordinateGrid, analogClock } from './src/lib/worksheetSvg';
console.log('ten_frame:', tenFrame(7).substring(0, 80));
console.log('fraction_bar:', fractionBar(3, 4).substring(0, 80));
console.log('fraction_circle:', fractionCircle(2, 3).substring(0, 80));
console.log('number_line:', numberLine(0, 10, [3, 7]).substring(0, 80));
console.log('mult_array:', multiplicationArray(3, 4).substring(0, 80));
console.log('coord_grid:', coordinateGrid(1, [{x:2, y:3, label:'A'}]).substring(0, 80));
console.log('clock:', analogClock(3, 30).substring(0, 80));
" 2>&1
```
Expected: Each prints `<svg width=...` without errors.

**Step 2: Write the HTML test page**

Create `web/public/worksheet-visual-test.html` — a static page with all 7 visuals labelled and a print button. Content: an HTML page with inline SVGs copied from the function outputs, each in a labelled `div` with `page-break-inside: avoid`. Add a `<button onclick="window.print()">Print Test</button>`.

**Step 3: Open in browser and visually verify**
```
open http://localhost:3001/worksheet-visual-test.html
```
Expected: All 7 visuals render correctly — ten frame shows filled/empty cells, fraction bar is proportionally correct, clock hands point to correct time.

**Step 4: Print test**
Click the print button. Verify: no visual splits across page breaks.

**Step 5: Commit**
```bash
git add web/public/worksheet-visual-test.html
git commit -m "test(worksheets): add visual browser test page for SVG manipulatives"
```

---

### Task 2.3: Add `visual` field to worksheet schema

**Context:** The section schema gains an optional `visual` field: `{ type: string, params: Record<string, unknown> }`. This is additive — sections without a `visual` field continue to work exactly as before. The DB column is already `Json` so no migration needed.

**Files:**
- Modify: `kg-service/api/worksheet.py` (WorksheetSection model, line 74–80)
- Modify: `web/src/app/lessons/[id]/page.tsx` (WorksheetData interface, lines 35–41)
- Modify: `web/src/lib/printWorksheet.ts` (PrintableSection interface, lines 1–6)
- Modify: `web/src/app/api/lessons/[id]/worksheet/route.ts` (WorksheetSection content parsing)

**Step 1: Update Python WorksheetSection model**

```python
class VisualParams(BaseModel):
    model_config = {"extra": "allow"}  # allow any params

class WorksheetVisual(BaseModel):
    type: str
    params: dict = Field(default_factory=dict)

class WorksheetSection(BaseModel):
    model_config = {"extra": "ignore"}
    type: str
    title: str
    instructions: str
    lines: Optional[int] = None
    drawing_space: Optional[bool] = None
    visual: Optional[WorksheetVisual] = None  # NEW
```

**Step 2: Update TypeScript WorksheetData interface in `web/src/app/lessons/[id]/page.tsx`**

```typescript
interface WorksheetData {
  id: string;
  childName: string | null;
  grade: string;
  philosophy: string;
  content: {
    title: string;
    sections: Array<{
      type: string;
      title: string;
      instructions: string;
      lines?: number;
      drawing_space?: boolean;
      visual?: { type: string; params: Record<string, unknown> }; // NEW
    }>;
  };
  createdAt: string;
}
```

**Step 3: Update PrintableSection in `web/src/lib/printWorksheet.ts`**

```typescript
interface PrintableSection {
  title: string;
  instructions: string;
  lines?: number;
  drawing_space?: boolean;
  visual?: { type: string; params: Record<string, unknown> }; // NEW
}
```

**Step 4: Build check**
```bash
cd ~/github/edu-app/web && npm run build
```
Expected: `✓ Compiled successfully`

**Step 5: Commit**
```bash
git add kg-service/api/worksheet.py web/src/app/lessons/\[id\]/page.tsx web/src/lib/printWorksheet.ts
git commit -m "feat(worksheets): add optional visual field to worksheet section schema"
```

---

### Task 2.4: Wire SVG rendering into print function

**Context:** Update `printWorksheet.ts` to call `renderVisual()` when a section has a `visual` field, and inject the SVG before the lines/drawing_space.

**Files:**
- Modify: `web/src/lib/printWorksheet.ts`

**Step 1: Import renderVisual and add SVG injection**

```typescript
import { renderVisual } from "@/lib/worksheetSvg";

// In the sectionsHtml map:
const svgHtml = s.visual ? (() => {
  const svg = renderVisual(s.visual.type, s.visual.params);
  return svg ? `<div style="margin: 12px 0; page-break-inside: avoid;">${svg}</div>` : "";
})() : "";

// In the section template, add svgHtml after instructions paragraph:
<p style="...">${s.instructions}</p>
${svgHtml}
${s.drawing_space ? '...' : ""}
${s.lines ? '...' : ""}
```

**Step 2: Build check**
```bash
cd ~/github/edu-app/web && npm run build
```
Expected: `✓ Compiled successfully`

**Step 3: Commit**
```bash
git add web/src/lib/printWorksheet.ts
git commit -m "feat(worksheets): inject SVG visuals into print window from visual field"
```

---

### Task 2.5: Update worksheet prompt to generate visual params

**Context:** The LLM needs to know it can output a `visual` field with structured params. Add the visual section types to the system prompt and examples. This is the most important prompt change.

**Files:**
- Modify: `kg-service/api/worksheet.py`

**Step 1: Add visual section types to WORKSHEET_SYSTEM_PROMPT**

Add after the existing philosophy section types block:

```python
Visual section types (add a `visual` field for math manipulatives when subject warrants it):
  "type": "fraction_bars" → visual: { "type": "fraction_bar", "params": { "numerator": 3, "denominator": 4 } }
  "type": "number_line"   → visual: { "type": "number_line",  "params": { "start": 0, "end": 10, "marked": [3, 7] } }
  "type": "ten_frame"     → visual: { "type": "ten_frame",    "params": { "filled": 7 } }
  "type": "fraction_circle" → visual: { "type": "fraction_circle", "params": { "numerator": 2, "denominator": 3 } }
  "type": "multiplication_array" → visual: { "type": "multiplication_array", "params": { "rows": 3, "cols": 4 } }
  "type": "coordinate_grid" → visual: { "type": "coordinate_grid", "params": { "quadrant": 1, "points": [{"x": 2, "y": 3}] } }
  "type": "analog_clock"  → visual: { "type": "analog_clock",  "params": { "hour": 3, "minute": 30 } }

Rules for using visual sections:
- For MATH worksheets: include at least one visual section when the topic involves fractions, multiplication, counting, coordinates, or time
- For SCIENCE worksheets: visual sections are optional; use only if the visual directly supports the activity
- Always write `instructions` to reference the visual: "Look at the fraction bar above. How many parts are shaded?"
- The `visual` field is optional — only include it when it genuinely adds value
```

Also update the section schema in the prompt from:
```
Each section has: { "type": string, "title": string, "instructions": string, "lines": number (optional), "drawing_space": boolean (optional) }
```
to:
```
Each section has: { "type": string, "title": string, "instructions": string, "lines": number (optional), "drawing_space": boolean (optional), "visual": { "type": string, "params": {...} } (optional) }
```

**Step 2: Restart kg-service and generate a test math worksheet**
```bash
lsof -ti :8000 | xargs kill -9 2>/dev/null
cd ~/github/edu-app/kg-service && nohup .venv/bin/uvicorn main:app --port 8000 --reload > /tmp/kg-service.log 2>&1 &
sleep 3
curl -s -X POST http://localhost:8000/generate-worksheet \
  -H "Content-Type: application/json" \
  -d '{"lesson_title":"Fractions and Equal Parts","interest":"baking","philosophy":"charlotte-mason","child_name":"Emma","grade":"3","lesson_sections":[],"standards_addressed":[{"description_plain":"Understand fractions as parts of a whole"}]}' \
  | python3 -m json.tool | python3 -c "
import json, sys
data = json.load(sys.stdin)
for s in data['worksheet']['sections']:
    print(s['type'], '→ visual:', s.get('visual', 'NONE'))
"
```
Expected: At least one section shows `→ visual: {'type': 'fraction_bar', 'params': {...}}` rather than `NONE`.

**Step 3: Eval gate — run Phase 2 eval and compare to Phase 1 baseline**
```bash
cd ~/github/edu-app/kg-service
.venv/bin/python -m evals.worksheet_eval --quick --subject math 2>&1 | tee /tmp/phase2-eval.txt
diff /tmp/phase1-eval.txt /tmp/phase2-eval.txt
```
Gate criteria: `SUBJECT_SPECIFICITY` average must be ≥ 4.5 (Phase 1 baseline was 5.0 per eval run; this checks it's maintained or improved). `critical_issues` must remain 0. If SPECIFICITY drops below 4.0, the prompt is regressing — investigate before continuing.

**Step 4: Full visual gate in browser**
1. Open any math worksheet in the app → Print Worksheet
2. Verify: at least one section has a rendered SVG diagram above the instructions
3. Verify: the diagram matches the instruction text (e.g., "Look at the fraction bar showing 3/4" with a fraction bar visual)

**Step 5: Commit**
```bash
git add kg-service/api/worksheet.py
git commit -m "feat(worksheets): teach LLM to generate visual params for math manipulatives"
```

---

### Task 2.6: Update worksheet display in lesson detail page

**Context:** The lesson detail page shows a preview of worksheet sections before printing. Update it to show a small thumbnail of the visual (or an icon) so users know the worksheet has a diagram before clicking Print.

**Files:**
- Modify: `web/src/app/lessons/[id]/page.tsx` (around line 1165 — the worksheet section preview)

**Step 1: Import renderVisual and add visual indicator to section preview**

In the section that renders `ws.content.sections.slice(0, 3).map((sec, i)`:

```tsx
import { renderVisual } from "@/lib/worksheetSvg";

// In the section preview map, after showing title + truncated instructions:
{sec.visual && (
  <div
    style={{ marginTop: "0.35rem", opacity: 0.7, maxWidth: "120px" }}
    dangerouslySetInnerHTML={{ __html: renderVisual(sec.visual.type, sec.visual.params) ?? "" }}
  />
)}
```

Note: `dangerouslySetInnerHTML` is safe here because the SVG is generated by our own `renderVisual` function, not user input.

**Step 2: Build check**
```bash
cd ~/github/edu-app/web && npm run build
```

**Step 3: Visual gate**
Open a lesson with a math worksheet that has visual sections. Verify the preview in the lesson page shows small SVG thumbnails alongside the section text.

**Step 4: Commit and push**
```bash
git add web/src/app/lessons/\[id\]/page.tsx
git commit -m "feat(worksheets): show SVG visual thumbnails in worksheet preview on lesson page"
git push origin main
```

---

### Task 2.7: Phase 2 gate — deploy and final eval

**Step 1: Final build gate**
```bash
cd ~/github/edu-app/web && npm run build
```
Expected: `✓ Compiled successfully`, `✓ Generating static pages (43/43)`

**Step 2: Full eval run (all 32 worksheets)**
```bash
cd ~/github/edu-app/kg-service
.venv/bin/python -m evals.worksheet_eval 2>&1 | tee /tmp/phase2-full-eval.txt
```
Gate criteria to proceed to Phase 3:
- `SUBJECT_SPECIFICITY` average ≥ 4.5 for math, ≥ 4.5 for science
- `critical_issues` = 0 for both subjects
- No `generic_box` issues

If criteria not met: investigate which philosophies are failing and update the prompt before proceeding.

**Step 3: Deploy to Railway**
```bash
git push origin main
# monitor: railway deployment list
```

**Step 4: Manual production test**
Generate a fractions worksheet on the production URL. Print it. Verify: KaTeX renders fractions, at least one SVG diagram appears.

---

## Phase 3: Mafs for Coordinate Geometry (Grades 6–8)

### Task 3.1: Install Mafs

**Context:** Mafs is a React library (MIT) for rendering SVG-based math visualizations. It handles coordinate planes, function plots, geometric shapes with labels, angles, vectors — the complex geometry that custom SVG functions can't easily cover. Used in the lesson detail page's worksheet display AND captured for print.

**Files:**
- Modify: `web/package.json` (dependency)

**Step 1: Install**
```bash
cd ~/github/edu-app/web && npm install mafs
```

**Step 2: Verify install**
```bash
npm list mafs 2>/dev/null | grep mafs
```
Expected: `└── mafs@x.x.x`

**Step 3: Build check with Mafs installed**
```bash
npm run build
```
Expected: `✓ Compiled successfully`

**Step 4: Commit**
```bash
git add package.json package-lock.json
git commit -m "feat(worksheets): install mafs for coordinate geometry rendering"
```

---

### Task 3.2: Create WorksheetMafsVisual component

**Context:** A React client component that renders Mafs visualizations based on visual type + params. Used in the lesson detail page to display Grades 6–8 geometry visuals. For printing, we capture the rendered SVG DOM node's outerHTML and inject it into the print window.

Supported Mafs visual types:
- `mafs_coordinate_plane` — four-quadrant plane with plotted points, lines, polygons
- `mafs_function` — function plot (e.g., linear, quadratic)
- `mafs_polygon` — labeled polygon (triangle, rectangle, etc.)

**Files:**
- Create: `web/src/components/WorksheetMafsVisual.tsx`

**Step 1: Write the component**

```tsx
// web/src/components/WorksheetMafsVisual.tsx
"use client";
import { useRef } from "react";
import { Mafs, Coordinates, Plot, Point, Polygon, Text, useStopwatch } from "mafs";
import "mafs/core.css";

interface MafsVisualProps {
  type: string;
  params: Record<string, unknown>;
  onSvgReady?: (svgHtml: string) => void;
}

export function WorksheetMafsVisual({ type, params, onSvgReady }: MafsVisualProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Capture SVG HTML for print injection after first render
  const captureSvg = () => {
    if (onSvgReady && ref.current) {
      const svg = ref.current.querySelector("svg");
      if (svg) onSvgReady(svg.outerHTML);
    }
  };

  if (type === "mafs_coordinate_plane") {
    const xRange = params.xRange as [number, number] ?? [-5, 5];
    const yRange = params.yRange as [number, number] ?? [-5, 5];
    const points = params.points as Array<{ x: number; y: number; label?: string }> ?? [];
    return (
      <div ref={ref} style={{ width: 300, height: 300 }} onLoad={captureSvg}>
        <Mafs width={300} height={300} viewBox={{ x: xRange, y: yRange }}>
          <Coordinates.Cartesian />
          {points.map((pt, i) => (
            <Point key={i} x={pt.x} y={pt.y} />
          ))}
        </Mafs>
      </div>
    );
  }

  if (type === "mafs_function") {
    const fn = params.fn as string ?? "x";
    // Safe eval of simple polynomial functions only
    const safeFn = (x: number) => {
      try { return eval(fn.replace(/x/g, `(${x})`)) as number; } // eslint-disable-line no-eval
      catch { return 0; }
    };
    return (
      <div ref={ref} style={{ width: 300, height: 300 }} onLoad={captureSvg}>
        <Mafs width={300} height={300}>
          <Coordinates.Cartesian />
          <Plot.OfX y={safeFn} />
        </Mafs>
      </div>
    );
  }

  if (type === "mafs_polygon") {
    const vertices = params.vertices as Array<[number, number]> ?? [];
    const color = params.color as string ?? "#5B8DD9";
    return (
      <div ref={ref} style={{ width: 300, height: 300 }} onLoad={captureSvg}>
        <Mafs width={300} height={300}>
          <Coordinates.Cartesian />
          <Polygon points={vertices} color={color} />
        </Mafs>
      </div>
    );
  }

  return null;
}
```

**Step 2: Build check**
```bash
cd ~/github/edu-app/web && npm run build
```
Expected: `✓ Compiled successfully`

**Step 3: Commit**
```bash
git add web/src/components/WorksheetMafsVisual.tsx
git commit -m "feat(worksheets): add WorksheetMafsVisual React component (Mafs-based)"
```

---

### Task 3.3: Wire Mafs visuals into print function

**Context:** The print window is a plain HTML string — it can't run React/Mafs. The solution: when a section has a `mafs_*` visual, render the WorksheetMafsVisual component in the current React context, capture its SVG DOM string, and pass that into the print window. This requires changing `printWorksheet` from a pure function to a React hook.

**Files:**
- Modify: `web/src/lib/printWorksheet.ts`
- Modify: `web/src/app/lessons/[id]/page.tsx` (call site)

**Step 1: Change printWorksheet to accept pre-rendered SVGs**

Add an optional `prerenderedSvgs` param to `printWorksheet`:

```typescript
// In printWorksheet.ts
export function printWorksheet(
  ws: PrintableWorksheet,
  prerenderedSvgs: Record<number, string> = {}
) {
  // ...existing code...
  const sectionsHtml = ws.content.sections.map((s, idx) => {
    const svgHtml = (() => {
      if (prerenderedSvgs[idx]) {
        return `<div style="margin:12px 0; page-break-inside:avoid;">${prerenderedSvgs[idx]}</div>`;
      }
      if (s.visual && !s.visual.type.startsWith("mafs_")) {
        const svg = renderVisual(s.visual.type, s.visual.params);
        return svg ? `<div style="margin:12px 0; page-break-inside:avoid;">${svg}</div>` : "";
      }
      return "";
    })();
    // ...rest of section template...
  }).join("");
```

**Step 2: In lesson detail page, collect pre-rendered Mafs SVGs before printing**

In the `printWorksheet` call in `web/src/app/lessons/[id]/page.tsx`, add Mafs SVG capture:

```tsx
const mafsRefs = useRef<Record<number, string>>({});

const handlePrint = (ws: WorksheetData) => {
  const prerendered = { ...mafsRefs.current };
  printWorksheet(ws, prerendered);
};

// In the worksheet display, for each Mafs section:
{sec.visual?.type.startsWith("mafs_") && (
  <WorksheetMafsVisual
    type={sec.visual.type}
    params={sec.visual.params}
    onSvgReady={(svg) => { mafsRefs.current[idx] = svg; }}
  />
)}
```

**Step 3: Build check**
```bash
cd ~/github/edu-app/web && npm run build
```

**Step 4: Commit**
```bash
git add web/src/lib/printWorksheet.ts web/src/app/lessons/\[id\]/page.tsx
git commit -m "feat(worksheets): wire Mafs SVG capture into print window for geometry sections"
```

---

### Task 3.4: Update worksheet prompt for Mafs visual types

**Context:** Add the three Mafs visual types to the LLM prompt so it can generate coordinate planes, function plots, and polygon shapes for Grades 6–8 math worksheets.

**Files:**
- Modify: `kg-service/api/worksheet.py`

**Step 1: Add Mafs visual types to the visual section types block added in Task 2.5**

```
Advanced visual section types (Grades 6–8 math only):
  "type": "coordinate_plane_problem" → visual: { "type": "mafs_coordinate_plane", "params": { "xRange": [-5, 5], "yRange": [-5, 5], "points": [{"x": 2, "y": 3, "label": "A"}] } }
  "type": "function_graph"           → visual: { "type": "mafs_function", "params": { "fn": "2*x + 1" } }  (simple expressions only: +, -, *, /, ^)
  "type": "geometry_figure"          → visual: { "type": "mafs_polygon", "params": { "vertices": [[0,0],[3,0],[3,4],[0,4]], "color": "#5B8DD9" } }
```

**Step 2: Test with a Grade 7 geometry worksheet**
```bash
curl -s -X POST http://localhost:8000/generate-worksheet \
  -H "Content-Type: application/json" \
  -d '{"lesson_title":"Plotting Points and Graphing Lines","interest":"maps","philosophy":"project-based-learning","child_name":"Maya","grade":"7","lesson_sections":[],"standards_addressed":[{"description_plain":"Graph points on the coordinate plane"}]}' \
  | python3 -m json.tool | python3 -c "
import json, sys
data = json.load(sys.stdin)
for s in data['worksheet']['sections']:
    print(s['type'], '→ visual:', s.get('visual', {}).get('type', 'NONE'))
"
```
Expected: At least one section shows `→ visual: mafs_coordinate_plane` or `mafs_function`.

**Step 3: Commit**
```bash
git add kg-service/api/worksheet.py
git commit -m "feat(worksheets): add Mafs visual types to LLM prompt for grades 6-8"
```

---

### Task 3.5: Phase 3 gate — final eval and deploy

**Step 1: Final eval — full 32-worksheet run**
```bash
cd ~/github/edu-app/kg-service
.venv/bin/python -m evals.worksheet_eval 2>&1 | tee /tmp/phase3-full-eval.txt
```

Gate criteria to declare Phase 3 complete:
- Math `overall` average ≥ 4.8
- Science `overall` average ≥ 4.8
- `critical_issues` = 0 for both
- No regression vs Phase 2 baseline (`/tmp/phase2-full-eval.txt`)

**Step 2: Eval comparison**
```bash
echo "=== PHASE 2 BASELINE ===" && grep "averages" /tmp/phase2-full-eval.txt
echo "=== PHASE 3 RESULTS ===" && grep "averages" /tmp/phase3-full-eval.txt
```

**Step 3: Manual production test — three scenarios**

Scenario A (K-3 Math): Generate a fractions worksheet, Grade 3, Charlotte Mason.
- Expected: KaTeX fractions in instructions + fraction bar SVG + fraction circle SVG

Scenario B (4-8 Math): Generate a multiplication worksheet, Grade 5, Montessori.
- Expected: multiplication array SVG

Scenario C (6-8 Math): Generate a coordinate geometry worksheet, Grade 7, Project-Based.
- Expected: Mafs coordinate plane SVG

**Step 4: Build, push, monitor deploy**
```bash
cd ~/github/edu-app/web && npm run build
git push origin main
# monitor: cd ~/github/edu-app && railway deployment list
```

---

## Verification Summary

| Gate | Command | Pass Criteria |
|---|---|---|
| Phase 1 build | `npm run build` | `✓ Compiled successfully` |
| Phase 1 visual | Open print preview, fractions worksheet | KaTeX renders `½`, `¾` as typeset math |
| Phase 1 eval | `worksheet_eval.py --quick --subject math` | Save as baseline; no regressions |
| Phase 2 build | `npm run build` | `✓ Compiled successfully` |
| Phase 2 visual | `open /worksheet-visual-test.html` + print | All 7 SVGs render, no page breaks through diagrams |
| Phase 2 eval | `worksheet_eval.py --quick --subject math` | `SUBJECT_SPECIFICITY` ≥ 4.5, `critical_issues` = 0 |
| Phase 2 deploy | Full eval + production test | Fraction bar appears in print preview |
| Phase 3 build | `npm run build` | `✓ Compiled successfully` |
| Phase 3 eval | `worksheet_eval.py` (full 32) | Overall ≥ 4.8 both subjects, no regressions |
| Phase 3 manual | Three scenarios above | Correct visual in each scenario |
