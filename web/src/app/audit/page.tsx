"use client";

import { Shell } from "@/components/shell";
import { useState, useEffect } from "react";
import { PHILOSOPHY_LABELS, PHILOSOPHY_COLORS } from "@/lib/compass/scoring";
import type { PhilosophyKey } from "@/lib/compass/questions";
import type {
  AuditResponse,
  DimensionProfile,
  ArchetypeAudit,
  QuizQuestionAudit,
  ProposedChange,
} from "@/lib/compass/audit-types";

const frost: React.CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.5)",
  borderRadius: "12px",
  padding: "1.25rem",
  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
};

const DIM_LABELS: Record<string, { name: string; low: string; high: string }> = {
  structure:       { name: "Structure",        low: "Prescriptive",     high: "Adaptive" },
  modality:        { name: "Modality",         low: "Hands-on",         high: "Books-first" },
  subjectApproach: { name: "Subject Approach", low: "Integrated",       high: "Subject-focused" },
  direction:       { name: "Direction",        low: "Teacher-directed", high: "Child-directed" },
  social:          { name: "Social",           low: "Community",        high: "Individual" },
};

function Badge({ verdict }: { verdict: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    aligned:       { bg: "rgba(16,185,129,0.15)", text: "#059669" },
    "minor-gap":   { bg: "rgba(245,158,11,0.15)", text: "#D97706" },
    "major-gap":   { bg: "rgba(239,68,68,0.15)",  text: "#DC2626" },
    weak:          { bg: "rgba(245,158,11,0.15)", text: "#D97706" },
    misaligned:    { bg: "rgba(239,68,68,0.15)",  text: "#DC2626" },
    "no-hardcoded":{ bg: "rgba(107,114,128,0.15)", text: "#6B7280" },
    "no-value":    { bg: "rgba(107,114,128,0.15)", text: "#6B7280" },
  };
  const c = colors[verdict] || colors.aligned;
  return (
    <span style={{
      fontSize: "0.6rem", fontWeight: 600, padding: "2px 6px",
      borderRadius: "4px", background: c.bg, color: c.text,
      textTransform: "uppercase", letterSpacing: "0.05em",
    }}>
      {verdict}
    </span>
  );
}

function PhilLabel({ phil }: { phil: string }) {
  const label = PHILOSOPHY_LABELS[phil as PhilosophyKey] || phil;
  const color = PHILOSOPHY_COLORS[phil as PhilosophyKey] || "#6B7280";
  return (
    <span style={{
      fontSize: "0.7rem", fontWeight: 500, padding: "2px 8px",
      borderRadius: "4px", background: `${color}20`, color,
    }}>
      {label}
    </span>
  );
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={frost}>
      <button
        onClick={() => setOpen(!open)}
        style={{ all: "unset", cursor: "pointer", width: "100%", display: "flex", alignItems: "center", gap: "0.5rem" }}
      >
        <span style={{ fontSize: "0.8rem", transition: "transform 0.2s", transform: open ? "rotate(90deg)" : "rotate(0)" }}>&#9654;</span>
        <h2 className="font-cormorant-sc" style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0B2E4A" }}>{title}</h2>
      </button>
      {open && <div style={{ marginTop: "1rem" }}>{children}</div>}
    </div>
  );
}

// ── Overlap Matrix ───────────────────────────────────────────────────────────

function OverlapMatrixSection({ data }: { data: AuditResponse["overlapMatrix"] }) {
  const maxJaccard = Math.max(...data.matrix.flat().filter(v => v < 1));
  return (
    <div>
      <p style={{ fontSize: "0.8rem", color: "#5A5A5A", marginBottom: "1rem" }}>
        Jaccard similarity of principle terminology. Higher = more shared concepts in foundational texts.
      </p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: "2px", fontSize: "0.7rem", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ padding: "4px 6px" }}></th>
              {data.philosophies.map(p => (
                <th key={p} style={{ padding: "4px 6px", textAlign: "center", fontWeight: 600, color: "#0B2E4A", whiteSpace: "nowrap" }}>
                  {(PHILOSOPHY_LABELS[p as PhilosophyKey] || p).split(/[\s/]/)[0]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.philosophies.map((rowPhil, i) => (
              <tr key={rowPhil}>
                <td style={{ padding: "4px 6px", fontWeight: 600, color: "#0B2E4A", whiteSpace: "nowrap" }}>
                  {(PHILOSOPHY_LABELS[rowPhil as PhilosophyKey] || rowPhil).split(/[\s/]/)[0]}
                </td>
                {data.matrix[i].map((val, j) => {
                  const t = i === j ? 0 : val / (maxJaccard || 1);
                  let bg: string, fg: string;
                  if (i === j) { bg = "rgba(0,0,0,0.03)"; fg = "#999"; }
                  else if (t < 0.5) {
                    bg = `rgb(220,${Math.round(80 + t * 2 * 160)},${Math.round(60 - t * 2 * 30)})`;
                    fg = "#fff";
                  } else {
                    bg = `rgb(${Math.round(220 - (t - 0.5) * 2 * 180)},${Math.round(240 - (t - 0.5) * 2 * 60)},${Math.round(30 + (t - 0.5) * 2 * 80)})`;
                    fg = t > 0.75 ? "#fff" : "#333";
                  }
                  return (
                    <td key={j} style={{ padding: "6px 8px", textAlign: "center", background: bg, color: fg, fontWeight: 600, borderRadius: "3px", fontSize: "0.72rem" }}>
                      {i === j ? "—" : val.toFixed(3)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: "1.25rem" }}>
        <h3 style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0B2E4A", marginBottom: "0.5rem" }}>Top Overlap Pairs</h3>
        <div style={{ display: "grid", gap: "0.5rem" }}>
          {data.topPairs.slice(0, 8).map((pair, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0.75rem", background: "rgba(0,0,0,0.02)", borderRadius: "6px" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6E6E9E", minWidth: "3rem" }}>{pair.jaccard.toFixed(3)}</span>
              <PhilLabel phil={pair.philosophyA} />
              <span style={{ fontSize: "0.7rem", color: "#999" }}>&harr;</span>
              <PhilLabel phil={pair.philosophyB} />
              <span style={{ fontSize: "0.65rem", color: "#767676", marginLeft: "auto" }}>{pair.sharedTermCount} terms: {pair.topSharedTerms.slice(0, 5).join(", ")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Dimension Profiling (all 5) ──────────────────────────────────────────────

function DimensionSection({ profiles }: { profiles: DimensionProfile[] }) {
  const dims = ["structure", "modality", "subjectApproach", "direction", "social"];
  return (
    <div>
      <p style={{ fontSize: "0.8rem", color: "#5A5A5A", marginBottom: "1rem" }}>
        All 5 dimension scores derived from KG principle/activity text analysis, compared to hardcoded values where they exist.
        Gray cells = no hardcoded value exists yet (only structure &amp; modality are currently hardcoded).
      </p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", fontSize: "0.7rem", width: "100%" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid rgba(0,0,0,0.1)" }}>
              <th style={{ padding: "6px 8px", textAlign: "left" }}>Philosophy</th>
              {dims.map(d => (
                <th key={d} colSpan={3} style={{ padding: "6px 4px", textAlign: "center", fontWeight: 600, color: "#0B2E4A", borderLeft: "2px solid rgba(0,0,0,0.06)" }}>
                  {DIM_LABELS[d].name}
                </th>
              ))}
            </tr>
            <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <th></th>
              {dims.map(d => (
                <React.Fragment key={d}>
                  <th style={{ padding: "3px 4px", textAlign: "center", fontSize: "0.6rem", color: "#999", borderLeft: "2px solid rgba(0,0,0,0.06)" }}>KG</th>
                  <th style={{ padding: "3px 4px", textAlign: "center", fontSize: "0.6rem", color: "#999" }}>Cur</th>
                  <th style={{ padding: "3px 4px", textAlign: "center", fontSize: "0.6rem", color: "#999" }}></th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {profiles.map(p => (
              <tr key={p.philosophy} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                <td style={{ padding: "6px 8px" }}><PhilLabel phil={p.philosophy} /></td>
                {dims.map(d => {
                  const sc = p.dimensions[d];
                  return (
                    <React.Fragment key={d}>
                      <td style={{ padding: "4px", textAlign: "center", fontFamily: "monospace", fontWeight: 700, borderLeft: "2px solid rgba(0,0,0,0.06)" }}>
                        {sc.kgScore}
                      </td>
                      <td style={{ padding: "4px", textAlign: "center", fontFamily: "monospace", color: sc.hardcoded != null ? "#555" : "#ccc" }}>
                        {sc.hardcoded ?? "—"}
                      </td>
                      <td style={{ padding: "4px", textAlign: "center" }}>
                        <Badge verdict={sc.verdict} />
                      </td>
                    </React.Fragment>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Visual comparison bars for dimensions with hardcoded values */}
      <div style={{ marginTop: "1.5rem" }}>
        <h3 style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0B2E4A", marginBottom: "0.75rem" }}>KG vs Hardcoded (where values exist)</h3>
        {dims.filter(d => profiles.some(p => p.dimensions[d].hardcoded != null)).map(dim => (
          <div key={dim} style={{ marginBottom: "1rem" }}>
            <h4 style={{ fontSize: "0.75rem", fontWeight: 600, color: "#555", marginBottom: "0.35rem" }}>
              {DIM_LABELS[dim].name} <span style={{ fontWeight: 400, color: "#999" }}>({DIM_LABELS[dim].low} 0 ← → 100 {DIM_LABELS[dim].high})</span>
            </h4>
            <div style={{ display: "grid", gap: "4px" }}>
              {profiles.filter(p => p.dimensions[dim].hardcoded != null).map(p => {
                const sc = p.dimensions[dim];
                return (
                  <div key={p.philosophy} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.65rem", width: "90px", textAlign: "right", color: "#555" }}>
                      {(PHILOSOPHY_LABELS[p.philosophy as PhilosophyKey] || p.philosophy).split(/[\s/]/)[0]}
                    </span>
                    <div style={{ flex: 1, position: "relative", height: "16px", background: "rgba(0,0,0,0.04)", borderRadius: "4px" }}>
                      <div style={{
                        position: "absolute", left: 0, top: 1, height: "6px", borderRadius: "3px",
                        width: `${sc.kgScore}%`,
                        background: PHILOSOPHY_COLORS[p.philosophy as PhilosophyKey] || "#6E6E9E",
                      }} />
                      <div style={{
                        position: "absolute", left: 0, top: 9, height: "6px", borderRadius: "3px",
                        width: `${sc.hardcoded}%`,
                        background: "#0B2E4A", opacity: 0.25,
                      }} />
                    </div>
                    <span style={{ fontSize: "0.6rem", fontFamily: "monospace", width: "55px", color: "#666" }}>
                      {sc.kgScore} / {sc.hardcoded}
                    </span>
                    <Badge verdict={sc.verdict} />
                  </div>
                );
              })}
              <div style={{ display: "flex", gap: "1rem", fontSize: "0.6rem", color: "#999", marginLeft: "96px" }}>
                <span>&#9632; KG-derived</span>
                <span style={{ opacity: 0.3 }}>&#9632; Hardcoded</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Archetype Audit ──────────────────────────────────────────────────────────

function ArchetypeCard({ audit }: { audit: ArchetypeAudit }) {
  const pv = audit.profileValidation;
  const sortedProfile = Object.entries(audit.philosophyProfile).sort(([, a], [, b]) => b - a);

  return (
    <div style={{ ...frost, padding: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0B2E4A" }}>{audit.archetypeName}</h3>
        <span style={{ fontSize: "0.7rem", color: "#767676" }}>
          Primary: <PhilLabel phil={pv.primaryPhilosophy} /> ({(pv.primaryWeight * 100).toFixed(0)}%)
        </span>
      </div>

      {/* Philosophy profile bars */}
      <div style={{ display: "grid", gap: "3px", marginBottom: "1rem" }}>
        {sortedProfile.map(([phil, weight]) => (
          <div key={phil} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.6rem", width: "80px", textAlign: "right", color: "#555" }}>
              {(PHILOSOPHY_LABELS[phil as PhilosophyKey] || phil).split(/[\s/]/)[0]}
            </span>
            <div style={{ flex: 1, height: "8px", background: "rgba(0,0,0,0.04)", borderRadius: "3px" }}>
              <div style={{
                height: "100%", borderRadius: "3px",
                width: `${weight * 100}%`,
                background: PHILOSOPHY_COLORS[phil as PhilosophyKey] || "#6E6E9E",
                opacity: phil === pv.primaryPhilosophy ? 1 : 0.6,
              }} />
            </div>
            <span style={{ fontSize: "0.6rem", fontFamily: "monospace", width: "30px", color: "#666" }}>{(weight * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>

      {/* Secondary overlap validation */}
      {pv.secondaries.length > 0 && (
        <div style={{ marginBottom: "0.75rem" }}>
          <h4 style={{ fontSize: "0.7rem", fontWeight: 600, color: "#0B2E4A", marginBottom: "0.3rem" }}>Secondary Overlap with Primary</h4>
          <div style={{ display: "grid", gap: "2px" }}>
            {pv.secondaries.map(s => (
              <div key={s.philosophy} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.65rem", color: "#555" }}>
                <PhilLabel phil={s.philosophy} />
                <span style={{ fontFamily: "monospace" }}>overlap={s.overlapWithPrimary.toFixed(3)}</span>
                <span style={{ color: "#999" }}>#{s.overlapRank}/7</span>
                <Badge verdict={s.verdict} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All 5 dimension audits */}
      <h4 style={{ fontSize: "0.7rem", fontWeight: 600, color: "#0B2E4A", marginBottom: "0.3rem" }}>Dimension Audit (vs KG for {(PHILOSOPHY_LABELS[pv.primaryPhilosophy as PhilosophyKey] || pv.primaryPhilosophy).split(/[\s/]/)[0]})</h4>
      <div style={{ display: "grid", gap: "2px" }}>
        {audit.dimensionAudits.map(d => (
          <div key={d.dimension} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.65rem" }}>
            <span style={{ width: "80px", textAlign: "right", color: "#555" }}>{DIM_LABELS[d.dimension]?.name || d.dimension}</span>
            <span style={{ fontFamily: "monospace", color: "#555" }}>
              arch={d.archetypeValue ?? "—"}
            </span>
            <span style={{ fontFamily: "monospace", color: "#555" }}>
              KG={d.kgValue}
            </span>
            {d.archetypeValue != null && (
              <span style={{ fontFamily: "monospace", color: d.delta > 0 ? "#DC2626" : d.delta < 0 ? "#059669" : "#666" }}>
                {d.delta > 0 ? "+" : ""}{d.delta}
              </span>
            )}
            <Badge verdict={d.verdict} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Quiz Audit ───────────────────────────────────────────────────────────────

function QuizQuestionCard({ audit }: { audit: QuizQuestionAudit }) {
  const [open, setOpen] = useState(false);
  const flagCount = audit.choices.reduce((n, c) => n + c.flags.length, 0);
  const dims = ["structure", "modality", "subjectApproach", "direction", "social"];
  const phils = ["montessori", "waldorf", "project_based", "place_nature", "classical", "charlotte_mason", "unschooling", "adaptive"];

  return (
    <div style={{ background: "rgba(0,0,0,0.02)", borderRadius: "8px", overflow: "hidden" }}>
      <button onClick={() => setOpen(!open)} style={{ all: "unset", cursor: "pointer", width: "100%", display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem" }}>
        <span style={{ fontSize: "0.75rem", transition: "transform 0.2s", transform: open ? "rotate(90deg)" : "rotate(0)" }}>&#9654;</span>
        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#0B2E4A" }}>{audit.questionId.toUpperCase()}: {audit.theme}</span>
        {flagCount > 0 && (
          <span style={{ fontSize: "0.6rem", fontWeight: 600, padding: "2px 6px", borderRadius: "4px", background: "rgba(245,158,11,0.15)", color: "#D97706" }}>
            {flagCount} flag{flagCount > 1 ? "s" : ""}
          </span>
        )}
      </button>
      {open && (
        <div style={{ padding: "0 1rem 1rem" }}>
          <p style={{ fontSize: "0.75rem", fontStyle: "italic", color: "#666", marginBottom: "0.75rem" }}>{audit.scenario}</p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: "0.65rem", width: "100%" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid rgba(0,0,0,0.1)" }}>
                  <th style={{ padding: "4px", textAlign: "left", minWidth: "180px" }}>Choice</th>
                  {dims.map(d => <th key={d} style={{ padding: "4px", textAlign: "center", fontWeight: 600, color: "#0B2E4A" }}>{d.slice(0, 4).toUpperCase()}</th>)}
                  <th style={{ padding: "4px", width: "4px", background: "rgba(0,0,0,0.06)" }}></th>
                  {phils.map(p => <th key={p} style={{ padding: "4px", textAlign: "center", fontWeight: 600, color: PHILOSOPHY_COLORS[p as PhilosophyKey] || "#333" }}>{(PHILOSOPHY_LABELS[p as PhilosophyKey] || p).slice(0, 4).toUpperCase()}</th>)}
                  <th style={{ padding: "4px", textAlign: "left" }}>Flags</th>
                </tr>
              </thead>
              <tbody>
                {audit.choices.map(c => (
                  <tr key={c.index} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)", background: c.flags.length > 0 ? "rgba(245,158,11,0.06)" : "transparent" }}>
                    <td style={{ padding: "4px", maxWidth: "220px" }}>
                      <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{String.fromCharCode(65 + c.index)}. {c.text}</span>
                    </td>
                    {dims.map(d => {
                      const v = c.dimensions[d] ?? 0;
                      return <td key={d} style={{ padding: "4px", textAlign: "center", fontFamily: "monospace", color: v > 0 ? "#059669" : v < 0 ? "#DC2626" : "#ccc", fontWeight: v !== 0 ? 600 : 400 }}>{v === 0 ? "·" : (v > 0 ? "+" : "") + v}</td>;
                    })}
                    <td style={{ background: "rgba(0,0,0,0.06)" }}></td>
                    {phils.map(p => {
                      const v = c.philosophies[p] ?? 0;
                      return <td key={p} style={{ padding: "4px", textAlign: "center", fontFamily: "monospace", color: v > 0 ? (PHILOSOPHY_COLORS[p as PhilosophyKey] || "#333") : "#ddd", fontWeight: v > 0 ? 700 : 400 }}>{v === 0 ? "·" : v}</td>;
                    })}
                    <td style={{ padding: "4px" }}>
                      {c.flags.map((f, fi) => <span key={fi} style={{ display: "block", fontSize: "0.6rem", color: "#D97706", lineHeight: 1.3 }}>&#9888; {f}</span>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: "0.75rem" }}>
            <h4 style={{ fontSize: "0.7rem", fontWeight: 600, color: "#0B2E4A", marginBottom: "0.3rem" }}>Philosophy points in this question</h4>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {phils.map(p => {
                const pts = audit.totalPhilosophyPoints[p] || 0;
                return <span key={p} style={{ fontSize: "0.65rem", padding: "2px 6px", borderRadius: "4px", background: pts > 0 ? `${PHILOSOPHY_COLORS[p as PhilosophyKey]}15` : "rgba(0,0,0,0.03)", color: pts > 0 ? PHILOSOPHY_COLORS[p as PhilosophyKey] : "#ccc", fontWeight: pts > 0 ? 600 : 400 }}>{(PHILOSOPHY_LABELS[p as PhilosophyKey] || p).split(/[\s/]/)[0]}: {pts}</span>;
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Proposed Changes Section ─────────────────────────────────────────────────

function ProposedChangesSection({ changes }: { changes: ProposedChange[] }) {
  // Group by file
  const byFile: Record<string, ProposedChange[]> = {};
  for (const c of changes) {
    if (!byFile[c.file]) byFile[c.file] = [];
    byFile[c.file].push(c);
  }

  const actionCount = changes.filter(c => c.severity === "action").length;
  const warningCount = changes.filter(c => c.severity === "warning").length;

  return (
    <div>
      <p style={{ fontSize: "0.8rem", color: "#5A5A5A", marginBottom: "0.5rem" }}>
        {changes.length} proposed changes ({actionCount} high-priority, {warningCount} review). Each row shows the current value, KG-suggested value, and reasoning.
        <strong> Review each and decide what to accept — not all KG suggestions will be correct</strong> (e.g., keyword analysis can misread structure for philosophies that discuss flexibility while being structured in practice).
      </p>

      {Object.entries(byFile).map(([file, fileChanges]) => (
        <div key={file} style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "0.8rem", fontWeight: 600, color: "#0B2E4A", marginBottom: "0.5rem", fontFamily: "monospace" }}>
            {file}
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: "0.7rem", width: "100%" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid rgba(0,0,0,0.1)" }}>
                  <th style={{ padding: "6px 8px", textAlign: "left" }}>Location</th>
                  <th style={{ padding: "6px 8px", textAlign: "left" }}>Field</th>
                  <th style={{ padding: "6px 8px", textAlign: "center" }}>Current</th>
                  <th style={{ padding: "6px 8px", textAlign: "center" }}>→</th>
                  <th style={{ padding: "6px 8px", textAlign: "center" }}>Proposed</th>
                  <th style={{ padding: "6px 8px", textAlign: "center" }}>Priority</th>
                  <th style={{ padding: "6px 8px", textAlign: "center" }}>Affects</th>
                  <th style={{ padding: "6px 8px", textAlign: "left" }}>Reason</th>
                </tr>
              </thead>
              <tbody>
                {fileChanges.map((c, idx) => (
                  <tr key={idx} style={{
                    borderBottom: "1px solid rgba(0,0,0,0.05)",
                    background: c.severity === "action" ? "rgba(239,68,68,0.04)" : "transparent",
                  }}>
                    <td style={{ padding: "6px 8px", fontFamily: "monospace", fontSize: "0.65rem", color: "#555" }}>
                      {c.location}
                    </td>
                    <td style={{ padding: "6px 8px", fontWeight: 600 }}>{c.field}</td>
                    <td style={{ padding: "6px 8px", textAlign: "center", fontFamily: "monospace", fontWeight: 700, color: "#DC2626" }}>
                      {c.currentValue}
                    </td>
                    <td style={{ padding: "6px 8px", textAlign: "center", color: "#999" }}>→</td>
                    <td style={{ padding: "6px 8px", textAlign: "center", fontFamily: "monospace", fontWeight: 700, color: "#059669" }}>
                      {c.proposedValue}
                    </td>
                    <td style={{ padding: "6px 8px", textAlign: "center" }}>
                      <Badge verdict={c.severity === "action" ? "major-gap" : "minor-gap"} />
                    </td>
                    <td style={{ padding: "6px 8px", textAlign: "center" }}>
                      <span style={{
                        fontSize: "0.6rem", fontWeight: 600, padding: "1px 6px", borderRadius: "3px",
                        background: c.target === "explore-map" ? "rgba(59,130,246,0.12)" : "rgba(139,92,246,0.12)",
                        color: c.target === "explore-map" ? "#2563EB" : "#7C3AED",
                      }}>
                        {c.target === "explore-map" ? "Explore Map" : "Quiz Matching"}
                      </span>
                    </td>
                    <td style={{ padding: "6px 8px", fontSize: "0.65rem", color: "#666", maxWidth: "300px" }}>
                      {c.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

import React from "react";

export default function AuditPage() {
  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/audit")
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(String(e)); setLoading(false); });
  }, []);

  if (loading) return <Shell hue="audit"><div className="flex items-center justify-center py-12"><p style={{ color: "#5A5A5A" }}>Computing audit from KG data...</p></div></Shell>;
  if (error || !data) return <Shell hue="audit"><div className="text-center py-12" style={{ color: "#DC2626" }}><p>Failed to load audit data</p><p style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>{error}</p></div></Shell>;

  return (
    <Shell hue="audit">
      <div className="space-y-5">
        {/* Header */}
        <div>
          <h1 className="font-cormorant-sc text-3xl" style={{ color: "#0B2E4A" }}>Compass System Audit</h1>
          <p style={{ fontSize: "0.8rem", color: "#5A5A5A", marginTop: "0.25rem" }}>
            KG-backed validation of all 5 dimensions, archetype profiles, and quiz question weights.
          </p>
          <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem", fontSize: "0.7rem", color: "#767676" }}>
            <span>{data.meta.principleCount} principles</span>
            <span>{data.meta.activityCount} activities</span>
            <span>{data.meta.materialCount} materials</span>
            <span>{data.meta.philosophyCount} philosophies</span>
          </div>
        </div>

        {/* Actions Summary */}
        {data.actions && data.actions.length > 0 && (
          <Section title="Audit Findings &amp; Recommended Actions">
            <p style={{ fontSize: "0.8rem", color: "#5A5A5A", marginBottom: "1rem" }}>Auto-generated from KG evidence. Sorted by priority.</p>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {data.actions.map((action, idx) => {
                const sev = action.severity;
                const c = { action: { border: "#DC2626", bg: "rgba(239,68,68,0.06)", icon: "\u26A0", iconColor: "#DC2626" }, warning: { border: "#D97706", bg: "rgba(245,158,11,0.06)", icon: "\u25B2", iconColor: "#D97706" }, info: { border: "#6E6E9E", bg: "rgba(110,110,158,0.06)", icon: "\u2139", iconColor: "#6E6E9E" } }[sev];
                const sectionLabel = { overlap: "Overlap", dimensions: "Dimensions", archetype: "Archetype", quiz: "Quiz" }[action.section];
                const targetConfig: Record<string, { label: string; bg: string; color: string }> = {
                  "explore-map":   { label: "Explore Map",    bg: "rgba(59,130,246,0.12)", color: "#2563EB" },
                  "quiz-matching": { label: "Quiz Matching",  bg: "rgba(139,92,246,0.12)", color: "#7C3AED" },
                  "both":          { label: "Map + Quiz",     bg: "rgba(107,114,128,0.12)", color: "#4B5563" },
                };
                const target = action.target ? targetConfig[action.target] : null;
                return (
                  <div key={idx} style={{ borderLeft: `4px solid ${c.border}`, background: c.bg, borderRadius: "0 8px 8px 0", padding: "0.75rem 1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.9rem", color: c.iconColor }}>{c.icon}</span>
                      <span style={{ fontSize: "0.6rem", fontWeight: 600, padding: "1px 6px", borderRadius: "3px", background: `${c.border}20`, color: c.border, textTransform: "uppercase", letterSpacing: "0.05em" }}>{sev}</span>
                      <span style={{ fontSize: "0.6rem", fontWeight: 500, padding: "1px 6px", borderRadius: "3px", background: "rgba(0,0,0,0.05)", color: "#666" }}>{sectionLabel}</span>
                      {target && (
                        <span style={{ fontSize: "0.6rem", fontWeight: 600, padding: "1px 6px", borderRadius: "3px", background: target.bg, color: target.color }}>
                          {target.label}
                        </span>
                      )}
                      <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#0B2E4A" }}>{action.title}</span>
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "#555", lineHeight: 1.5, marginBottom: "0.5rem" }}>{action.detail}</p>
                    <div style={{ fontSize: "0.75rem", color: "#0B2E4A", lineHeight: 1.5, padding: "0.5rem 0.75rem", background: "rgba(255,255,255,0.6)", borderRadius: "6px", borderLeft: `3px solid ${c.border}40` }}>
                      <strong style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em", color: c.border }}>Suggested action:</strong>{" "}{action.suggestedAction}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        <Section title="1. Cross-Philosophy Overlap Matrix">
          <OverlapMatrixSection data={data.overlapMatrix} />
        </Section>

        <Section title="2. Full Dimension Profiling (All 5 Dimensions)">
          <DimensionSection profiles={data.dimensionProfiles} />
        </Section>

        <Section title="3. Archetype Dimension &amp; Philosophy Audit">
          <p style={{ fontSize: "0.8rem", color: "#5A5A5A", marginBottom: "1rem" }}>
            For each archetype: all 5 dimension tendencies audited against primary philosophy&apos;s KG scores, plus secondary philosophy overlap validation.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.archetypeAudits.map(a => <ArchetypeCard key={a.archetypeId} audit={a} />)}
          </div>
        </Section>

        <Section title="4. Quiz Question Score Digest" defaultOpen={false}>
          <p style={{ fontSize: "0.8rem", color: "#5A5A5A", marginBottom: "1rem" }}>
            Every Part 1 question with all dimension and philosophy weights per choice.
          </p>
          <div className="space-y-2">
            {data.quizAudits.map(q => <QuizQuestionCard key={q.questionId} audit={q} />)}
          </div>
        </Section>

        {/* Proposed Changes — the actionable summary */}
        {data.proposedChanges && data.proposedChanges.length > 0 && (
          <Section title="5. Proposed Changes — Human Review Required">
            <ProposedChangesSection changes={data.proposedChanges} />
          </Section>
        )}
      </div>
    </Shell>
  );
}
