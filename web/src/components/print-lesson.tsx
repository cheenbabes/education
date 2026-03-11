"use client";


interface LessonPlan {
  title: string;
  theme: string;
  estimated_duration_minutes: number;
  philosophy: string;
  philosophy_summary?: string;
  children: { name: string; grade: string; age: number; differentiation_notes: string }[];
  standards_addressed: { code: string; description_plain: string; how_addressed: string }[];
  materials_needed: { name: string; household_alternative: string; optional: boolean }[];
  lesson_sections: { title: string; duration_minutes: number; indoor_outdoor: string; instructions: string; philosophy_connection: string; tips: string[]; extensions: string[] }[];
  assessment_suggestions: string[];
  next_lesson_seeds: string[];
}

export function PrintLesson({ lesson }: { lesson: LessonPlan }) {
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const philosophyLabel = lesson.philosophy.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${lesson.title}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Georgia, serif; color: #111; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.5; }
          h1 { font-size: 24px; margin-bottom: 4px; }
          h2 { font-size: 16px; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
          h3 { font-size: 14px; margin-top: 16px; margin-bottom: 4px; }
          .meta { font-size: 13px; color: #666; margin-bottom: 16px; }
          .tag { display: inline-block; background: #f3f4f6; border-radius: 4px; padding: 2px 8px; font-size: 12px; margin-right: 4px; margin-bottom: 4px; }
          .philosophy-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 12px; margin: 16px 0; font-size: 13px; }
          .section { margin: 16px 0; padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px; }
          .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
          .section-title { font-weight: bold; font-size: 15px; }
          .badge { font-size: 11px; background: #f3f4f6; border-radius: 4px; padding: 2px 6px; }
          .instructions { font-size: 14px; white-space: pre-line; }
          .tips { font-size: 12px; color: #666; margin-top: 8px; }
          .philosophy-note { font-size: 12px; color: #92400e; font-style: italic; margin-top: 8px; }
          ul { padding-left: 20px; margin: 4px 0; }
          li { font-size: 14px; margin: 2px 0; }
          .standard { margin: 6px 0; font-size: 13px; }
          .standard-code { font-family: monospace; background: #ecfdf5; color: #065f46; padding: 1px 6px; border-radius: 3px; font-size: 12px; }
          .standard-how { font-size: 12px; color: #888; margin-left: 4px; }
          .material { font-size: 13px; margin: 3px 0; }
          .alt { color: #888; }
          .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 11px; color: #999; text-align: center; }
          @media print { body { padding: 20px; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <h1>${lesson.title}</h1>
        <div class="meta">
          ${lesson.estimated_duration_minutes} minutes &bull; ${philosophyLabel}
          ${lesson.children.map((c) => `&bull; ${c.name} (Grade ${c.grade})`).join(" ")}
        </div>

        ${lesson.philosophy_summary && lesson.philosophy !== "flexible" ? `
          <div class="philosophy-box">
            <strong>Why this is ${philosophyLabel}:</strong> ${lesson.philosophy_summary}
          </div>
        ` : ""}

        ${lesson.children.some((c) => c.differentiation_notes) ? `
          <h2>Differentiation</h2>
          ${lesson.children.filter((c) => c.differentiation_notes).map((c) => `
            <p style="font-size:14px;margin:4px 0;"><strong>${c.name}:</strong> ${c.differentiation_notes}</p>
          `).join("")}
        ` : ""}

        ${lesson.standards_addressed.length > 0 ? `
          <h2>Standards Addressed</h2>
          ${lesson.standards_addressed.map((s) => `
            <div class="standard">
              <span class="standard-code">${s.code}</span> ${s.description_plain}
              <div class="standard-how">${s.how_addressed}</div>
            </div>
          `).join("")}
        ` : ""}

        <h2>Materials Needed</h2>
        ${lesson.materials_needed.map((m) => `
          <div class="material">
            <strong>${m.name}</strong>${m.optional ? " (optional)" : ""}
            ${m.household_alternative ? `<span class="alt"> — or: ${m.household_alternative}</span>` : ""}
          </div>
        `).join("")}

        <h2>Lesson Plan</h2>
        ${lesson.lesson_sections.map((s) => `
          <div class="section">
            <div class="section-header">
              <span class="section-title">${s.title}</span>
              <span><span class="badge">${s.duration_minutes} min</span> <span class="badge">${s.indoor_outdoor}</span></span>
            </div>
            <div class="instructions">${s.instructions}</div>
            ${s.tips.length > 0 ? `<div class="tips"><strong>Tips:</strong> ${s.tips.join(" • ")}</div>` : ""}
            ${s.extensions.length > 0 ? `<div class="tips"><strong>Extensions:</strong> ${s.extensions.join(" • ")}</div>` : ""}
            ${s.philosophy_connection ? `<div class="philosophy-note">${s.philosophy_connection}</div>` : ""}
          </div>
        `).join("")}

        ${lesson.assessment_suggestions.length > 0 ? `
          <h2>Assessment</h2>
          <ul>${lesson.assessment_suggestions.map((a) => `<li>${a}</li>`).join("")}</ul>
        ` : ""}

        ${lesson.next_lesson_seeds.length > 0 ? `
          <h2>Ideas for Next Lesson</h2>
          <ul>${lesson.next_lesson_seeds.map((n) => `<li>${n}</li>`).join("")}</ul>
        ` : ""}

        <div class="footer">Generated by EduApp</div>

        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handlePrint}
        className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-900"
      >
        Print / PDF
      </button>
      <button
        onClick={() => {
          const blob = new Blob(
            [JSON.stringify(lesson, null, 2)],
            { type: "application/json" }
          );
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${lesson.title.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "-").toLowerCase()}.json`;
          a.click();
          URL.revokeObjectURL(url);
        }}
        className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-900"
      >
        Download JSON
      </button>
    </div>
  );
}
