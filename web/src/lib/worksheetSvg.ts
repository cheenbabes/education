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
    default:                return null;
  }
}
