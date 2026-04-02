/**
 * Renders worksheet eval JSON into printable HTML files.
 * Usage: npx tsx scripts/render-eval-worksheets.ts <path-to-eval.json> [output-dir]
 *
 * Example:
 *   npx tsx scripts/render-eval-worksheets.ts ../kg-service/reports/worksheet-eval-quick-20260402_160544.json /tmp/worksheets
 */

import fs from "fs";
import path from "path";
import { renderVisual } from "../src/lib/worksheetSvg";

const inputFile = process.argv[2];
const outputDir = process.argv[3] ?? "/tmp/edu-worksheets";

if (!inputFile) {
  console.error("Usage: npx tsx scripts/render-eval-worksheets.ts <eval.json> [output-dir]");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(inputFile, "utf8")) as Array<{
  philosophy: string;
  grade_band: string;
  subject: string;
  lesson_title: string;
  worksheet: {
    title?: string;
    child_name?: string;
    grade?: string;
    philosophy?: string;
    sections: Array<{
      type: string;
      title: string;
      instructions: string;
      lines?: number;
      drawing_space?: boolean;
      visual?: { type: string; params: Record<string, unknown> };
    }>;
  };
  scores?: {
    overall_score?: number;
    scores?: Record<string, number>;
    critical_issues?: string[];
  };
  error?: string;
}>;

fs.mkdirSync(outputDir, { recursive: true });

// Also generate an index page
const indexItems: string[] = [];

let count = 0;

for (const entry of data) {
  if (entry.error) continue;

  const { philosophy, grade_band, subject, lesson_title, worksheet, scores } = entry;
  const slug = `${philosophy}-${grade_band}-${subject}`.replace(/[^a-z0-9-]/g, "-");
  const filename = `${String(++count).padStart(2, "0")}-${slug}.html`;
  const filepath = path.join(outputDir, filename);

  const sections = worksheet.sections ?? [];

  const sectionsHtml = sections.map((s) => {
    const svgHtml = (() => {
      if (s.visual) {
        const svg = renderVisual(s.visual.type, s.visual.params);
        return svg
          ? `<div style="margin:14px 0; page-break-inside:avoid;">${svg}</div>`
          : "";
      }
      return "";
    })();

    const drawingBox = s.drawing_space
      ? `<div style="border:1px solid #ccc;height:180px;border-radius:4px;margin-bottom:8px;background:#fafafa;"></div>`
      : "";

    const lines = s.lines
      ? Array.from({ length: s.lines }, () =>
          `<div style="border-bottom:1px solid #ddd;margin-bottom:20px;height:24px;"></div>`
        ).join("")
      : "";

    return `
      <div style="margin-bottom:32px;page-break-inside:avoid;">
        <h3 style="font-size:13px;font-weight:700;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.06em;color:#333;">
          ${s.title}
          <span style="font-size:10px;font-weight:400;color:#999;text-transform:none;letter-spacing:0;margin-left:8px;">[${s.type}]</span>
        </h3>
        <p style="font-size:13px;color:#444;margin-bottom:10px;line-height:1.6;">${s.instructions}</p>
        ${svgHtml}
        ${drawingBox}
        ${lines}
      </div>`;
  }).join("");

  const overallScore = scores?.overall_score ?? "—";
  const criticalIssues = scores?.critical_issues ?? [];
  const dimScores = scores?.scores ?? {};

  const scoreBar = `
    <div style="font-family:'Inter',sans-serif;font-size:11px;color:#888;display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px;padding:10px 14px;background:#f5f5f5;border-radius:6px;">
      <strong style="color:#333;">Overall: ${overallScore}</strong>
      ${Object.entries(dimScores).map(([k, v]) =>
        `<span>${k.replace(/_/g," ")}: <strong style="color:${(v as number) >= 4 ? "#2d7a57" : (v as number) >= 3 ? "#C4983D" : "#B04040"}">${v}</strong></span>`
      ).join("")}
      ${criticalIssues.length > 0 ? `<span style="color:#B04040;">⚠ ${criticalIssues.join(", ")}</span>` : ""}
    </div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${lesson_title} — ${philosophy} · ${grade_band} · ${subject}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"
    onload="renderMathInElement(document.body,{delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false},{left:'\\\\(',right:'\\\\)',display:false},{left:'\\\\[',right:'\\\\]',display:true}]});"></script>
  <style>
    body { font-family:'Georgia',serif; max-width:720px; margin:40px auto; padding:0 24px; color:#222; }
    @media print { body { margin:20px; } .no-print { display:none; } }
    .meta { font-size:11px; color:#999; font-family:'Inter',sans-serif; margin-bottom:6px; }
    .pill { display:inline-block; font-size:10px; padding:2px 8px; border-radius:4px; background:#eee; margin-right:4px; font-family:'Inter',sans-serif; }
  </style>
</head>
<body>
  <div class="no-print">
    ${scoreBar}
    <button onclick="window.print()" style="font-family:'Georgia',serif;background:#0B2E4A;color:#F9F6EF;border:none;border-radius:8px;padding:8px 20px;font-size:14px;cursor:pointer;margin-bottom:24px;">Print Worksheet</button>
  </div>

  <div class="meta">
    <span class="pill">${philosophy.replace(/-/g," ")}</span>
    <span class="pill">Grade ${grade_band}</span>
    <span class="pill">${subject}</span>
  </div>

  <h1 style="font-size:22px;border-bottom:2px solid #333;padding-bottom:8px;margin-bottom:4px;">${lesson_title}</h1>
  <p style="font-size:12px;color:#888;margin-bottom:32px;font-family:'Inter',sans-serif;">
    ${worksheet.child_name ? worksheet.child_name + " · " : ""}${grade_band} · ${philosophy.replace(/-/g," ")}
  </p>

  ${sectionsHtml}
</body>
</html>`;

  fs.writeFileSync(filepath, html);

  const hasVisuals = sections.some((s) => s.visual);
  indexItems.push(`
    <li>
      <a href="${filename}">${lesson_title}</a>
      <span style="font-size:11px;color:#888;margin-left:8px;">${philosophy} · ${grade_band} · ${subject}${hasVisuals ? ' · <span style="color:#2d7a57">has visuals</span>' : ''}</span>
      ${overallScore !== "—" ? `<span style="float:right;font-size:11px;font-weight:600;color:${Number(overallScore) >= 4.5 ? '#2d7a57' : '#C4983D'}">⭐ ${overallScore}</span>` : ""}
    </li>`);
}

// Write index
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Worksheet Eval Results</title>
  <style>
    body { font-family:'Georgia',serif; max-width:800px; margin:40px auto; padding:0 24px; }
    h1 { font-size:1.5rem; margin-bottom:4px; }
    .subtitle { font-size:13px; color:#888; font-family:'Inter',sans-serif; margin-bottom:24px; }
    ul { list-style:none; padding:0; }
    li { padding:10px 12px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; }
    li:hover { background:#f9f9f9; }
    a { color:#0B2E4A; text-decoration:none; font-size:14px; }
    a:hover { text-decoration:underline; }
  </style>
</head>
<body>
  <h1>Worksheet Eval Results</h1>
  <p class="subtitle">${data.filter(d => !d.error).length} worksheets · ${path.basename(inputFile)}</p>
  <ul>${indexItems.join("")}</ul>
</body>
</html>`;

fs.writeFileSync(path.join(outputDir, "index.html"), indexHtml);

console.log(`\nRendered ${count} worksheets to ${outputDir}/`);
console.log(`Open: open ${path.join(outputDir, "index.html")}`);
