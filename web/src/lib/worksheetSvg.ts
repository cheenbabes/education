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
