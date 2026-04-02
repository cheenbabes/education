interface PrintableSection {
  title: string;
  instructions: string;
  lines?: number;
  drawing_space?: boolean;
  visual?: { type: string; params: Record<string, unknown> };
}

interface PrintableWorksheet {
  content: { title: string; sections: PrintableSection[] };
  childName?: string | null;
  grade: string;
  philosophy: string;
}

export function printWorksheet(ws: PrintableWorksheet) {
  const win = window.open("", "_blank");
  if (!win) return;
  const sectionsHtml = ws.content.sections.map((s) => `
    <div style="margin-bottom:32px; page-break-inside:avoid;">
      <h3 style="font-size:14px; font-weight:600; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.05em;">${s.title}</h3>
      <p style="font-size:13px; color:#333; margin-bottom:12px;">${s.instructions}</p>
      ${s.drawing_space ? '<div style="border:1px solid #ccc; height:180px; border-radius:4px; margin-bottom:8px;"></div>' : ""}
      ${s.lines ? Array.from({ length: s.lines }, () => '<div style="border-bottom:1px solid #ddd; margin-bottom:20px; height:24px;"></div>').join("") : ""}
    </div>
  `).join("");
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
    <h1 style="font-size:20px;border-bottom:2px solid #333;padding-bottom:8px;margin-bottom:4px;">${ws.content.title}</h1>
    <p style="font-size:12px;color:#666;margin-bottom:32px;">${ws.childName ? ws.childName + " · " : ""}Grade ${ws.grade} · ${ws.philosophy}</p>
    ${sectionsHtml}
  </body></html>`);
  win.document.close();
  win.print();
}
