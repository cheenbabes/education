"use client";

import { Shell } from "@/components/shell";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Standard {
  code: string;
  description: string;
  covered: boolean;
  lessonTitle: string | null;
}

interface SubjectProgress {
  subject: string;
  total: number;
  covered: number;
  standards: Standard[];
}

interface ChildData {
  id: string;
  name: string;
  gradeLevel: string;
  standardsOptIn: boolean;
}

interface StandardsData {
  childId: string;
  childName: string;
  gradeLevel: string;
  state: string;
  subjects: SubjectProgress[];
}

const frostCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.5)",
  borderRadius: "12px",
  padding: "1.25rem",
  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
};

const frostPillBase: React.CSSProperties = {
  background: "rgba(255,255,255,0.68)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255,255,255,0.45)",
  borderRadius: "6px",
  fontSize: "0.7rem",
  padding: "0.25rem 0.6rem",
  fontWeight: 500,
  display: "inline-flex",
  alignItems: "center",
};

export default function StandardsPage() {
  const [children, setChildren] = useState<ChildData[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [data, setData] = useState<StandardsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStandards, setLoadingStandards] = useState(false);

  // Load children
  useEffect(() => {
    fetch("/api/children?userId=demo-user")
      .then((r) => r.json())
      .then((kids) => {
        setChildren(kids);
        const optedIn = kids.find((c: ChildData) => c.standardsOptIn);
        if (optedIn) setSelectedChild(optedIn.id);
        setLoading(false);
      });
  }, []);

  // Load standards when child changes
  useEffect(() => {
    if (!selectedChild) return;
    setLoadingStandards(true);
    fetch(`/api/standards?childId=${selectedChild}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load standards");
        return r.json();
      })
      .then((d) => {
        setData(d);
        setLoadingStandards(false);
      })
      .catch(() => {
        setData(null);
        setLoadingStandards(false);
      });
  }, [selectedChild]);

  const child = children.find((c) => c.id === selectedChild);

  if (loading) {
    return (
      <Shell hue="standards">
        <div className="flex items-center justify-center py-12">
          <p style={{ color: "#5A5A5A" }}>Loading...</p>
        </div>
      </Shell>
    );
  }

  if (children.filter((c) => c.standardsOptIn).length === 0) {
    return (
      <Shell hue="standards">
        <div className="text-center py-12" style={{ color: "#5A5A5A" }}>
          <p style={{ fontSize: "1.125rem", fontWeight: 500 }}>No children have standards tracking enabled</p>
          <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
            Enable it in the{" "}
            <Link href="/children" style={{ color: "#6E6E9E" }} className="hover:underline">
              Children settings
            </Link>{" "}
            page.
          </p>
        </div>
      </Shell>
    );
  }

  if (child && !child.standardsOptIn) {
    return (
      <Shell hue="standards">
        <div className="text-center py-12" style={{ color: "#5A5A5A" }}>
          <p style={{ fontSize: "1.125rem", fontWeight: 500 }}>Standards tracking is off for {child.name}</p>
          <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
            You can enable it in the{" "}
            <Link href="/children" style={{ color: "#6E6E9E" }} className="hover:underline">
              Children settings
            </Link>{" "}
            page.
          </p>
        </div>
      </Shell>
    );
  }

  const progress = data?.subjects || [];
  const totalStandards = progress.reduce((sum, sp) => sum + sp.total, 0);
  const totalCovered = progress.reduce((sum, sp) => sum + sp.covered, 0);

  return (
    <Shell hue="standards">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-cormorant-sc text-3xl" style={{ color: "#0B2E4A" }}>Standards Progress</h1>
            {data && (
              <p style={{ fontSize: "0.875rem", color: "#5A5A5A", marginTop: "0.25rem" }}>
                {data.state} — Grade {data.gradeLevel} — {totalCovered} of {totalStandards} objectives covered
              </p>
            )}
          </div>

          {/* Child selector as frost-pill select */}
          <div style={{
            position: "relative",
            background: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.5)",
            borderRadius: "10px",
            padding: "0.5rem 0.75rem",
            display: "inline-flex",
            alignItems: "center",
          }}>
            <select
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
              style={{
                fontSize: "0.8rem",
                appearance: "none",
                WebkitAppearance: "none",
                cursor: "pointer",
                color: "#0B2E4A",
                background: "transparent",
                border: "none",
                outline: "none",
                paddingRight: "2rem",
                fontWeight: 500,
              }}
            >
              {children
                .filter((c) => c.standardsOptIn)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — Grade {c.gradeLevel}
                  </option>
                ))}
            </select>
            <svg style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>

        {loadingStandards ? (
          <div className="flex items-center justify-center py-12">
            <p style={{ color: "#5A5A5A" }}>Loading standards...</p>
          </div>
        ) : (
          <>
            {/* Overview cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {progress.map((sp) => {
                const pct = sp.total > 0 ? Math.round((sp.covered / sp.total) * 100) : 0;
                return (
                  <div key={sp.subject} style={frostCard}>
                    <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "#0B2E4A" }}>{sp.subject}</p>
                    <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "#6E6E9E", marginTop: "0.25rem" }}>{pct}%</p>
                    <p style={{ fontSize: "0.75rem", color: "#767676" }}>
                      {sp.covered} of {sp.total} objectives
                    </p>
                    <div style={{ marginTop: "0.5rem", background: "rgba(0,0,0,0.08)", borderRadius: "9999px", height: "0.5rem" }}>
                      <div
                        style={{
                          background: "#6E6E9E",
                          borderRadius: "9999px",
                          height: "0.5rem",
                          width: `${pct}%`,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detailed checklists */}
            {progress.map((sp) => (
              <div key={sp.subject} style={{ ...frostCard, padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                  <h2 className="font-cormorant-sc" style={{ fontSize: "1rem", color: "#0B2E4A" }}>
                    {sp.subject} — {sp.covered}/{sp.total} covered
                  </h2>
                </div>
                <div>
                  {sp.standards.map((std) => (
                    <div
                      key={std.code}
                      style={{
                        padding: "0.75rem 1.25rem",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.75rem",
                        borderBottom: "1px solid rgba(0,0,0,0.04)",
                        background: std.covered ? "rgba(122,158,138,0.1)" : "transparent",
                      }}
                    >
                      {/* Checkbox */}
                      <div
                        style={{
                          marginTop: "0.125rem",
                          width: "1.25rem",
                          height: "1.25rem",
                          borderRadius: "4px",
                          border: std.covered ? "none" : "1px solid rgba(0,0,0,0.2)",
                          background: std.covered ? "#7A9E8A" : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          color: "#fff",
                          fontSize: "0.7rem",
                        }}
                      >
                        {std.covered && <span>&#10003;</span>}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontSize: "0.7rem",
                              color: "#767676",
                            }}
                          >
                            {std.code}
                          </span>
                          {std.covered && std.lessonTitle && (
                            <span style={{ ...frostPillBase, color: "#5A947A", background: "rgba(122,158,138,0.15)", border: "1px solid rgba(122,158,138,0.3)", fontSize: "0.65rem" }}>
                              via: {std.lessonTitle}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: "0.875rem", color: "#5A5A5A", marginTop: "0.125rem" }}>{std.description}</p>
                      </div>
                    </div>
                  ))}
                  {sp.standards.length === 0 && (
                    <div style={{ padding: "1rem", textAlign: "center", fontSize: "0.875rem", color: "#767676" }}>
                      No standards found for this subject and grade.
                    </div>
                  )}
                </div>
              </div>
            ))}

            {progress.length === 0 && (
              <div style={{ textAlign: "center", padding: "2rem 0", color: "#5A5A5A" }}>
                <p>No standards data available.</p>
                <p style={{ fontSize: "0.875rem", marginTop: "0.25rem", color: "#767676" }}>Make sure the KG service is running.</p>
              </div>
            )}
          </>
        )}
      </div>
    </Shell>
  );
}
