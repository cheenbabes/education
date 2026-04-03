import fs from "fs";
import path from "path";
import { renderVisual } from "../src/lib/worksheetSvg";

const outputDir = "/tmp/standard-pilot";
fs.mkdirSync(outputDir, { recursive: true });

async function main() {
  const res = await fetch("http://localhost:3001/api/worksheets/standard");
  const worksheets = await res.json() as Array<{
    id: string; clusterKey: string; clusterTitle: string;
    grade: string; subject: string; worksheetNum: number;
    worksheetType: string; title: string;
    content: { context: string; problems: Array<{ id:number; type:string; prompt:string; answer:string; options?:string[]; answerLines?:number; visual?:{type:string;params:Record<string,unknown>} }>; answerKey: Array<{problemId:number;answer:string}> };
  }>();

  const indexItems: string[] = [];
  let count = 0;

  const byCluster: Record<string, typeof worksheets> = {};
  for (const ws of worksheets) {
    byCluster[ws.clusterKey] = [...(byCluster[ws.clusterKey] ?? []), ws];
  }

  for (const wsList of Object.values(byCluster)) {
    for (const ws of wsList.sort((a,b) => a.worksheetNum - b.worksheetNum)) {
      const { context, problems, answerKey } = ws.content;
      const typeLabel = ["Identify", "Practice", "Challenge"][ws.worksheetNum - 1] ?? ws.worksheetType;
      const filename = `${String(++count).padStart(2,"0")}-${ws.clusterKey.slice(0,40)}-${ws.worksheetNum}.html`;

      const problemsHtml = problems.map((p, i) => {
        const svgHtml = p.visual ? (() => {
          const svg = renderVisual(p.visual!.type, p.visual!.params);
          return svg ? `<div style="margin:12px 0;">${svg}</div>` : "";
        })() : "";
        const mcHtml = p.type === "multiple_choice" && p.options
          ? `<div style="margin-top:8px;">${p.options.map((o,j) => `<div style="margin:4px 0;display:flex;gap:8px;align-items:center;"><div style="width:16px;height:16px;border:1px solid #999;border-radius:50%;flex-shrink:0"></div><span style="font-size:13px;">${String.fromCharCode(65+j)}) ${o}</span></div>`).join("")}</div>` : "";
        const linesCount = p.answerLines ?? (["short_answer","word_problem","explain_your_thinking","create_example"].includes(p.type) ? 3 : 1);
        const lines = !mcHtml && !svgHtml ? Array.from({length: linesCount}, ()=>`<div style="border-bottom:1px solid #ddd;margin-bottom:18px;height:22px;"></div>`).join("") : "";
        return `<div style="margin-bottom:20px;padding:12px;background:#fff;border-radius:6px;border:1px solid #e8e8e8;page-break-inside:avoid;">
          <p style="font-size:12px;font-weight:700;color:#0B2E4A;margin-bottom:4px;">${i+1}. <span style="font-weight:400;font-size:10px;color:#aaa;">[${p.type}]</span></p>
          <p style="font-size:13px;color:#333;line-height:1.6;margin-bottom:6px;">${p.prompt}</p>
          ${svgHtml}${mcHtml}${lines}
        </div>`;
      }).join("");

      const akHtml = answerKey.map(ak => `<div style="display:flex;gap:8px;margin-bottom:5px;font-size:11px;"><span style="color:#6E6E9E;width:22px;flex-shrink:0;">${ak.problemId}.</span><span>${ak.answer}</span></div>`).join("");

      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${ws.title}</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
        <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
        <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"
          onload="renderMathInElement(document.body,{delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false},{left:'\\\\(',right:'\\\\)',display:false}]});"></script>
        <style>body{font-family:'Georgia',serif;max-width:720px;margin:32px auto;padding:0 24px;background:#FDFBF7;color:#222;}@media print{.no-print{display:none;}}</style>
      </head><body>
        <div class="no-print" style="margin-bottom:20px;"><button onclick="window.print()" style="background:#0B2E4A;color:#F9F6EF;border:none;border-radius:8px;padding:8px 18px;font-family:Georgia;font-size:13px;cursor:pointer;">Print</button></div>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0B2E4A;padding-bottom:10px;margin-bottom:16px;">
          <div>
            <p style="font-size:10px;font-variant:small-caps;color:#6E6E9E;letter-spacing:0.08em;margin-bottom:3px;">The Sage's Compass · ${ws.subject} · Grade ${ws.grade}</p>
            <h1 style="font-size:18px;font-variant:small-caps;color:#0B2E4A;margin:0;">${ws.title}</h1>
            <p style="font-size:10px;color:#aaa;margin-top:2px;">${ws.clusterTitle} — ${typeLabel}</p>
          </div>
          <div style="font-size:11px;color:#555;text-align:right;">
            <div style="border-bottom:1px solid #aaa;padding-bottom:2px;margin-bottom:6px;min-width:160px;">Name: _____________________</div>
            <div style="border-bottom:1px solid #aaa;padding-bottom:2px;">Date: ______________________</div>
          </div>
        </div>
        <div style="background:#F0EAE0;border-radius:6px;padding:10px 14px;margin-bottom:18px;font-size:11px;color:#444;line-height:1.65;">${context}</div>
        ${problemsHtml}
        <div style="border-top:1px solid #ddd;margin-top:28px;padding-top:14px;">
          <h2 style="font-size:13px;font-variant:small-caps;color:#0B2E4A;margin-bottom:8px;">Answer Key</h2>
          ${akHtml}
        </div>
        <p style="font-size:9px;color:#ccc;text-align:center;margin-top:20px;">© The Sage's Compass · thesagescompass.com</p>
      </body></html>`;

      fs.writeFileSync(path.join(outputDir, filename), html);
      const hasVisuals = problems.some(p => p.visual);
      indexItems.push(`<li style="padding:10px 12px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;">
        <a href="${filename}" style="color:#0B2E4A;font-size:13px;text-decoration:none;">${ws.title}</a>
        <span style="font-size:11px;color:#888;">${ws.subject} · Gr ${ws.grade} · ${typeLabel}${hasVisuals ? ' · <span style="color:#2d7a57">visuals</span>' : ''}</span>
      </li>`);
    }
  }

  const index = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Standard Worksheet Pilot</title>
    <style>body{font-family:Georgia,serif;max-width:820px;margin:40px auto;padding:0 24px;}ul{list-style:none;padding:0;}li{display:flex;justify-content:space-between;}</style>
  </head><body>
    <h1 style="font-size:1.4rem;color:#0B2E4A;margin-bottom:4px;">Standards Worksheet Pilot</h1>
    <p style="font-size:12px;color:#888;margin-bottom:24px;">${count} worksheets · 5 clusters × 3 types</p>
    <ul>${indexItems.join("")}</ul>
  </body></html>`;
  fs.writeFileSync(path.join(outputDir, "index.html"), index);
  console.log(`\nRendered ${count} worksheets → ${outputDir}/index.html`);
}

main().catch(console.error);
