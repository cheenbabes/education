// web/src/lib/worksheetSvg.ts
// Pure functions: params → SVG string. Zero dependencies.
// Colors use rgb() not hex (Puppeteer compatibility).

const FILL = "rgb(200, 220, 255)";     // shaded cells
const EMPTY = "rgb(255, 255, 255)";    // empty cells
const STROKE = "rgb(80, 80, 80)";      // borders/lines
const DOT = "rgb(60, 100, 160)";       // dots/counters

export function tenFrame(filled: number): string {
  // Two rows of 5 cells; first `filled` cells are shaded
  const cw = 40, ch = 40, pad = 5;
  const W = pad + 5 * (cw + pad); // 230 — exactly fits 5 columns with padding
  const H = pad + 2 * (ch + pad); // 110 — exactly fits 2 rows with padding
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

// Grid of 2-4 fraction circles labeled A, B, C, D — for multiple choice questions
export function fractionGrid(fractions: Array<{ n: number; d: number }>): string {
  const size = Math.min(fractions.length, 4);
  const cellW = 120, cellH = 140, cols = size <= 2 ? size : 2, rows = Math.ceil(size / 2);
  const W = cols * cellW, H = rows * cellH;
  const letters = ["A", "B", "C", "D"];
  let content = "";
  fractions.slice(0, 4).forEach(({ n, d }, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const ox = col * cellW, oy = row * cellH;
    const cx = ox + 48, cy = oy + 52, r = 40;
    // Circle slices
    for (let s = 0; s < d; s++) {
      const a1 = (s / d) * 2 * Math.PI - Math.PI / 2;
      const a2 = ((s + 1) / d) * 2 * Math.PI - Math.PI / 2;
      const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
      const lg = d === 1 ? 1 : 0;
      content += `<path d="M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${lg},1 ${x2.toFixed(1)},${y2.toFixed(1)} Z" fill="${s < n ? FILL : EMPTY}" stroke="${STROKE}" stroke-width="1.5"/>`;
    }
    // Letter label
    content += `<text x="${ox + 10}" y="${oy + 18}" font-family="Georgia,serif" font-size="14" font-weight="700" fill="${STROKE}">${letters[i]})</text>`;
    // Fraction label
    content += `<text x="${cx}" y="${oy + 108}" text-anchor="middle" font-family="Georgia,serif" font-size="12" fill="${STROKE}">${n}/${d}</text>`;
  });
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
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

// ── Graphic organizers ────────────────────────────────────────────────────────

export function vennDiagram(label1 = "A", label2 = "B", overlapLabel = "Both"): string {
  const W = 480, H = 220, r = 130, cx1 = 170, cx2 = 310, cy = 110, overlap = 90;
  // Two overlapping circles
  const circles = `
    <circle cx="${cx1}" cy="${cy}" r="${r}" fill="rgb(220,235,255)" fill-opacity="0.55" stroke="${STROKE}" stroke-width="1.5"/>
    <circle cx="${cx2}" cy="${cy}" r="${r}" fill="rgb(220,255,220)" fill-opacity="0.55" stroke="${STROKE}" stroke-width="1.5"/>`;
  // Section labels
  const labels = `
    <text x="${cx1 - overlap / 2}" y="28" text-anchor="middle" font-family="Georgia,serif" font-size="13" font-weight="600" fill="${STROKE}">${label1}</text>
    <text x="${cx2 + overlap / 2}" y="28" text-anchor="middle" font-family="Georgia,serif" font-size="13" font-weight="600" fill="${STROKE}">${label2}</text>
    <text x="${(cx1 + cx2) / 2}" y="28" text-anchor="middle" font-family="Georgia,serif" font-size="11" fill="rgb(100,100,100)">${overlapLabel}</text>`;
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${circles}${labels}</svg>`;
}

export function kwlChart(topic = ""): string {
  const W = 560, H = 220, cols = [0, 186, 373, 560], rowH = 40;
  const headers = ["K — What I Know", "W — What I Want to Know", "L — What I Learned"];
  let content = `<rect x="0" y="0" width="${W}" height="${H}" fill="rgb(255,255,255)" stroke="${STROKE}" stroke-width="1.5"/>`;
  // Column dividers
  for (let i = 1; i < 3; i++) {
    content += `<line x1="${cols[i]}" y1="0" x2="${cols[i]}" y2="${H}" stroke="${STROKE}" stroke-width="1"/>`;
  }
  // Header row background
  content += `<rect x="0" y="0" width="${W}" height="${rowH}" fill="rgb(220,230,245)"/>`;
  content += `<line x1="0" y1="${rowH}" x2="${W}" y2="${rowH}" stroke="${STROKE}" stroke-width="1"/>`;
  // Header text
  headers.forEach((h, i) => {
    content += `<text x="${(cols[i] + cols[i + 1]) / 2}" y="${rowH / 2 + 5}" text-anchor="middle" font-family="Georgia,serif" font-size="11" font-weight="600" fill="${STROKE}">${h}</text>`;
  });
  if (topic) {
    content += `<text x="${W / 2}" y="${H + 18}" text-anchor="middle" font-family="Georgia,serif" font-size="12" fill="rgb(120,120,120)">Topic: ${topic}</text>`;
  }
  return `<svg width="${W}" height="${topic ? H + 24 : H}" viewBox="0 0 ${W} ${topic ? H + 24 : H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

export function tChart(leftLabel = "A", rightLabel = "B", rows = 5): string {
  const W = 480, rowH = 36, headerH = 38, H = headerH + rows * rowH;
  const mid = W / 2;
  let content = `<rect x="0" y="0" width="${W}" height="${H}" fill="rgb(255,255,255)" stroke="${STROKE}" stroke-width="1.5"/>`;
  // Header background
  content += `<rect x="0" y="0" width="${W}" height="${headerH}" fill="rgb(220,230,245)"/>`;
  content += `<line x1="0" y1="${headerH}" x2="${W}" y2="${headerH}" stroke="${STROKE}" stroke-width="1"/>`;
  // Center divider
  content += `<line x1="${mid}" y1="0" x2="${mid}" y2="${H}" stroke="${STROKE}" stroke-width="1.5"/>`;
  // Header labels
  content += `<text x="${mid / 2}" y="${headerH / 2 + 5}" text-anchor="middle" font-family="Georgia,serif" font-size="13" font-weight="600" fill="${STROKE}">${leftLabel}</text>`;
  content += `<text x="${mid + mid / 2}" y="${headerH / 2 + 5}" text-anchor="middle" font-family="Georgia,serif" font-size="13" font-weight="600" fill="${STROKE}">${rightLabel}</text>`;
  // Row lines
  for (let i = 1; i <= rows; i++) {
    const y = headerH + i * rowH;
    content += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="rgb(200,200,200)" stroke-width="0.8"/>`;
  }
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

export function dataTable(headers: string[], rows = 4): string {
  const colW = Math.min(160, Math.max(80, Math.floor(520 / headers.length)));
  const W = colW * headers.length, rowH = 36, headerH = 40, H = headerH + rows * rowH;
  let content = `<rect x="0" y="0" width="${W}" height="${H}" fill="rgb(255,255,255)" stroke="${STROKE}" stroke-width="1.5"/>`;
  content += `<rect x="0" y="0" width="${W}" height="${headerH}" fill="rgb(220,230,245)"/>`;
  content += `<line x1="0" y1="${headerH}" x2="${W}" y2="${headerH}" stroke="${STROKE}" stroke-width="1"/>`;
  // Column headers + dividers
  headers.forEach((h, i) => {
    const x = i * colW;
    if (i > 0) content += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${STROKE}" stroke-width="1"/>`;
    content += `<text x="${x + colW / 2}" y="${headerH / 2 + 5}" text-anchor="middle" font-family="Georgia,serif" font-size="11" font-weight="600" fill="${STROKE}">${h}</text>`;
  });
  // Row lines
  for (let i = 1; i <= rows; i++) {
    content += `<line x1="0" y1="${headerH + i * rowH}" x2="${W}" y2="${headerH + i * rowH}" stroke="rgb(200,200,200)" stroke-width="0.8"/>`;
  }
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

export function timeline(events: string[], orientation: "horizontal" | "vertical" = "horizontal"): string {
  const count = Math.max(events.length, 3);
  if (orientation === "vertical") {
    const boxH = 44, gap = 16, pad = 20, W = 340, H = pad * 2 + count * (boxH + gap);
    let content = "";
    // Vertical spine
    content += `<line x1="60" y1="${pad}" x2="60" y2="${H - pad}" stroke="${STROKE}" stroke-width="2"/>`;
    events.forEach((e, i) => {
      const y = pad + i * (boxH + gap) + boxH / 2;
      content += `<circle cx="60" cy="${y}" r="7" fill="rgb(60,100,160)" stroke="${STROKE}" stroke-width="1.5"/>`;
      content += `<rect x="80" y="${pad + i * (boxH + gap)}" width="${W - 100}" height="${boxH}" rx="5" fill="rgb(245,248,255)" stroke="${STROKE}" stroke-width="1"/>`;
      if (e) content += `<text x="${80 + (W - 100) / 2}" y="${pad + i * (boxH + gap) + boxH / 2 + 5}" text-anchor="middle" font-family="Georgia,serif" font-size="12" fill="${STROKE}">${e}</text>`;
    });
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
  }
  // Horizontal
  const boxW = 90, boxH = 56, gap = 24, pad = 20, W = pad * 2 + count * (boxW + gap), H = 130;
  const lineY = 52;
  let content = `<line x1="${pad}" y1="${lineY}" x2="${W - pad}" y2="${lineY}" stroke="${STROKE}" stroke-width="2"/>`;
  events.forEach((e, i) => {
    const x = pad + i * (boxW + gap) + boxW / 2;
    content += `<circle cx="${x}" cy="${lineY}" r="7" fill="rgb(60,100,160)" stroke="${STROKE}" stroke-width="1.5"/>`;
    content += `<rect x="${x - boxW / 2}" y="${lineY + 16}" width="${boxW}" height="${boxH}" rx="5" fill="rgb(245,248,255)" stroke="${STROKE}" stroke-width="1"/>`;
    if (e) {
      const words = e.split(" ");
      const line1 = words.slice(0, 2).join(" "), line2 = words.slice(2).join(" ");
      content += `<text x="${x}" y="${lineY + 36}" text-anchor="middle" font-family="Georgia,serif" font-size="11" fill="${STROKE}">${line1}</text>`;
      if (line2) content += `<text x="${x}" y="${lineY + 50}" text-anchor="middle" font-family="Georgia,serif" font-size="11" fill="${STROKE}">${line2}</text>`;
    }
  });
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

// ── Science diagram templates (static SVG outlines) ───────────────────────────

export function plantDiagram(): string {
  // Simplified plant cross-section with label lines for: flower, leaf, stem, roots
  const W = 320, H = 300;
  const content = `
    <!-- Roots -->
    <path d="M160,240 Q140,265 125,285 M160,240 Q160,270 155,290 M160,240 Q178,262 195,282"
      stroke="${STROKE}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <!-- Stem -->
    <rect x="154" y="130" width="12" height="115" fill="rgb(120,180,80)" stroke="${STROKE}" stroke-width="1.5" rx="4"/>
    <!-- Left leaf -->
    <ellipse cx="125" cy="175" rx="38" ry="16" fill="rgb(150,210,100)" stroke="${STROKE}" stroke-width="1.5" transform="rotate(-30 125 175)"/>
    <!-- Right leaf -->
    <ellipse cx="195" cy="195" rx="38" ry="16" fill="rgb(150,210,100)" stroke="${STROKE}" stroke-width="1.5" transform="rotate(30 195 195)"/>
    <!-- Flower -->
    ${[0,60,120,180,240,300].map(a => `<ellipse cx="${160 + 24 * Math.cos(a * Math.PI / 180)}" cy="${110 + 24 * Math.sin(a * Math.PI / 180)}" rx="16" ry="10" fill="rgb(255,200,100)" stroke="${STROKE}" stroke-width="1" transform="rotate(${a} ${160 + 24 * Math.cos(a * Math.PI / 180)} ${110 + 24 * Math.sin(a * Math.PI / 180)})"/>`).join("")}
    <circle cx="160" cy="110" r="16" fill="rgb(255,160,50)" stroke="${STROKE}" stroke-width="1.5"/>
    <!-- Label lines + blanks -->
    <line x1="160" y1="95" x2="80" y2="60" stroke="rgb(150,150,150)" stroke-width="1" stroke-dasharray="3"/>
    <line x1="80" y1="60" x2="40" y2="60" stroke="${STROKE}" stroke-width="1"/>
    <text x="38" y="57" text-anchor="end" font-family="Georgia,serif" font-size="11" fill="rgb(150,150,150)">___________</text>
    <line x1="125" y1="175" x2="55" y2="155" stroke="rgb(150,150,150)" stroke-width="1" stroke-dasharray="3"/>
    <line x1="55" y1="155" x2="15" y2="155" stroke="${STROKE}" stroke-width="1"/>
    <text x="13" y="152" text-anchor="end" font-family="Georgia,serif" font-size="11" fill="rgb(150,150,150)">___________</text>
    <line x1="160" y1="200" x2="250" y2="200" stroke="rgb(150,150,150)" stroke-width="1" stroke-dasharray="3"/>
    <line x1="250" y1="200" x2="290" y2="200" stroke="${STROKE}" stroke-width="1"/>
    <text x="292" y="203" font-family="Georgia,serif" font-size="11" fill="rgb(150,150,150)">___________</text>
    <line x1="160" y1="270" x2="250" y2="270" stroke="rgb(150,150,150)" stroke-width="1" stroke-dasharray="3"/>
    <line x1="250" y1="270" x2="290" y2="270" stroke="${STROKE}" stroke-width="1"/>
    <text x="292" y="273" font-family="Georgia,serif" font-size="11" fill="rgb(150,150,150)">___________</text>`;
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

export function foodChain(organisms: string[]): string {
  const count = organisms.length || 4;
  const items = organisms.length > 0 ? organisms : ["", "", "", ""];
  const boxW = 100, boxH = 46, gap = 50, pad = 20;
  const W = pad * 2 + count * boxW + (count - 1) * gap, H = 120;
  const y = 37;
  let content = "";
  items.forEach((org, i) => {
    const x = pad + i * (boxW + gap);
    content += `<rect x="${x}" y="${y - boxH / 2}" width="${boxW}" height="${boxH}" rx="8" fill="rgb(240,248,240)" stroke="${STROKE}" stroke-width="1.5"/>`;
    content += `<text x="${x + boxW / 2}" y="${y + 5}" text-anchor="middle" font-family="Georgia,serif" font-size="12" fill="${STROKE}">${org}</text>`;
    if (i < items.length - 1) {
      const ax = x + boxW + 8, ay = y;
      content += `<line x1="${ax}" y1="${ay}" x2="${ax + gap - 16}" y2="${ay}" stroke="${STROKE}" stroke-width="2"/>`;
      content += `<polygon points="${ax + gap - 16},${ay - 5} ${ax + gap - 4},${ay} ${ax + gap - 16},${ay + 5}" fill="${STROKE}"/>`;
    }
  });
  // Energy label
  content += `<text x="${W / 2}" y="${H - 8}" text-anchor="middle" font-family="Georgia,serif" font-size="10" fill="rgb(150,150,150)" font-style="italic">Energy flows in the direction of the arrows</text>`;
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

export function storyMap(): string {
  // Beginning / Middle / End organizer with character, setting, problem, solution boxes
  const W = 520, H = 260;
  const sections = [
    { label: "Beginning", x: 10, w: 155 },
    { label: "Middle", x: 183, w: 155 },
    { label: "End", x: 355, w: 155 },
  ];
  let content = "";
  sections.forEach(({ label, x, w }) => {
    content += `<rect x="${x}" y="10" width="${w}" height="220" rx="8" fill="rgb(250,250,255)" stroke="${STROKE}" stroke-width="1.5"/>`;
    content += `<rect x="${x}" y="10" width="${w}" height="36" rx="8" fill="rgb(200,215,245)"/>`;
    content += `<rect x="${x}" y="34" width="${w}" height="12" fill="rgb(200,215,245)"/>`;
    content += `<text x="${x + w / 2}" y="33" text-anchor="middle" font-family="Georgia,serif" font-size="13" font-weight="600" fill="${STROKE}">${label}</text>`;
    // Writing lines
    for (let i = 0; i < 5; i++) {
      const ly = 72 + i * 30;
      content += `<line x1="${x + 12}" y1="${ly}" x2="${x + w - 12}" y2="${ly}" stroke="rgb(200,200,200)" stroke-width="0.8"/>`;
    }
  });
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

// ── Group A: Charts, graphs, and organizers ──────────────────────────────────

export function barGraph(labels: string[], values: number[], title = "", maxValue?: number): string {
  if (!Array.isArray(labels)) labels = [];
  if (!Array.isArray(values)) values = [];
  const max = maxValue ?? Math.max(...values, 1);
  const W = 380, pad = 40, barW = Math.min(50, Math.floor((W - pad * 2) / labels.length) - 8);
  const chartH = 160, H = chartH + pad * 2 + (title ? 20 : 0);
  const toBarH = (v: number) => Math.round((v / max) * chartH);
  const colors = ["rgb(180,210,255)", "rgb(180,255,210)", "rgb(255,220,180)", "rgb(220,180,255)", "rgb(255,180,180)", "rgb(180,240,240)"];
  let content = "";
  if (title) content += `<text x="${W / 2}" y="16" text-anchor="middle" font-family="Georgia,serif" font-size="12" font-weight="600" fill="${STROKE}">${title}</text>`;
  const baseY = (title ? 20 : 0) + pad + chartH;
  content += `<line x1="${pad}" y1="${baseY - chartH}" x2="${pad}" y2="${baseY}" stroke="${STROKE}" stroke-width="1.5"/>`;
  content += `<line x1="${pad}" y1="${baseY}" x2="${W - pad / 2}" y2="${baseY}" stroke="${STROKE}" stroke-width="1.5"/>`;
  for (let i = 0; i <= 4; i++) {
    const v = Math.round((max / 4) * i);
    const y = baseY - toBarH(v);
    content += `<text x="${pad - 6}" y="${y + 4}" text-anchor="end" font-family="Georgia,serif" font-size="9" fill="rgb(130,130,130)">${v}</text>`;
    content += `<line x1="${pad}" y1="${y}" x2="${pad + 4}" y2="${y}" stroke="rgb(150,150,150)" stroke-width="0.8"/>`;
  }
  const totalBarWidth = labels.length * (barW + 8);
  const startX = pad + (W - pad * 1.5 - totalBarWidth) / 2;
  labels.forEach((label, i) => {
    const bh = toBarH(values[i] ?? 0);
    const x = startX + i * (barW + 8);
    content += `<rect x="${x}" y="${baseY - bh}" width="${barW}" height="${bh}" fill="${colors[i % colors.length]}" stroke="${STROKE}" stroke-width="1" rx="2"/>`;
    content += `<text x="${x + barW / 2}" y="${baseY - bh - 4}" text-anchor="middle" font-family="Georgia,serif" font-size="10" fill="${STROKE}">${values[i] ?? 0}</text>`;
    content += `<text x="${x + barW / 2}" y="${baseY + 14}" text-anchor="middle" font-family="Georgia,serif" font-size="10" fill="${STROKE}">${label}</text>`;
  });
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

export function placeValueChart(columns: string[] = ["Hundreds", "Tens", "Ones"], values: (number | null)[] = [null, null, null]): string {
  if (!Array.isArray(columns)) columns = ["Hundreds", "Tens", "Ones"];
  if (!Array.isArray(values)) values = [null, null, null];
  const colW = 90, H = 120, headerH = 36;
  const W = columns.length * colW;
  let content = `<rect x="0" y="0" width="${W}" height="${H}" fill="rgb(255,255,255)" stroke="${STROKE}" stroke-width="1.5"/>`;
  content += `<rect x="0" y="0" width="${W}" height="${headerH}" fill="rgb(230,240,255)"/>`;
  content += `<line x1="0" y1="${headerH}" x2="${W}" y2="${headerH}" stroke="${STROKE}" stroke-width="1"/>`;
  columns.forEach((col, i) => {
    const x = i * colW;
    if (i > 0) content += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${STROKE}" stroke-width="1.5"/>`;
    content += `<text x="${x + colW / 2}" y="${headerH / 2 + 5}" text-anchor="middle" font-family="Georgia,serif" font-size="11" font-weight="600" fill="${STROKE}">${col}</text>`;
    if (values[i] !== null && values[i] !== undefined) {
      content += `<text x="${x + colW / 2}" y="${headerH + (H - headerH) / 2 + 8}" text-anchor="middle" font-family="Georgia,serif" font-size="28" font-weight="700" fill="rgb(60,100,160)">${values[i]}</text>`;
    }
  });
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

export function ruler(length = 6, unit: "in" | "cm" = "in"): string {
  const ticksPerUnit = unit === "cm" ? 10 : 8;
  const totalTicks = length * ticksPerUnit;
  const W = 420, H = 56, bodyH = 38, pad = 10;
  const unitW = (W - pad * 2) / length;
  const tickW = unitW / ticksPerUnit;
  let content = `<rect x="${pad}" y="0" width="${W - pad * 2}" height="${bodyH}" fill="rgb(255,252,220)" stroke="${STROKE}" stroke-width="1.5" rx="3"/>`;
  for (let t = 0; t <= totalTicks; t++) {
    const x = pad + t * tickW;
    const isMajor = t % ticksPerUnit === 0;
    const isHalf = unit === "in" && t % (ticksPerUnit / 2) === 0;
    const tickH = isMajor ? 20 : isHalf ? 13 : 8;
    content += `<line x1="${x}" y1="0" x2="${x}" y2="${tickH}" stroke="${STROKE}" stroke-width="${isMajor ? 1.5 : 0.8}"/>`;
    if (isMajor && t > 0) content += `<text x="${x}" y="${bodyH + 14}" text-anchor="middle" font-family="Georgia,serif" font-size="10" fill="${STROKE}">${t / ticksPerUnit}</text>`;
  }
  content += `<text x="${pad + (W - pad * 2) / 2}" y="${bodyH - 8}" text-anchor="middle" font-family="Georgia,serif" font-size="9" fill="rgb(150,130,80)">${unit === "in" ? "inches" : "centimeters"}</text>`;
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

export function wordWeb(centerWord: string, relatedWords: string[] = []): string {
  const cx = 200, cy = 140, r = 45, spokeR = 100, W = 400, H = 280;
  const words = relatedWords.slice(0, 6);
  const angles = words.length > 0 ? words.map((_, i) => (i / words.length) * 2 * Math.PI - Math.PI / 2) : [0,1,2,3,4,5].map(i => (i / 6) * 2 * Math.PI - Math.PI / 2);
  let content = `<ellipse cx="${cx}" cy="${cy}" rx="${r + 10}" ry="${r - 5}" fill="rgb(220,230,255)" stroke="${STROKE}" stroke-width="2"/>`;
  content += `<text x="${cx}" y="${cy + 5}" text-anchor="middle" font-family="Georgia,serif" font-size="13" font-weight="700" fill="${STROKE}">${centerWord}</text>`;
  angles.forEach((angle, i) => {
    const wx = cx + spokeR * Math.cos(angle), wy = cy + spokeR * Math.sin(angle);
    const word = words[i] ?? "";
    content += `<line x1="${cx + r * Math.cos(angle)}" y1="${cy + (r - 5) * Math.sin(angle)}" x2="${wx - 28 * Math.cos(angle)}" y2="${wy - 22 * Math.sin(angle)}" stroke="${word ? STROKE : "rgb(180,180,180)"}" stroke-width="1.2" stroke-dasharray="${word ? "none" : "3"}"/>`;
    content += `<ellipse cx="${wx}" cy="${wy}" rx="42" ry="20" fill="${word ? "rgb(240,250,240)" : "rgb(250,250,255)"}" stroke="${word ? STROKE : "rgb(180,180,180)"}" stroke-width="1.5"/>`;
    if (word) content += `<text x="${wx}" y="${wy + 5}" text-anchor="middle" font-family="Georgia,serif" font-size="11" fill="${STROKE}">${word}</text>`;
  });
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

export function numberBonds(whole: number | null = null, part1: number | null = null, part2: number | null = null): string {
  const W = 260, H = 140, r = 26;
  const topX = 130, topY = 36, leftX = 60, leftY = 108, rightX = 200, rightY = 108;
  const fmt = (v: number | null) => v !== null ? String(v) : "";
  let content = "";
  content += `<line x1="${topX}" y1="${topY + r}" x2="${leftX + r * 0.7}" y2="${leftY - r * 0.7}" stroke="${STROKE}" stroke-width="2"/>`;
  content += `<line x1="${topX}" y1="${topY + r}" x2="${rightX - r * 0.7}" y2="${rightY - r * 0.7}" stroke="${STROKE}" stroke-width="2"/>`;
  [[topX, topY, whole], [leftX, leftY, part1], [rightX, rightY, part2]].forEach(([x, y, val]) => {
    const filled = (val as number | null) !== null;
    content += `<circle cx="${x}" cy="${y}" r="${r}" fill="${filled ? "rgb(220,235,255)" : EMPTY}" stroke="${STROKE}" stroke-width="2"/>`;
    if (filled) content += `<text x="${x}" y="${(y as number) + 6}" text-anchor="middle" font-family="Georgia,serif" font-size="18" font-weight="700" fill="${STROKE}">${fmt(val as number | null)}</text>`;
  });
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

export function causeEffect(cause = "", effect = ""): string {
  const W = 400, H = 80, boxW = 160, boxH = 56, gap = 24, leftX = 12, rightX = leftX + boxW + gap + 32;
  let content = "";
  content += `<rect x="${leftX}" y="${(H - boxH) / 2}" width="${boxW}" height="${boxH}" rx="8" fill="rgb(255,235,200)" stroke="${STROKE}" stroke-width="1.5"/>`;
  content += `<text x="${leftX + 8}" y="${(H - boxH) / 2 + 14}" font-family="Georgia,serif" font-size="9" font-weight="600" fill="rgb(180,80,20)">CAUSE</text>`;
  if (cause) {
    const words = cause.split(" "), mid = Math.ceil(words.length / 2);
    content += `<text x="${leftX + boxW / 2}" y="${H / 2 - 3}" text-anchor="middle" font-family="Georgia,serif" font-size="11" fill="${STROKE}">${words.slice(0, mid).join(" ")}</text>`;
    if (mid < words.length) content += `<text x="${leftX + boxW / 2}" y="${H / 2 + 11}" text-anchor="middle" font-family="Georgia,serif" font-size="11" fill="${STROKE}">${words.slice(mid).join(" ")}</text>`;
  }
  const arrowX = leftX + boxW + 4;
  content += `<line x1="${arrowX}" y1="${H / 2}" x2="${arrowX + gap + 20}" y2="${H / 2}" stroke="${STROKE}" stroke-width="2"/>`;
  content += `<polygon points="${arrowX + gap + 20},${H / 2 - 5} ${arrowX + gap + 30},${H / 2} ${arrowX + gap + 20},${H / 2 + 5}" fill="${STROKE}"/>`;
  content += `<rect x="${rightX}" y="${(H - boxH) / 2}" width="${boxW}" height="${boxH}" rx="8" fill="rgb(200,230,255)" stroke="${STROKE}" stroke-width="1.5"/>`;
  content += `<text x="${rightX + 8}" y="${(H - boxH) / 2 + 14}" font-family="Georgia,serif" font-size="9" font-weight="600" fill="rgb(20,80,180)">EFFECT</text>`;
  if (effect) {
    const words = effect.split(" "), mid = Math.ceil(words.length / 2);
    content += `<text x="${rightX + boxW / 2}" y="${H / 2 - 3}" text-anchor="middle" font-family="Georgia,serif" font-size="11" fill="${STROKE}">${words.slice(0, mid).join(" ")}</text>`;
    if (mid < words.length) content += `<text x="${rightX + boxW / 2}" y="${H / 2 + 11}" text-anchor="middle" font-family="Georgia,serif" font-size="11" fill="${STROKE}">${words.slice(mid).join(" ")}</text>`;
  }
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

// ── Group B small: Simple visuals ────────────────────────────────────────────

export function areaGrid(rows = 4, cols = 4, shadedCells?: number): string {
  const cellSize = 36, pad = 8;
  const W = pad * 2 + cols * cellSize, H = pad * 2 + rows * cellSize + 20;
  const shaded = shadedCells ?? 0;
  let content = "";
  let cellIndex = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = pad + c * cellSize, y = pad + r * cellSize;
      content += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${cellIndex < shaded ? FILL : EMPTY}" stroke="${STROKE}" stroke-width="1.5"/>`;
      cellIndex++;
    }
  }
  content += `<text x="${W / 2}" y="${H - 4}" text-anchor="middle" font-family="Georgia,serif" font-size="11" fill="${STROKE}">${rows} x ${cols} = ${rows * cols} square units</text>`;
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

export function thermometer(currentTemp = 70, minTemp = 0, maxTemp = 100, unit = "F"): string {
  const W = 120, H = 260, bulbR = 20, tubeW = 16, tubeH = 180;
  const tubeX = W / 2 - tubeW / 2, tubeY = 20;
  const bulbCY = tubeY + tubeH + bulbR - 4;
  const range = maxTemp - minTemp || 1;
  const fillH = Math.max(0, Math.min(tubeH, ((currentTemp - minTemp) / range) * tubeH));
  let content = "";
  content += `<rect x="${tubeX}" y="${tubeY}" width="${tubeW}" height="${tubeH}" fill="${EMPTY}" stroke="${STROKE}" stroke-width="1.5" rx="8"/>`;
  content += `<rect x="${tubeX + 2}" y="${tubeY + tubeH - fillH}" width="${tubeW - 4}" height="${fillH + bulbR}" fill="rgb(220,60,60)" rx="4"/>`;
  content += `<circle cx="${W / 2}" cy="${bulbCY}" r="${bulbR}" fill="rgb(220,60,60)" stroke="${STROKE}" stroke-width="1.5"/>`;
  for (let t = minTemp; t <= maxTemp; t += 5) {
    const y = tubeY + tubeH - ((t - minTemp) / range) * tubeH;
    const isMajor = t % 10 === 0;
    content += `<line x1="${tubeX + tubeW + 2}" y1="${y}" x2="${tubeX + tubeW + (isMajor ? 10 : 6)}" y2="${y}" stroke="${STROKE}" stroke-width="${isMajor ? 1.2 : 0.6}"/>`;
    if (isMajor) content += `<text x="${tubeX + tubeW + 14}" y="${y + 4}" font-family="Georgia,serif" font-size="9" fill="${STROKE}">${t}</text>`;
  }
  content += `<text x="${W / 2}" y="${H - 4}" text-anchor="middle" font-family="Georgia,serif" font-size="12" font-weight="600" fill="${STROKE}">${currentTemp}${unit}</text>`;
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

export function sequenceArrows(steps = 4, labels?: string[]): string {
  const boxW = 70, boxH = 44, gap = 30, pad = 16;
  const count = Math.max(3, Math.min(6, steps));
  const W = pad * 2 + count * boxW + (count - 1) * gap, H = 80;
  const cy = H / 2;
  let content = "";
  for (let i = 0; i < count; i++) {
    const x = pad + i * (boxW + gap);
    content += `<rect x="${x}" y="${cy - boxH / 2}" width="${boxW}" height="${boxH}" rx="8" fill="rgb(235,245,255)" stroke="${STROKE}" stroke-width="1.5"/>`;
    content += `<text x="${x + boxW / 2}" y="${cy - 4}" text-anchor="middle" font-family="Georgia,serif" font-size="16" font-weight="700" fill="${DOT}">${i + 1}</text>`;
    if (labels?.[i]) content += `<text x="${x + boxW / 2}" y="${cy + 14}" text-anchor="middle" font-family="Georgia,serif" font-size="10" fill="${STROKE}">${labels[i]}</text>`;
    if (i < count - 1) {
      const ax = x + boxW + 4;
      content += `<line x1="${ax}" y1="${cy}" x2="${ax + gap - 12}" y2="${cy}" stroke="${STROKE}" stroke-width="2"/>`;
      content += `<polygon points="${ax + gap - 12},${cy - 5} ${ax + gap - 2},${cy} ${ax + gap - 12},${cy + 5}" fill="${STROKE}"/>`;
    }
  }
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

export function numberGrid(highlight?: number[]): string {
  const cellSize = 32, pad = 4;
  const W = pad * 2 + 10 * cellSize, H = pad * 2 + 10 * cellSize;
  const hl = new Set(highlight ?? []);
  let content = "";
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      const num = r * 10 + c + 1;
      const x = pad + c * cellSize, y = pad + r * cellSize;
      content += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${hl.has(num) ? FILL : EMPTY}" stroke="${STROKE}" stroke-width="0.8"/>`;
      content += `<text x="${x + cellSize / 2}" y="${y + cellSize / 2 + 4}" text-anchor="middle" font-family="Georgia,serif" font-size="10" fill="${STROKE}">${num}</text>`;
    }
  }
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

export function compassRose(): string {
  const W = 200, H = 200, cx = 100, cy = 100, outerR = 72, innerR = 20;
  let content = "";
  content += `<circle cx="${cx}" cy="${cy}" r="${outerR + 12}" fill="${EMPTY}" stroke="${STROKE}" stroke-width="1.5"/>`;
  const dirs: Array<{ label: string; angle: number }> = [
    { label: "N", angle: -Math.PI / 2 },
    { label: "E", angle: 0 },
    { label: "S", angle: Math.PI / 2 },
    { label: "W", angle: Math.PI },
  ];
  dirs.forEach(({ label, angle }) => {
    const tipX = cx + outerR * Math.cos(angle), tipY = cy + outerR * Math.sin(angle);
    const lA = angle - Math.PI / 2, rA = angle + Math.PI / 2;
    const lx = cx + innerR * Math.cos(lA), ly = cy + innerR * Math.sin(lA);
    const rx = cx + innerR * Math.cos(rA), ry = cy + innerR * Math.sin(rA);
    content += `<polygon points="${tipX},${tipY} ${lx},${ly} ${cx},${cy}" fill="rgb(200,220,255)" stroke="${STROKE}" stroke-width="1"/>`;
    content += `<polygon points="${tipX},${tipY} ${rx},${ry} ${cx},${cy}" fill="rgb(230,240,255)" stroke="${STROKE}" stroke-width="1"/>`;
    const labelR = outerR + 20;
    content += `<text x="${cx + labelR * Math.cos(angle)}" y="${cy + labelR * Math.sin(angle) + 5}" text-anchor="middle" font-family="Georgia,serif" font-size="14" font-weight="700" fill="${STROKE}">${label}</text>`;
  });
  content += `<circle cx="${cx}" cy="${cy}" r="4" fill="${STROKE}"/>`;
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

export function weatherSymbols(symbols?: string[]): string {
  const allSymbols = ["sun", "cloud", "rain", "snow", "wind"];
  const shown = symbols && symbols.length > 0 ? symbols : allSymbols;
  const cellW = 80, cellH = 90, pad = 8;
  const W = pad * 2 + shown.length * cellW, H = cellH + pad * 2;
  let content = "";
  shown.forEach((sym, i) => {
    const cx = pad + i * cellW + cellW / 2, cy = pad + 36;
    if (sym === "sun") {
      content += `<circle cx="${cx}" cy="${cy}" r="16" fill="rgb(255,220,80)" stroke="rgb(200,160,0)" stroke-width="1.5"/>`;
      for (let a = 0; a < 8; a++) {
        const ang = (a / 8) * 2 * Math.PI;
        content += `<line x1="${cx + 20 * Math.cos(ang)}" y1="${cy + 20 * Math.sin(ang)}" x2="${cx + 28 * Math.cos(ang)}" y2="${cy + 28 * Math.sin(ang)}" stroke="rgb(200,160,0)" stroke-width="2" stroke-linecap="round"/>`;
      }
    } else if (sym === "cloud") {
      content += `<ellipse cx="${cx}" cy="${cy}" rx="28" ry="16" fill="rgb(210,220,230)" stroke="${STROKE}" stroke-width="1.2"/>`;
      content += `<ellipse cx="${cx - 12}" cy="${cy - 8}" rx="16" ry="12" fill="rgb(210,220,230)" stroke="${STROKE}" stroke-width="1.2"/>`;
      content += `<ellipse cx="${cx + 10}" cy="${cy - 10}" rx="18" ry="13" fill="rgb(210,220,230)" stroke="${STROKE}" stroke-width="1.2"/>`;
    } else if (sym === "rain") {
      content += `<ellipse cx="${cx}" cy="${cy - 6}" rx="22" ry="12" fill="rgb(180,200,220)" stroke="${STROKE}" stroke-width="1"/>`;
      for (let d = 0; d < 3; d++) content += `<line x1="${cx - 10 + d * 10}" y1="${cy + 10}" x2="${cx - 14 + d * 10}" y2="${cy + 22}" stroke="rgb(80,140,220)" stroke-width="2" stroke-linecap="round"/>`;
    } else if (sym === "snow") {
      content += `<ellipse cx="${cx}" cy="${cy - 6}" rx="22" ry="12" fill="rgb(200,210,225)" stroke="${STROKE}" stroke-width="1"/>`;
      for (let d = 0; d < 3; d++) content += `<text x="${cx - 10 + d * 10}" y="${cy + 20}" text-anchor="middle" font-family="Georgia,serif" font-size="14" fill="rgb(100,150,220)">*</text>`;
    } else if (sym === "wind") {
      for (let l = 0; l < 3; l++) {
        const y = cy - 8 + l * 10;
        content += `<path d="M${cx - 20},${y} Q${cx},${y - 6} ${cx + 20},${y}" fill="none" stroke="rgb(100,140,180)" stroke-width="2" stroke-linecap="round"/>`;
      }
    }
    content += `<text x="${cx}" y="${cellH + pad - 4}" text-anchor="middle" font-family="Georgia,serif" font-size="11" fill="${STROKE}">${sym.charAt(0).toUpperCase() + sym.slice(1)}</text>`;
  });
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

export function paragraphOrganizer(): string {
  const W = 400, boxW = 360, pad = 20;
  const topH = 60, detailH = 50, bottomH = 60;
  let content = "";
  let y = pad;
  content += `<rect x="${pad}" y="${y}" width="${boxW}" height="${topH}" rx="6" fill="rgb(230,245,255)" stroke="${STROKE}" stroke-width="1.5"/>`;
  content += `<text x="${pad + 10}" y="${y + 16}" font-family="Georgia,serif" font-size="10" font-weight="600" fill="${DOT}">Topic Sentence</text>`;
  content += `<line x1="${pad + 10}" y1="${y + 35}" x2="${pad + boxW - 10}" y2="${y + 35}" stroke="rgb(200,200,200)" stroke-width="0.8"/>`;
  content += `<line x1="${pad + 10}" y1="${y + 50}" x2="${pad + boxW - 10}" y2="${y + 50}" stroke="rgb(200,200,200)" stroke-width="0.8"/>`;
  y += topH + 12;
  for (let i = 0; i < 3; i++) {
    content += `<rect x="${pad}" y="${y}" width="${boxW}" height="${detailH}" rx="6" fill="rgb(250,250,240)" stroke="${STROKE}" stroke-width="1.5"/>`;
    content += `<text x="${pad + 10}" y="${y + 16}" font-family="Georgia,serif" font-size="10" font-weight="600" fill="${DOT}">Detail ${i + 1}</text>`;
    content += `<line x1="${pad + 10}" y1="${y + 32}" x2="${pad + boxW - 10}" y2="${y + 32}" stroke="rgb(200,200,200)" stroke-width="0.8"/>`;
    content += `<line x1="${pad + 10}" y1="${y + 44}" x2="${pad + boxW - 10}" y2="${y + 44}" stroke="rgb(200,200,200)" stroke-width="0.8"/>`;
    y += detailH + 10;
  }
  content += `<rect x="${pad}" y="${y}" width="${boxW}" height="${bottomH}" rx="6" fill="rgb(230,255,230)" stroke="${STROKE}" stroke-width="1.5"/>`;
  content += `<text x="${pad + 10}" y="${y + 16}" font-family="Georgia,serif" font-size="10" font-weight="600" fill="${DOT}">Conclusion Sentence</text>`;
  content += `<line x1="${pad + 10}" y1="${y + 35}" x2="${pad + boxW - 10}" y2="${y + 35}" stroke="rgb(200,200,200)" stroke-width="0.8"/>`;
  content += `<line x1="${pad + 10}" y1="${y + 50}" x2="${pad + boxW - 10}" y2="${y + 50}" stroke="rgb(200,200,200)" stroke-width="0.8"/>`;
  const H = y + bottomH + pad;
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

export function sequenceStrip(count = 4, labels?: string[]): string {
  const boxW = 80, boxH = 50, gap = 24, pad = 12;
  const n = Math.max(3, Math.min(6, count));
  const W = pad * 2 + n * boxW + (n - 1) * gap, H = boxH + pad * 2;
  const cy = H / 2;
  let content = "";
  for (let i = 0; i < n; i++) {
    const x = pad + i * (boxW + gap);
    content += `<rect x="${x}" y="${cy - boxH / 2}" width="${boxW}" height="${boxH}" rx="6" fill="rgb(245,248,255)" stroke="${STROKE}" stroke-width="1.5"/>`;
    if (labels?.[i]) content += `<text x="${x + boxW / 2}" y="${cy + 5}" text-anchor="middle" font-family="Georgia,serif" font-size="11" fill="${STROKE}">${labels[i]}</text>`;
    if (i < n - 1) {
      const ax = x + boxW + 4;
      content += `<line x1="${ax}" y1="${cy}" x2="${ax + gap - 12}" y2="${cy}" stroke="${STROKE}" stroke-width="2"/>`;
      content += `<polygon points="${ax + gap - 12},${cy - 5} ${ax + gap - 2},${cy} ${ax + gap - 12},${cy + 5}" fill="${STROKE}"/>`;
    }
  }
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

// ── Group B medium: Complex visuals ──────────────────────────────────────────

export function base10Blocks(hundreds = 0, tens = 0, ones = 0): string {
  const u = 8, pad = 16, gap = 16;
  const hCount = Math.min(3, hundreds), tCount = Math.min(9, tens), oCount = Math.min(9, ones);
  const flatSize = u * 10;
  let x = pad;
  let content = "";
  for (let h = 0; h < hCount; h++) {
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        content += `<rect x="${x + c * u}" y="${pad + r * u}" width="${u}" height="${u}" fill="rgb(180,210,255)" stroke="${STROKE}" stroke-width="0.5"/>`;
      }
    }
    x += flatSize + gap;
  }
  for (let t = 0; t < tCount; t++) {
    for (let r = 0; r < 10; r++) {
      content += `<rect x="${x}" y="${pad + r * u}" width="${u}" height="${u}" fill="rgb(180,255,200)" stroke="${STROKE}" stroke-width="0.5"/>`;
    }
    x += u + 4;
  }
  if (tCount > 0) x += gap - 4;
  for (let o = 0; o < oCount; o++) {
    content += `<rect x="${x}" y="${pad + 9 * u}" width="${u}" height="${u}" fill="rgb(255,220,180)" stroke="${STROKE}" stroke-width="0.5"/>`;
    x += u + 2;
  }
  const W = Math.max(x + pad, 100);
  const H = pad * 2 + flatSize + 20;
  content += `<text x="${W / 2}" y="${H - 4}" text-anchor="middle" font-family="Georgia,serif" font-size="11" fill="${STROKE}">${hundreds * 100 + tens * 10 + ones}</text>`;
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

export function labeledShape(shape = "rectangle", dimensions?: string[]): string {
  const W = 300, H = 260, cx = 150, cy = 120;
  const dims = dimensions ?? [];
  let content = "";
  switch (shape) {
    case "circle": {
      const r = 70;
      content += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="rgb(230,240,255)" stroke="${STROKE}" stroke-width="2"/>`;
      content += `<line x1="${cx}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="${DOT}" stroke-width="1.5" stroke-dasharray="4"/>`;
      content += `<text x="${cx + r / 2}" y="${cy - 6}" text-anchor="middle" font-family="Georgia,serif" font-size="11" fill="${DOT}">${dims[0] ?? "r"}</text>`;
      break;
    }
    case "square": {
      const s = 120, sx = cx - s / 2, sy = cy - s / 2;
      content += `<rect x="${sx}" y="${sy}" width="${s}" height="${s}" fill="rgb(230,240,255)" stroke="${STROKE}" stroke-width="2"/>`;
      content += `<text x="${cx}" y="${sy - 6}" text-anchor="middle" font-family="Georgia,serif" font-size="11" fill="${DOT}">${dims[0] ?? "s"}</text>`;
      break;
    }
    case "triangle": {
      const bw = 140, th = 120;
      const x1t = cx - bw / 2, y1t = cy + th / 2, x2t = cx + bw / 2, y2t = cy + th / 2, x3t = cx, y3t = cy - th / 2;
      content += `<polygon points="${x1t},${y1t} ${x2t},${y2t} ${x3t},${y3t}" fill="rgb(230,240,255)" stroke="${STROKE}" stroke-width="2"/>`;
      content += `<text x="${cx}" y="${y1t + 16}" text-anchor="middle" font-family="Georgia,serif" font-size="11" fill="${DOT}">${dims[0] ?? "base"}</text>`;
      content += `<line x1="${cx}" y1="${y1t}" x2="${cx}" y2="${y3t}" stroke="${DOT}" stroke-width="1" stroke-dasharray="4"/>`;
      content += `<text x="${cx + 10}" y="${cy + 4}" font-family="Georgia,serif" font-size="11" fill="${DOT}">${dims[1] ?? "height"}</text>`;
      break;
    }
    case "pentagon": {
      const r = 70;
      const pts = Array.from({ length: 5 }, (_, i) => { const a = (i / 5) * 2 * Math.PI - Math.PI / 2; return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`; }).join(" ");
      content += `<polygon points="${pts}" fill="rgb(230,240,255)" stroke="${STROKE}" stroke-width="2"/>`;
      if (dims[0]) content += `<text x="${cx}" y="${cy + r + 18}" text-anchor="middle" font-family="Georgia,serif" font-size="11" fill="${DOT}">${dims[0]}</text>`;
      break;
    }
    case "hexagon": {
      const r = 70;
      const pts = Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * 2 * Math.PI - Math.PI / 2; return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`; }).join(" ");
      content += `<polygon points="${pts}" fill="rgb(230,240,255)" stroke="${STROKE}" stroke-width="2"/>`;
      if (dims[0]) content += `<text x="${cx}" y="${cy + r + 18}" text-anchor="middle" font-family="Georgia,serif" font-size="11" fill="${DOT}">${dims[0]}</text>`;
      break;
    }
    default: {
      const rw = 160, rh = 100, rx = cx - rw / 2, ry = cy - rh / 2;
      content += `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="rgb(230,240,255)" stroke="${STROKE}" stroke-width="2"/>`;
      content += `<text x="${cx}" y="${ry - 6}" text-anchor="middle" font-family="Georgia,serif" font-size="11" fill="${DOT}">${dims[0] ?? "length"}</text>`;
      content += `<text x="${rx - 8}" y="${cy + 4}" text-anchor="end" font-family="Georgia,serif" font-size="11" fill="${DOT}">${dims[1] ?? "width"}</text>`;
      break;
    }
  }
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

export function protractor(): string {
  const W = 400, H = 220, cx = 200, cy = 200, r = 170;
  let content = "";
  content += `<path d="M${cx - r},${cy} A${r},${r} 0 0,1 ${cx + r},${cy}" fill="rgb(255,252,230)" stroke="${STROKE}" stroke-width="1.5"/>`;
  content += `<line x1="${cx - r}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="${STROKE}" stroke-width="1.5"/>`;
  for (let deg = 0; deg <= 180; deg += 1) {
    const angle = (deg * Math.PI) / 180;
    const cos = Math.cos(Math.PI - angle), sin = Math.sin(Math.PI - angle);
    const isMajor = deg % 10 === 0;
    const isMid = deg % 5 === 0;
    const innerR = isMajor ? r - 18 : isMid ? r - 12 : r - 7;
    content += `<line x1="${(cx + r * cos).toFixed(1)}" y1="${(cy - r * sin).toFixed(1)}" x2="${(cx + innerR * cos).toFixed(1)}" y2="${(cy - innerR * sin).toFixed(1)}" stroke="${STROKE}" stroke-width="${isMajor ? 1.2 : 0.5}"/>`;
    if (isMajor) {
      const labelR = r - 26;
      content += `<text x="${(cx + labelR * cos).toFixed(1)}" y="${(cy - labelR * sin + 4).toFixed(1)}" text-anchor="middle" font-family="Georgia,serif" font-size="9" fill="${STROKE}">${deg}</text>`;
    }
  }
  content += `<circle cx="${cx}" cy="${cy}" r="3" fill="${STROKE}"/>`;
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

export function equationBalance(leftSide = "x", rightSide = "?"): string {
  const W = 360, H = 160;
  const beamY = 60, beamW = 280;
  const cx = W / 2;
  const lx = cx - beamW / 2 + 20, rx = cx + beamW / 2 - 20;
  const panY = beamY - 4;
  let content = "";
  content += `<polygon points="${cx},${beamY} ${cx - 30},${beamY + 50} ${cx + 30},${beamY + 50}" fill="rgb(200,200,200)" stroke="${STROKE}" stroke-width="1.5"/>`;
  content += `<line x1="${cx - beamW / 2}" y1="${beamY}" x2="${cx + beamW / 2}" y2="${beamY}" stroke="${STROKE}" stroke-width="3"/>`;
  content += `<line x1="${lx - 20}" y1="${panY}" x2="${lx - 30}" y2="${panY + 30}" stroke="${STROKE}" stroke-width="1"/>`;
  content += `<line x1="${lx + 20}" y1="${panY}" x2="${lx + 30}" y2="${panY + 30}" stroke="${STROKE}" stroke-width="1"/>`;
  content += `<ellipse cx="${lx}" cy="${panY + 34}" rx="36" ry="8" fill="rgb(220,235,255)" stroke="${STROKE}" stroke-width="1.5"/>`;
  content += `<text x="${lx}" y="${panY + 38}" text-anchor="middle" font-family="Georgia,serif" font-size="13" font-weight="600" fill="${STROKE}">${leftSide}</text>`;
  content += `<line x1="${rx - 20}" y1="${panY}" x2="${rx - 30}" y2="${panY + 30}" stroke="${STROKE}" stroke-width="1"/>`;
  content += `<line x1="${rx + 20}" y1="${panY}" x2="${rx + 30}" y2="${panY + 30}" stroke="${STROKE}" stroke-width="1"/>`;
  content += `<ellipse cx="${rx}" cy="${panY + 34}" rx="36" ry="8" fill="rgb(255,235,220)" stroke="${STROKE}" stroke-width="1.5"/>`;
  content += `<text x="${rx}" y="${panY + 38}" text-anchor="middle" font-family="Georgia,serif" font-size="13" font-weight="600" fill="${STROKE}">${rightSide}</text>`;
  content += `<text x="${cx}" y="${H - 10}" text-anchor="middle" font-family="Georgia,serif" font-size="14" fill="${STROKE}">=</text>`;
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

export function lifecycleDiagram(stages: string[] = []): string {
  const W = 320, H = 320, cx = 160, cy = 160, r = 100;
  const items = stages.length > 0 ? stages.slice(0, 4) : ["Stage 1", "Stage 2", "Stage 3", "Stage 4"];
  const count = items.length;
  let content = "";
  items.forEach((stage, i) => {
    const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
    const nextAngle = ((i + 1) % count / count) * 2 * Math.PI - Math.PI / 2;
    const sx = cx + r * Math.cos(angle), sy = cy + r * Math.sin(angle);
    const bw = 80, bh = 32;
    content += `<rect x="${sx - bw / 2}" y="${sy - bh / 2}" width="${bw}" height="${bh}" rx="6" fill="rgb(235,245,255)" stroke="${STROKE}" stroke-width="1.5"/>`;
    content += `<text x="${sx}" y="${sy + 5}" text-anchor="middle" font-family="Georgia,serif" font-size="10" fill="${STROKE}">${stage}</text>`;
    const midAngle = angle + (2 * Math.PI / count) / 2;
    const arcR = r - 16;
    const mx = cx + arcR * Math.cos(midAngle), my = cy + arcR * Math.sin(midAngle);
    const startOff = 24;
    const asx = sx + startOff * Math.cos(angle + Math.PI / 3), asy = sy + startOff * Math.sin(angle + Math.PI / 3);
    const nx = cx + r * Math.cos(nextAngle), ny = cy + r * Math.sin(nextAngle);
    const aex = nx + startOff * Math.cos(nextAngle - Math.PI / 3), aey = ny + startOff * Math.sin(nextAngle - Math.PI / 3);
    content += `<path d="M${asx.toFixed(1)},${asy.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${aex.toFixed(1)},${aey.toFixed(1)}" fill="none" stroke="${STROKE}" stroke-width="1.5"/>`;
    const arrowAng = Math.atan2(aey - my, aex - mx);
    content += `<polygon points="${aex.toFixed(1)},${aey.toFixed(1)} ${(aex - 8 * Math.cos(arrowAng - 0.4)).toFixed(1)},${(aey - 8 * Math.sin(arrowAng - 0.4)).toFixed(1)} ${(aex - 8 * Math.cos(arrowAng + 0.4)).toFixed(1)},${(aey - 8 * Math.sin(arrowAng + 0.4)).toFixed(1)}" fill="${STROKE}"/>`;
  });
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

export function earthLayers(): string {
  const W = 360, H = 280, cx = 140, cy = 260;
  const layers = [
    { label: "Inner Core", r: 30, fill: "rgb(255,160,80)" },
    { label: "Outer Core", r: 70, fill: "rgb(255,200,100)" },
    { label: "Mantle", r: 150, fill: "rgb(200,120,80)" },
    { label: "Crust", r: 170, fill: "rgb(140,180,120)" },
  ];
  let content = "";
  for (let i = layers.length - 1; i >= 0; i--) {
    const { r, fill } = layers[i];
    content += `<path d="M${cx - r},${cy} A${r},${r} 0 0,1 ${cx + r},${cy} Z" fill="${fill}" stroke="${STROKE}" stroke-width="1.5"/>`;
  }
  layers.forEach(({ label, r }, i) => {
    const labelX = 260, labelY = 40 + i * 50;
    const py = cy - r * 0.5;
    const px = cx + Math.sqrt(Math.max(0, r * r - (cy - py) * (cy - py)));
    content += `<line x1="${px.toFixed(1)}" y1="${py.toFixed(1)}" x2="${labelX}" y2="${labelY}" stroke="rgb(150,150,150)" stroke-width="1" stroke-dasharray="3"/>`;
    content += `<text x="${labelX + 4}" y="${labelY + 4}" font-family="Georgia,serif" font-size="11" fill="${STROKE}">${label}</text>`;
  });
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

export function rockCycle(): string {
  const W = 380, H = 320;
  const nodes = [
    { label: "Igneous", x: 190, y: 40 },
    { label: "Sedimentary", x: 60, y: 260 },
    { label: "Metamorphic", x: 320, y: 260 },
  ];
  const edges = [
    { from: 0, to: 1, label1: "Weathering &", label2: "Erosion", lx: 80, ly: 140 },
    { from: 1, to: 2, label1: "Heat &", label2: "Pressure", lx: 190, ly: 300 },
    { from: 2, to: 0, label1: "Melting &", label2: "Cooling", lx: 300, ly: 140 },
  ];
  let content = "";
  edges.forEach(({ from, to, label1, label2, lx, ly }) => {
    const f = nodes[from], t = nodes[to];
    content += `<path d="M${f.x},${f.y + 20} Q${lx},${ly} ${t.x},${t.y - 20}" fill="none" stroke="${STROKE}" stroke-width="1.5"/>`;
    const dx = t.x - lx, dy = (t.y - 20) - ly;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ax = dx / len, ay = dy / len;
    content += `<polygon points="${t.x},${t.y - 20} ${(t.x - 8 * ax - 5 * ay).toFixed(1)},${(t.y - 20 - 8 * ay + 5 * ax).toFixed(1)} ${(t.x - 8 * ax + 5 * ay).toFixed(1)},${(t.y - 20 - 8 * ay - 5 * ax).toFixed(1)}" fill="${STROKE}"/>`;
    content += `<text x="${lx}" y="${ly}" text-anchor="middle" font-family="Georgia,serif" font-size="9" font-style="italic" fill="rgb(120,120,120)">${label1}</text>`;
    content += `<text x="${lx}" y="${ly + 14}" text-anchor="middle" font-family="Georgia,serif" font-size="9" font-style="italic" fill="rgb(120,120,120)">${label2}</text>`;
  });
  nodes.forEach(({ label, x, y }) => {
    const bw = 100, bh = 36;
    content += `<rect x="${x - bw / 2}" y="${y - bh / 2}" width="${bw}" height="${bh}" rx="8" fill="rgb(240,235,220)" stroke="${STROKE}" stroke-width="2"/>`;
    content += `<text x="${x}" y="${y + 5}" text-anchor="middle" font-family="Georgia,serif" font-size="12" font-weight="600" fill="${STROKE}">${label}</text>`;
  });
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

export function atomModel(protons = 1, neutrons = 1, electrons = 1): string {
  const W = 280, H = 280, cx = 140, cy = 140;
  const shellRadii = [50, 80, 110];
  const shellMax = [2, 8, 18];
  let content = "";
  const eCount = Math.min(electrons, 28);
  let remaining = eCount;
  const shells: number[] = [];
  for (let s = 0; s < 3 && remaining > 0; s++) {
    const n = Math.min(remaining, shellMax[s]);
    shells.push(n);
    remaining -= n;
  }
  shells.forEach((n, s) => {
    const r = shellRadii[s];
    content += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgb(180,200,220)" stroke-width="1" stroke-dasharray="4"/>`;
    for (let e = 0; e < n; e++) {
      const angle = (e / n) * 2 * Math.PI - Math.PI / 2;
      const ex = cx + r * Math.cos(angle), ey = cy + r * Math.sin(angle);
      content += `<circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="5" fill="${DOT}" stroke="rgb(30,70,140)" stroke-width="1"/>`;
    }
  });
  const nucleusR = 22;
  content += `<circle cx="${cx}" cy="${cy}" r="${nucleusR}" fill="rgb(255,210,180)" stroke="${STROKE}" stroke-width="2"/>`;
  content += `<text x="${cx}" y="${cy - 4}" text-anchor="middle" font-family="Georgia,serif" font-size="10" font-weight="600" fill="${STROKE}">${protons}p+</text>`;
  content += `<text x="${cx}" y="${cy + 10}" text-anchor="middle" font-family="Georgia,serif" font-size="10" font-weight="600" fill="${STROKE}">${neutrons}n</text>`;
  content += `<text x="${cx}" y="${H - 8}" text-anchor="middle" font-family="Georgia,serif" font-size="10" fill="${STROKE}">${electrons} electrons</text>`;
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

export function circuitDiagram(): string {
  const W = 360, H = 220;
  const top = 40, bottom = 180, left = 60, right = 300;
  let content = "";
  // Wire path (rectangular loop with gaps for components)
  content += `<line x1="${left}" y1="${top}" x2="${left + 60}" y2="${top}" stroke="${STROKE}" stroke-width="2"/>`;
  content += `<line x1="${left + 100}" y1="${top}" x2="${right}" y2="${top}" stroke="${STROKE}" stroke-width="2"/>`;
  content += `<line x1="${right}" y1="${top}" x2="${right}" y2="${bottom}" stroke="${STROKE}" stroke-width="2"/>`;
  content += `<line x1="${right}" y1="${bottom}" x2="${right - 60}" y2="${bottom}" stroke="${STROKE}" stroke-width="2"/>`;
  content += `<line x1="${right - 100}" y1="${bottom}" x2="${left}" y2="${bottom}" stroke="${STROKE}" stroke-width="2"/>`;
  content += `<line x1="${left}" y1="${bottom}" x2="${left}" y2="${top}" stroke="${STROKE}" stroke-width="2"/>`;
  // Battery (top, between gap)
  const batX = left + 80;
  content += `<line x1="${batX - 8}" y1="${top - 14}" x2="${batX - 8}" y2="${top + 14}" stroke="${STROKE}" stroke-width="1.5"/>`;
  content += `<line x1="${batX + 8}" y1="${top - 8}" x2="${batX + 8}" y2="${top + 8}" stroke="${STROKE}" stroke-width="3"/>`;
  content += `<text x="${batX}" y="${top - 20}" text-anchor="middle" font-family="Georgia,serif" font-size="10" fill="${STROKE}">Battery</text>`;
  // Light bulb (bottom, between gap)
  const bulbX = right - 80;
  content += `<circle cx="${bulbX}" cy="${bottom}" r="12" fill="rgb(255,250,200)" stroke="${STROKE}" stroke-width="1.5"/>`;
  content += `<line x1="${bulbX - 6}" y1="${bottom - 6}" x2="${bulbX + 6}" y2="${bottom + 6}" stroke="${STROKE}" stroke-width="1"/>`;
  content += `<line x1="${bulbX + 6}" y1="${bottom - 6}" x2="${bulbX - 6}" y2="${bottom + 6}" stroke="${STROKE}" stroke-width="1"/>`;
  content += `<text x="${bulbX}" y="${bottom + 28}" text-anchor="middle" font-family="Georgia,serif" font-size="10" fill="${STROKE}">Bulb</text>`;
  // Switch indicator (right side middle)
  const swY = (top + bottom) / 2;
  content += `<circle cx="${right}" cy="${swY - 10}" r="3" fill="${STROKE}"/>`;
  content += `<line x1="${right}" y1="${swY - 10}" x2="${right + 14}" y2="${swY - 24}" stroke="${STROKE}" stroke-width="2"/>`;
  content += `<circle cx="${right}" cy="${swY + 10}" r="3" fill="${STROKE}"/>`;
  content += `<text x="${right + 20}" y="${swY + 4}" font-family="Georgia,serif" font-size="10" fill="${STROKE}">Switch</text>`;
  // Direction arrow
  content += `<text x="${W / 2}" y="${(top + bottom) / 2 + 4}" text-anchor="middle" font-family="Georgia,serif" font-size="10" font-style="italic" fill="rgb(150,150,150)">Current flow</text>`;
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

// ── Group C: Large static diagrams ───────────────────────────────────────────

export function waterCycle(): string {
  const W = 480, H = 320;
  let content = "";
  // Sky gradient background
  content += `<rect x="0" y="0" width="${W}" height="${H}" fill="rgb(220,235,255)"/>`;
  // Sun
  content += `<circle cx="420" cy="50" r="30" fill="rgb(255,220,80)" stroke="rgb(200,160,0)" stroke-width="1.5"/>`;
  for (let a = 0; a < 8; a++) {
    const ang = (a / 8) * 2 * Math.PI;
    content += `<line x1="${420 + 34 * Math.cos(ang)}" y1="${50 + 34 * Math.sin(ang)}" x2="${420 + 44 * Math.cos(ang)}" y2="${50 + 44 * Math.sin(ang)}" stroke="rgb(200,160,0)" stroke-width="2"/>`;
  }
  // Mountain
  content += `<polygon points="20,280 120,100 220,280" fill="rgb(160,140,120)" stroke="${STROKE}" stroke-width="1.5"/>`;
  content += `<polygon points="80,280 160,140 240,280" fill="rgb(140,120,100)" stroke="${STROKE}" stroke-width="1.5"/>`;
  // Snow caps
  content += `<polygon points="108,120 120,100 132,120" fill="rgb(240,240,250)"/>`;
  content += `<polygon points="148,155 160,140 172,155" fill="rgb(240,240,250)"/>`;
  // Ocean
  content += `<rect x="0" y="260" width="${W}" height="60" fill="rgb(120,170,220)" stroke="none"/>`;
  content += `<path d="M0,270 Q60,260 120,270 Q180,280 240,270 Q300,260 360,270 Q420,280 480,270" fill="none" stroke="rgb(100,150,200)" stroke-width="1.5"/>`;
  // Cloud
  content += `<ellipse cx="260" cy="80" rx="50" ry="24" fill="rgb(240,245,255)" stroke="${STROKE}" stroke-width="1.2"/>`;
  content += `<ellipse cx="240" cy="66" rx="30" ry="20" fill="rgb(240,245,255)" stroke="${STROKE}" stroke-width="1.2"/>`;
  content += `<ellipse cx="280" cy="64" rx="34" ry="22" fill="rgb(240,245,255)" stroke="${STROKE}" stroke-width="1.2"/>`;
  // Evaporation arrows (up from ocean)
  content += `<path d="M340,250 Q350,180 310,110" fill="none" stroke="rgb(80,140,220)" stroke-width="2" stroke-dasharray="6"/>`;
  content += `<polygon points="310,110 306,122 314,120" fill="rgb(80,140,220)"/>`;
  content += `<text x="360" y="200" font-family="Georgia,serif" font-size="10" font-weight="600" fill="rgb(80,140,220)">Evaporation</text>`;
  // Condensation label
  content += `<text x="260" y="46" text-anchor="middle" font-family="Georgia,serif" font-size="10" font-weight="600" fill="rgb(100,100,160)">Condensation</text>`;
  // Precipitation (rain lines from cloud)
  for (let d = 0; d < 4; d++) {
    const rx = 245 + d * 12;
    content += `<line x1="${rx}" y1="105" x2="${rx - 4}" y2="125" stroke="rgb(80,140,220)" stroke-width="2" stroke-linecap="round"/>`;
  }
  content += `<text x="270" y="145" text-anchor="middle" font-family="Georgia,serif" font-size="10" font-weight="600" fill="rgb(80,140,220)">Precipitation</text>`;
  // Runoff arrow
  content += `<path d="M180,240 Q220,255 280,260" fill="none" stroke="rgb(60,120,180)" stroke-width="2"/>`;
  content += `<polygon points="280,260 272,254 270,264" fill="rgb(60,120,180)"/>`;
  content += `<text x="200" y="236" font-family="Georgia,serif" font-size="10" font-weight="600" fill="rgb(60,120,180)">Runoff</text>`;
  // Labels
  content += `<text x="360" y="290" text-anchor="middle" font-family="Georgia,serif" font-size="12" font-weight="600" fill="rgb(255,255,255)">Ocean</text>`;
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

export function cellDiagram(cellType: "animal" | "plant" = "animal"): string {
  const W = 440, H = 320;
  const cx = 200, cy = 160;
  const isPlant = cellType === "plant";
  let content = "";
  if (isPlant) {
    // Cell wall (outer rectangle)
    content += `<rect x="30" y="20" width="340" height="260" rx="12" fill="rgb(180,220,160)" stroke="${STROKE}" stroke-width="2"/>`;
    content += `<rect x="40" y="30" width="320" height="240" rx="8" fill="rgb(220,240,210)" stroke="${STROKE}" stroke-width="1.5"/>`;
    // Large vacuole
    content += `<ellipse cx="${cx}" cy="${cy}" rx="80" ry="55" fill="rgb(200,230,255)" stroke="rgb(100,160,200)" stroke-width="1.5"/>`;
    // Chloroplasts
    content += `<ellipse cx="100" cy="100" rx="16" ry="8" fill="rgb(100,180,80)" stroke="${STROKE}" stroke-width="1"/>`;
    content += `<ellipse cx="300" cy="200" rx="16" ry="8" fill="rgb(100,180,80)" stroke="${STROKE}" stroke-width="1"/>`;
  } else {
    // Cell membrane (oval)
    content += `<ellipse cx="${cx}" cy="${cy}" rx="160" ry="120" fill="rgb(255,240,220)" stroke="${STROKE}" stroke-width="2"/>`;
  }
  // Nucleus
  content += `<circle cx="${cx + 40}" cy="${cy - 20}" r="32" fill="rgb(200,180,220)" stroke="${STROKE}" stroke-width="1.5"/>`;
  content += `<circle cx="${cx + 40}" cy="${cy - 20}" r="10" fill="rgb(160,140,190)" stroke="${STROKE}" stroke-width="1"/>`;
  // Mitochondria
  content += `<ellipse cx="${cx - 60}" cy="${cy + 30}" rx="20" ry="10" fill="rgb(255,200,180)" stroke="${STROKE}" stroke-width="1"/>`;
  content += `<path d="M${cx - 74},${cy + 30} Q${cx - 60},${cy + 22} ${cx - 46},${cy + 30}" fill="none" stroke="${STROKE}" stroke-width="0.8"/>`;
  // Cytoplasm dots
  for (let d = 0; d < 8; d++) {
    const dx = cx - 40 + Math.cos(d * 0.8) * 80, dy = cy + Math.sin(d * 1.2) * 60;
    content += `<circle cx="${dx.toFixed(0)}" cy="${dy.toFixed(0)}" r="1.5" fill="rgb(180,180,180)"/>`;
  }
  // Label lines with blanks
  const labels = isPlant
    ? [{ px: cx + 40, py: cy - 20, lx: 400, ly: 40, name: "Nucleus" },
       { px: cx - 60, py: cy + 30, lx: 400, ly: 80, name: "Mitochondria" },
       { px: cx, py: cy, lx: 400, ly: 120, name: "Vacuole" },
       { px: 40, py: 150, lx: 400, ly: 160, name: "Cell Wall" },
       { px: 100, py: 100, lx: 400, ly: 200, name: "Chloroplast" },
       { px: 50, py: 40, lx: 400, ly: 240, name: "Cell Membrane" }]
    : [{ px: cx + 40, py: cy - 20, lx: 400, ly: 40, name: "Nucleus" },
       { px: cx - 60, py: cy + 30, lx: 400, ly: 80, name: "Mitochondria" },
       { px: cx - 20, py: cy + 50, lx: 400, ly: 120, name: "Cytoplasm" },
       { px: cx - 160, py: cy, lx: 400, ly: 160, name: "Cell Membrane" }];
  labels.forEach(({ px, py, lx, ly }) => {
    content += `<line x1="${px}" y1="${py}" x2="${lx}" y2="${ly}" stroke="rgb(150,150,150)" stroke-width="0.8" stroke-dasharray="3"/>`;
    content += `<line x1="${lx}" y1="${ly}" x2="${lx + 30}" y2="${ly}" stroke="${STROKE}" stroke-width="1"/>`;
    content += `<text x="${lx + 2}" y="${ly - 3}" font-family="Georgia,serif" font-size="9" fill="rgb(150,150,150)">___________</text>`;
  });
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

export function bodyDiagram(): string {
  const W = 360, H = 420, cx = 150;
  let content = "";
  // Head
  content += `<circle cx="${cx}" cy="50" r="30" fill="rgb(255,230,210)" stroke="${STROKE}" stroke-width="2"/>`;
  // Neck
  content += `<rect x="${cx - 8}" y="78" width="16" height="20" fill="rgb(255,230,210)" stroke="${STROKE}" stroke-width="1.5"/>`;
  // Torso
  content += `<rect x="${cx - 50}" y="96" width="100" height="140" rx="16" fill="rgb(255,230,210)" stroke="${STROKE}" stroke-width="2"/>`;
  // Arms
  content += `<rect x="${cx - 80}" y="100" width="30" height="100" rx="12" fill="rgb(255,230,210)" stroke="${STROKE}" stroke-width="1.5"/>`;
  content += `<rect x="${cx + 50}" y="100" width="30" height="100" rx="12" fill="rgb(255,230,210)" stroke="${STROKE}" stroke-width="1.5"/>`;
  // Legs
  content += `<rect x="${cx - 40}" y="234" width="34" height="120" rx="12" fill="rgb(255,230,210)" stroke="${STROKE}" stroke-width="1.5"/>`;
  content += `<rect x="${cx + 6}" y="234" width="34" height="120" rx="12" fill="rgb(255,230,210)" stroke="${STROKE}" stroke-width="1.5"/>`;
  // Organs (simplified internal)
  content += `<ellipse cx="${cx}" cy="50" rx="16" ry="12" fill="rgb(255,200,200)" stroke="${STROKE}" stroke-width="1"/>`;
  // Heart
  content += `<circle cx="${cx - 10}" cy="130" r="10" fill="rgb(220,80,80)" stroke="${STROKE}" stroke-width="1"/>`;
  // Lungs
  content += `<ellipse cx="${cx - 28}" cy="140" rx="14" ry="22" fill="rgb(200,180,220)" stroke="${STROKE}" stroke-width="1"/>`;
  content += `<ellipse cx="${cx + 28}" cy="140" rx="14" ry="22" fill="rgb(200,180,220)" stroke="${STROKE}" stroke-width="1"/>`;
  // Stomach
  content += `<ellipse cx="${cx}" cy="190" rx="20" ry="16" fill="rgb(255,220,180)" stroke="${STROKE}" stroke-width="1"/>`;
  // Label lines with blanks
  const parts = [
    { px: cx, py: 50, lx: 260, ly: 30, name: "Brain" },
    { px: cx - 10, py: 130, lx: 260, ly: 100, name: "Heart" },
    { px: cx - 28, py: 140, lx: 260, ly: 160, name: "Lungs" },
    { px: cx, py: 190, lx: 260, ly: 220, name: "Stomach" },
    { px: cx + 30, py: 280, lx: 260, ly: 310, name: "Skeleton" },
  ];
  parts.forEach(({ px, py, lx, ly }) => {
    content += `<line x1="${px}" y1="${py}" x2="${lx}" y2="${ly}" stroke="rgb(150,150,150)" stroke-width="0.8" stroke-dasharray="3"/>`;
    content += `<line x1="${lx}" y1="${ly}" x2="${lx + 30}" y2="${ly}" stroke="${STROKE}" stroke-width="1"/>`;
    content += `<text x="${lx + 2}" y="${ly - 3}" font-family="Georgia,serif" font-size="9" fill="rgb(150,150,150)">___________</text>`;
  });
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

// Dispatcher: given a visual type and params, return the SVG string
export function renderVisual(type: string, params: Record<string, unknown>): string | null {
  switch (type) {
    case "ten_frame":       return tenFrame(params.filled as number ?? 0);
    case "fraction_bar":    return fractionBar(params.numerator as number, params.denominator as number, params.shaded as number | undefined);
    case "fraction_circle": return fractionCircle(params.numerator as number, params.denominator as number);
    case "fraction_grid":   return fractionGrid(params.fractions as Array<{n:number;d:number}> ?? []);
    case "number_line":     return numberLine(params.start as number, params.end as number, params.marked as number[] | undefined, params.labels as string[] | undefined);
    case "multiplication_array": return multiplicationArray(params.rows as number, params.cols as number);
    case "coordinate_grid": return coordinateGrid(params.quadrant as 1 | 4, params.points as Array<{x:number;y:number;label?:string}> | undefined, params.size as number | undefined);
    case "analog_clock":    return analogClock(params.hour as number, params.minute as number);
    // Graphic organizers
    case "venn_diagram":    return vennDiagram(params.label1 as string, params.label2 as string, params.overlap_label as string);
    case "kwl_chart":       return kwlChart(params.topic as string);
    case "t_chart":         return tChart(params.left_label as string, params.right_label as string, params.rows as number);
    case "data_table":      return dataTable(params.headers as string[] ?? ["Observation", "Result"], params.rows as number);
    case "timeline":        return timeline(params.events as string[] ?? [], params.orientation as "horizontal" | "vertical");
    // Science diagrams
    case "plant_diagram":   return plantDiagram();
    case "food_chain":      return foodChain(params.organisms as string[] ?? []);
    case "story_map":       return storyMap();
    // Phase 2 visuals
    case "bar_graph":           return barGraph(params.labels as string[] ?? [], params.values as number[] ?? [], params.title as string, params.max_value as number);
    case "place_value_chart":   return placeValueChart(params.columns as string[], params.values as (number|null)[]);
    case "ruler":               return ruler(params.length as number, params.unit as "in"|"cm");
    case "word_web":            return wordWeb(params.center_word as string ?? "", params.related_words as string[]);
    case "number_bonds":        return numberBonds(params.whole as number|null, params.part1 as number|null, params.part2 as number|null);
    case "cause_effect":        return causeEffect(params.cause as string, params.effect as string);
    case "area_grid":           return areaGrid(params.rows as number ?? 4, params.cols as number ?? 4, params.shaded as number);
    case "thermometer":         return thermometer(params.current as number ?? 70, params.min as number ?? 0, params.max as number ?? 100, params.unit as string);
    case "sequence_arrows":     return sequenceArrows(params.steps as number ?? 4, params.labels as string[]);
    case "number_grid":         return numberGrid(params.highlight as number[]);
    case "compass_rose":        return compassRose();
    case "weather_symbols":     return weatherSymbols(params.symbols as string[]);
    case "paragraph_organizer": return paragraphOrganizer();
    case "sequence_strip":      return sequenceStrip(params.count as number ?? 4, params.labels as string[]);
    case "base_ten_blocks":     return base10Blocks(params.hundreds as number ?? 0, params.tens as number ?? 0, params.ones as number ?? 0);
    case "labeled_shape":       return labeledShape(params.shape as string ?? "rectangle", params.dimensions as string[]);
    case "protractor":          return protractor();
    case "equation_balance":    return equationBalance(params.left_side as string ?? "x", params.right_side as string ?? "?");
    case "lifecycle_diagram":   return lifecycleDiagram(params.stages as string[] ?? []);
    case "earth_layers":        return earthLayers();
    case "rock_cycle":          return rockCycle();
    case "atom_model":          return atomModel(params.protons as number ?? 1, params.neutrons as number ?? 1, params.electrons as number ?? 1);
    case "circuit_diagram":     return circuitDiagram();
    case "water_cycle":         return waterCycle();
    case "cell_diagram":        return cellDiagram(params.cell_type as "animal"|"plant");
    case "body_diagram":        return bodyDiagram();
    default:                return null;
  }
}
