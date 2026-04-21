"use client";

import { Shell } from "@/components/shell";
import { GRADES, US_STATES } from "@/lib/types";
import { useState, useEffect } from "react";
import Link from "next/link";
import { UPGRADE_URL } from "@/lib/upgradeUrl";
import { useFeatureFlagEnabled } from "posthog-js/react";
import { track } from "@/lib/analytics";

interface ChildProfile {
  id: string;
  name: string;
  dateOfBirth: string;
  gradeLevel: string;
  standardsOptIn: boolean;
  learningNotes: string;
}

interface TierData {
  tier: string;
  lessonsUsed: number;
  lessonsLimit: number;
  worksheetsUsed: number;
  worksheetsLimit: number;
  childrenCount: number;
  childrenLimit: number;
  resetsAt: string;
}

interface ArchetypeData {
  resultId: string;
  archetype: string;
  secondaryArchetype: string | null;
  topPhilosophyIds: string[];
  philosophyBlend: Record<string, number>;
}

/* ── Design tokens ─────────────────────────────────────────────────────────── */
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

const nightButton: React.CSSProperties = {
  background: "#082f4e",
  color: "#F9F6EF",
  borderRadius: "10px",
  padding: "0.6rem 1.4rem",
  cursor: "pointer",
  fontSize: "0.875rem",
  fontWeight: 500,
  border: "none",
};

const ghostButton: React.CSSProperties = {
  background: "transparent",
  color: "#5A5A5A",
  borderRadius: "10px",
  padding: "0.6rem 1.4rem",
  cursor: "pointer",
  fontSize: "0.875rem",
  fontWeight: 500,
  border: "1px solid rgba(0,0,0,0.15)",
};

const formInput: React.CSSProperties = {
  background: "rgba(255,255,255,0.6)",
  border: "1px solid rgba(0,0,0,0.1)",
  borderRadius: "8px",
  padding: "0.45rem 0.6rem",
  fontSize: "0.875rem",
  color: "#0B2E4A",
  width: "100%",
  maxWidth: "20rem",
  outline: "none",
};

/* ── Tier config ───────────────────────────────────────────────────────────── */
const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  compass:    { label: "Compass",    color: "#6E6E9E", bg: "rgba(110,110,158,0.1)",  border: "rgba(110,110,158,0.25)" },
  homestead:  { label: "Homestead",  color: "#C4983D", bg: "rgba(196,152,61,0.1)",   border: "rgba(196,152,61,0.25)"  },
  schoolhouse:{ label: "Schoolhouse",color: "#5A947A", bg: "rgba(90,148,122,0.1)",   border: "rgba(90,148,122,0.25)"  },
};

function UsageBar({ used, limit, label }: { used: number; limit: number; label: string }) {
  const unlimited = limit < 0;
  const pct = unlimited ? 0 : limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const color = unlimited ? "#5A947A" : pct >= 90 ? "#C07A42" : pct >= 60 ? "#C4983D" : "#5A947A";
  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600, color: unlimited ? "var(--ink)" : pct >= 90 ? "#C07A42" : "var(--ink)" }}>{used}{unlimited ? "" : ` / ${limit}`}</span>
      </div>
      <div style={{ height: "5px", borderRadius: "3px", background: "rgba(0,0,0,0.07)" }}>
        <div style={{ height: "100%", borderRadius: "3px", width: `${pct}%`, background: color, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────────── */
export default function AccountPage() {
  const worksheetsEnabled = useFeatureFlagEnabled("worksheets_enabled");
  const [tierData, setTierData] = useState<TierData | null>(null);
  const [archetypeData, setArchetypeData] = useState<ArchetypeData | null>(null);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [state, setState] = useState("MI");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingState, setSavingState] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [childError, setChildError] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<ChildProfile, "id">>({
    name: "", dateOfBirth: "", gradeLevel: "K", standardsOptIn: true, learningNotes: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/user/tier").then((r) => r.json()),
      fetch("/api/user").then((r) => r.json()),
      fetch("/api/children").then((r) => r.json()),
      fetch("/api/user/archetype").then((r) => r.json()),
    ]).then(([tier, user, kids, archetype]) => {
      setTierData(tier);
      if (archetype) setArchetypeData(archetype);
      if (user.state) setState(user.state);
      if (user.role === "admin") setIsAdmin(true);
      setChildren(kids.map((c: ChildProfile & { dateOfBirth: string }) => ({
        ...c,
        dateOfBirth: c.dateOfBirth.split("T")[0],
      })));
      setLoading(false);
    });
  }, []);

  const resetForm = () => setForm({ name: "", dateOfBirth: "", gradeLevel: "K", standardsOptIn: true, learningNotes: "" });

  const handleSave = async () => {
    setSaving(true);
    setChildError(null);
    try {
      if (editing) {
        const res = await fetch(`/api/children/${editing}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const data = await res.json();
          setChildError(data.error === "child_limit" ? `You've reached the child limit for your plan (${data.limit}).` : "Failed to save. Please try again.");
          return;
        }
        const updated = await res.json();
        setChildren((prev) => prev.map((c) =>
          c.id === editing ? { ...updated, dateOfBirth: updated.dateOfBirth.split("T")[0] } : c
        ));
        setEditing(null);
      } else {
        const res = await fetch("/api/children", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const data = await res.json();
          setChildError(data.error === "child_limit" ? `You've reached the child limit for your plan (${data.limit}). Upgrade to add more children.` : "Failed to save. Please try again.");
          return;
        }
        const created = await res.json();
        track("child_added", {
          grade_level: created.gradeLevel,
          standards_opt_in: !!created.standardsOptIn,
          total_children_after: children.length + 1,
        });
        setChildren((prev) => [...prev, { ...created, dateOfBirth: created.dateOfBirth.split("T")[0] }]);
        setShowAdd(false);
      }
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (child: ChildProfile) => {
    setForm({ name: child.name, dateOfBirth: child.dateOfBirth, gradeLevel: child.gradeLevel, standardsOptIn: child.standardsOptIn, learningNotes: child.learningNotes ?? "" });
    setEditing(child.id);
    setShowAdd(true);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/children/${id}`, { method: "DELETE" });
    setChildren((prev) => prev.filter((c) => c.id !== id));
  };

  if (loading) {
    return (
      <Shell hue="children">
        <div className="flex items-center justify-center py-12">
          <p style={{ color: "#5A5A5A" }}>Loading...</p>
        </div>
      </Shell>
    );
  }

  const tier = tierData?.tier || "compass";
  const tierConf = TIER_CONFIG[tier] || TIER_CONFIG.compass;
  const resetsAt = tierData?.resetsAt
    ? new Date(tierData.resetsAt).toLocaleDateString("en-US", { month: "long", day: "numeric" })
    : null;
  const atChildLimit = !!tierData && tierData.childrenLimit >= 0 && tierData.childrenCount >= tierData.childrenLimit;

  return (
    <Shell hue="children">
      <div className="space-y-6" style={{ maxWidth: "680px" }}>
        <div>
          <h1 className="font-cormorant-sc text-3xl" style={{ color: "#0B2E4A" }}>Account</h1>
          <p style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", marginTop: "0.25rem" }}>
            To update your name, email, or avatar — use the profile icon in the top navigation.
          </p>
          {isAdmin && (
            <Link
              href="/admin/metrics"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                marginTop: "0.6rem",
                padding: "0.35rem 0.7rem",
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.04em",
                color: "#fff",
                background: "#0B2E4A",
                borderRadius: "6px",
                textDecoration: "none",
              }}
            >
              Admin · Metrics →
            </Link>
          )}
        </div>

        {/* ── Section 0: Your Archetype ─────────────────────────────────── */}
        <div style={frostCard}>
          <p style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: "0.75rem" }}>
            Your Teaching Archetype
          </p>
          {archetypeData ? (
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
                  <span className="font-cormorant-sc" style={{ fontSize: "1.15rem", fontWeight: 600, color: "var(--ink)", textTransform: "capitalize" }}>
                    {archetypeData.archetype.replace("the-", "The ")}
                  </span>
                  {archetypeData.secondaryArchetype && (
                    <>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>+</span>
                      <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", textTransform: "capitalize" }}>
                        {archetypeData.secondaryArchetype.replace("the-", "The ")}
                      </span>
                    </>
                  )}
                </div>
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  {archetypeData.topPhilosophyIds.map((id) => (
                    <span key={id} style={{
                      fontSize: "0.72rem", padding: "0.2rem 0.5rem", borderRadius: "6px",
                      background: "rgba(110,110,158,0.1)", color: "var(--accent-primary)",
                      border: "1px solid rgba(110,110,158,0.2)",
                    }}>
                      {id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </span>
                  ))}
                </div>
              </div>
              <Link href={`/compass/results?id=${archetypeData.resultId}`}
                style={{ fontSize: "0.78rem", color: "var(--accent-primary)", textDecoration: "none", whiteSpace: "nowrap" }}>
                View full results →
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                You haven&apos;t taken the Compass Assessment yet.
              </p>
              <Link href="/compass" className="btn-night" style={{ fontSize: "0.8rem", padding: "0.45rem 1rem", textDecoration: "none" }}>
                Take the Assessment →
              </Link>
            </div>
          )}
        </div>

        {/* ── Section 1: Your Plan ───────────────────────────────────────── */}
        <div style={{ ...frostCard, display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <p style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: "0.4rem" }}>
                Your Plan
              </p>
              <span style={{
                fontSize: "0.85rem", fontWeight: 600, padding: "0.3rem 0.75rem",
                borderRadius: "8px", color: tierConf.color,
                background: tierConf.bg, border: `1px solid ${tierConf.border}`,
              }}>
                {tierConf.label}
              </span>
            </div>

            {tier === "compass" ? (
              <Link href={UPGRADE_URL} style={{
                ...nightButton,
                display: "inline-flex", alignItems: "center", gap: "0.4rem",
                padding: "0.5rem 1rem", fontSize: "0.82rem", textDecoration: "none",
              }}>
                Upgrade to Homestead — $21.99/mo
              </Link>
            ) : (
              <a
                href={process.env.NEXT_PUBLIC_BILLING_PORTAL_URL ?? UPGRADE_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "0.78rem", color: "#5A5A5A", textDecoration: "underline" }}
              >
                Manage billing, invoices &amp; cancellation →
              </a>
            )}
          </div>

          {/* Usage */}
          {tierData && (
            <div>
              <UsageBar used={tierData.lessonsUsed} limit={tierData.lessonsLimit} label="Lessons this month" />
              {worksheetsEnabled && tier !== "compass" && (
                <UsageBar used={tierData.worksheetsUsed} limit={tierData.worksheetsLimit} label="Worksheets this month" />
              )}
              {resetsAt && (
                <p style={{ fontSize: "0.72rem", color: "var(--text-tertiary)" }}>Resets {resetsAt}</p>
              )}
            </div>
          )}

          {tier === "compass" && (
            <div style={{
              background: "rgba(110,110,158,0.06)", border: "1px solid rgba(110,110,158,0.15)",
              borderRadius: "8px", padding: "0.75rem 1rem", fontSize: "0.8rem", color: "var(--text-secondary)",
            }}>
              Upgrade to unlock child profiles, standards tracking, calendar scheduling, and 30 lessons per month.
            </div>
          )}
        </div>

        {/* ── Section 2: Your State ──────────────────────────────────────── */}
        <div style={frostCard}>
          <p style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: "0.75rem" }}>
            Your State
          </p>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.6rem" }}>
            Used for state standards alignment in your lessons. Applies to all children.
          </p>
          <div style={{ position: "relative", display: "inline-block", width: "15rem" }}>
            <select
              value={state}
              onChange={(e) => {
                const newState = e.target.value;
                setState(newState);
                setSavingState(true);
                fetch("/api/user", {
                  method: "PUT", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ state: newState }),
                }).finally(() => setSavingState(false));
              }}
              style={{
                ...formInput, maxWidth: "100%", width: "100%",
                appearance: "none", WebkitAppearance: "none",
                padding: "0.5rem 2rem 0.5rem 0.65rem", cursor: "pointer",
              }}
            >
              {US_STATES.map((s) => (
                <option key={s.abbr} value={s.abbr}>{s.name}</option>
              ))}
            </select>
            <svg style={{ position: "absolute", right: "0.65rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          {savingState && <p style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", marginTop: "0.4rem" }}>Saving…</p>}
        </div>

        {/* ── Section 3: Your Family ─────────────────────────────────────── */}
        <div>
          <p style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: "0.75rem" }}>
            Your Family
          </p>

          {tier === "compass" ? (
            <div
              style={{
                background: "rgba(255,255,255,0.72)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.55)",
                borderLeft: "3px solid #82284b",
                borderRadius: "0 14px 14px 0",
                padding: "1.5rem 1.75rem",
                boxShadow: "0 3px 14px rgba(11,46,74,0.06)",
                display: "flex",
                flexDirection: "column",
                gap: "1.1rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "rgba(130,40,75,0.08)",
                    border: "1px solid rgba(130,40,75,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#82284b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <h2
                    className="font-cormorant-sc"
                    style={{
                      fontSize: "1.35rem",
                      fontWeight: 700,
                      color: "var(--ink)",
                      letterSpacing: "0.03em",
                      margin: "0 0 0.25rem",
                    }}
                  >
                    Lessons tuned to each of your kids
                  </h2>
                  <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.55, margin: 0 }}>
                    Every generated lesson adapts to the child it&apos;s for.
                    Tell us who they are — <strong style={{ color: "var(--ink)" }}>gifted</strong>, <strong style={{ color: "var(--ink)" }}>ADHD</strong>,
                    {" "}<strong style={{ color: "var(--ink)" }}>dyslexic</strong>, advanced in math but behind in reading, loves hands-on — and Sage&apos;s Compass tunes the plan, pacing, and differentiation notes to fit.
                  </p>
                </div>
              </div>

              {/* Feature list */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                {[
                  {
                    title: "Per-child learning notes",
                    body: "Write a few lines about how your child learns — neurotype, strengths, accommodations — and every lesson honors them.",
                  },
                  {
                    title: "State standards tracking",
                    body: "See exactly which standards each child has covered and where the gaps are — no more guessing.",
                  },
                  {
                    title: "Calendar scheduling",
                    body: "Drop lessons onto specific days for specific kids. See each child's week at a glance.",
                  },
                  {
                    title: "30 lessons per month (10× free)",
                    body: "Enough for a full homeschool week for multiple children, every week.",
                  },
                ].map((b) => (
                  <div
                    key={b.title}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.6rem",
                      fontSize: "0.82rem",
                      lineHeight: 1.5,
                    }}
                  >
                    <span
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        flexShrink: 0,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(212,175,55,0.18)",
                        color: "#B08A2E",
                        fontWeight: 700,
                        fontSize: "0.72rem",
                        marginTop: "1px",
                      }}
                    >
                      ✓
                    </span>
                    <div>
                      <span style={{ fontWeight: 600, color: "var(--ink)" }}>{b.title}</span>
                      <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "0.78rem", marginTop: "0.1rem" }}>
                        {b.body}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginTop: "0.3rem" }}>
                <Link
                  href={UPGRADE_URL}
                  style={{
                    flex: "1 1 auto",
                    textAlign: "center",
                    background: "var(--night)",
                    color: "var(--parchment)",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    padding: "0.7rem 1rem",
                    borderRadius: "10px",
                    textDecoration: "none",
                    letterSpacing: "0.02em",
                  }}
                >
                  Upgrade to Homestead — $21.99/mo
                </Link>
                <Link
                  href="/pricing"
                  style={{
                    flex: "0 0 auto",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    padding: "0.7rem 1rem",
                    borderRadius: "10px",
                    textDecoration: "none",
                    color: "var(--night)",
                    background: "transparent",
                    border: "1px solid rgba(11,46,74,0.2)",
                  }}
                >
                  Compare plans
                </Link>
              </div>

              <p style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", textAlign: "center", margin: 0 }}>
                Already upgraded? <a href="/sign-in" style={{ color: "var(--accent-primary)", textDecoration: "none", fontWeight: 500 }}>Sign out and back in</a>
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {children.map((child) => (
                <div key={child.id} style={frostCard} className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 style={{ fontWeight: 600, color: "#0B2E4A" }}>{child.name}</h3>
                      <span style={{ ...frostPillBase, color: "#6E6E9E" }}>Grade {child.gradeLevel}</span>
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "#767676", marginTop: "0.2rem" }}>
                      Standards tracking: {child.standardsOptIn ? "on" : "off"}
                    </p>
                    {child.learningNotes && (
                      <p style={{ fontSize: "0.8rem", color: "#767676", marginTop: "0.1rem", fontStyle: "italic" }}>
                        {child.learningNotes.length > 60 ? child.learningNotes.slice(0, 60) + "…" : child.learningNotes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => handleEdit(child)}
                      style={{ fontSize: "0.875rem", color: "#6E6E9E", background: "none", border: "none", cursor: "pointer" }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(child.id)}
                      style={{ fontSize: "0.875rem", color: "#9B7E8E", background: "none", border: "none", cursor: "pointer" }}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              {showAdd ? (
                <div style={frostCard} className="space-y-4">
                  <h2 className="font-cormorant-sc" style={{ fontSize: "1.1rem", color: "#0B2E4A" }}>
                    {editing ? "Edit Child" : "Add Child"}
                  </h2>
                  <div>
                    <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#5A5A5A", marginBottom: "0.25rem" }}>Name</label>
                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      style={formInput} placeholder="Child's name or nickname" />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#5A5A5A", marginBottom: "0.25rem" }}>Date of Birth</label>
                    <input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} style={formInput} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#5A5A5A", marginBottom: "0.25rem" }}>Grade Level</label>
                    <p style={{ fontSize: "0.75rem", color: "#767676", marginBottom: "0.25rem" }}>This may not match their age — choose what fits your child.</p>
                    <select value={form.gradeLevel} onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })} style={formInput}>
                      {GRADES.map((g) => <option key={g} value={g}>{g === "K" ? "Kindergarten" : `Grade ${g}`}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center gap-2" style={{ fontSize: "0.875rem", cursor: "pointer" }}>
                      <input type="checkbox" checked={form.standardsOptIn}
                        onChange={(e) => setForm({ ...form, standardsOptIn: e.target.checked })} />
                      <span style={{ color: "#5A5A5A" }}>Track state standards</span>
                    </label>
                    <p style={{ fontSize: "0.75rem", color: "#767676", marginTop: "0.25rem", marginLeft: "1.5rem" }}>
                      Lessons will align with your state&apos;s learning objectives and progress will be tracked.
                    </p>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#5A5A5A", marginBottom: "0.25rem" }}>
                      Learning notes <span style={{ fontWeight: 400, color: "#767676" }}>(optional)</span>
                    </label>
                    <p style={{ fontSize: "0.75rem", color: "#767676", marginBottom: "0.35rem" }}>
                      Describe how this child learns best — preferences, accommodations, or anything the lesson generator should keep in mind.
                    </p>
                    <textarea
                      value={form.learningNotes}
                      onChange={(e) => setForm({ ...form, learningNotes: e.target.value })}
                      rows={3}
                      placeholder="e.g. Learns best with hands-on activities, needs movement breaks, strong visual learner"
                      style={{
                        background: "rgba(255,255,255,0.6)",
                        border: "1px solid rgba(0,0,0,0.1)",
                        borderRadius: "8px",
                        padding: "0.45rem 0.6rem",
                        fontSize: "0.875rem",
                        color: "#0B2E4A",
                        width: "100%",
                        maxWidth: "100%",
                        outline: "none",
                        resize: "vertical",
                      }}
                    />
                  </div>
                  {childError && (
                    <p style={{ fontSize: "0.8rem", color: "#B04040" }}>{childError}</p>
                  )}
                  <div className="flex gap-2">
                    <button onClick={handleSave} disabled={!form.name || !form.dateOfBirth || saving}
                      style={{ ...nightButton, opacity: !form.name || !form.dateOfBirth || saving ? 0.5 : 1 }}>
                      {saving ? "Saving..." : editing ? "Save Changes" : "Add Child"}
                    </button>
                    <button onClick={() => { setShowAdd(false); setEditing(null); resetForm(); setChildError(null); }} style={ghostButton}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : atChildLimit ? (
                <div style={{
                  ...frostCard, width: "100%", border: "1px dashed rgba(110,110,158,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  flexWrap: "wrap", gap: "0.75rem", background: "rgba(255,255,255,0.5)",
                }}>
                  <span style={{ fontSize: "0.8rem", color: "#767676" }}>
                    {tierData!.childrenCount}/{tierData!.childrenLimit} children — limit reached
                  </span>
                  <a href={UPGRADE_URL} style={{
                    fontSize: "0.8rem", fontWeight: 600, color: "#9a7530",
                    padding: "0.35rem 0.85rem", borderRadius: "8px",
                    background: "rgba(196,152,61,0.1)", border: "1px solid rgba(196,152,61,0.25)",
                    textDecoration: "none",
                  }}>
                    Upgrade for more →
                  </a>
                </div>
              ) : (
                <button onClick={() => { resetForm(); setShowAdd(true); }} style={{
                  ...frostCard, width: "100%", border: "1px dashed rgba(110,110,158,0.3)",
                  cursor: "pointer", display: "block", textAlign: "center",
                  fontSize: "0.875rem", color: "#6E6E9E", background: "rgba(255,255,255,0.5)",
                }}>
                  + Add Child
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
