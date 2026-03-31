"use client";

import { Shell } from "@/components/shell";
import { GRADES, US_STATES } from "@/lib/types";
import { useState, useEffect } from "react";

interface ChildProfile {
  id: string;
  name: string;
  dateOfBirth: string;
  gradeLevel: string;
  standardsOptIn: boolean;
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

const nightButton: React.CSSProperties = {
  background: "#0B2E4A",
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

export default function ChildrenPage() {
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [state, setState] = useState("MI");
  const [, setSavingState] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Omit<ChildProfile, "id">>({
    name: "",
    dateOfBirth: "",
    gradeLevel: "K",
    standardsOptIn: true,
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/children").then((r) => r.json()),
      fetch("/api/user").then((r) => r.json()),
    ]).then(([childrenData, userData]) => {
      setChildren(
        childrenData.map((c: { id: string; name: string; dateOfBirth: string; gradeLevel: string; standardsOptIn: boolean }) => ({
          ...c,
          dateOfBirth: c.dateOfBirth.split("T")[0],
        }))
      );
      if (userData.state) setState(userData.state);
      setLoading(false);
    });
  }, []);

  const resetForm = () => {
    setForm({ name: "", dateOfBirth: "", gradeLevel: "K", standardsOptIn: true });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        const res = await fetch(`/api/children/${editing}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const updated = await res.json();
        setChildren((prev) =>
          prev.map((c) =>
            c.id === editing
              ? { ...updated, dateOfBirth: updated.dateOfBirth.split("T")[0] }
              : c
          )
        );
        setEditing(null);
      } else {
        const res = await fetch("/api/children", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const created = await res.json();
        setChildren((prev) => [
          ...prev,
          { ...created, dateOfBirth: created.dateOfBirth.split("T")[0] },
        ]);
        setShowAdd(false);
      }
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (child: ChildProfile) => {
    setForm({
      name: child.name,
      dateOfBirth: child.dateOfBirth,
      gradeLevel: child.gradeLevel,
      standardsOptIn: child.standardsOptIn,
    });
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

  return (
    <Shell hue="children">
      <div className="space-y-6">
        <h1 className="font-cormorant-sc text-3xl" style={{ color: "#0B2E4A" }}>
          Children &amp; Settings
        </h1>

        {/* State selection (account-level) */}
        <div style={frostCard}>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#5A5A5A", marginBottom: "0.25rem" }}>
            Your State
          </label>
          <p style={{ fontSize: "0.75rem", color: "#767676", marginBottom: "0.5rem" }}>
            Used for state standards. Applies to all children.
          </p>
          <select
            value={state}
            onChange={(e) => {
              const newState = e.target.value;
              setState(newState);
              setSavingState(true);
              fetch("/api/user", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ state: newState }),
              }).finally(() => setSavingState(false));
            }}
            style={{ ...formInput }}
          >
            {US_STATES.map((s) => (
              <option key={s.abbr} value={s.abbr}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Children list */}
        <div className="space-y-3">
          {children.map((child) => (
            <div
              key={child.id}
              style={frostCard}
              className="flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 style={{ fontWeight: 600, color: "#0B2E4A" }}>{child.name}</h3>
                  <span style={{ ...frostPillBase, color: "#6E6E9E" }}>Grade {child.gradeLevel}</span>
                </div>
                <p style={{ fontSize: "0.875rem", color: "#5A5A5A", marginTop: "0.25rem" }}>
                  Born {child.dateOfBirth}
                </p>
                <p style={{ fontSize: "0.875rem", color: "#767676" }}>
                  State standards: {child.standardsOptIn ? "Opted in" : "Opted out"}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleEdit(child)}
                  style={{ fontSize: "0.875rem", color: "#6E6E9E", background: "none", border: "none", cursor: "pointer" }}
                  className="hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(child.id)}
                  style={{ fontSize: "0.875rem", color: "#9B7E8E", background: "none", border: "none", cursor: "pointer" }}
                  className="hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add/Edit form */}
        {showAdd ? (
          <div style={frostCard} className="space-y-4">
            <h2 className="font-cormorant-sc" style={{ fontSize: "1.1rem", color: "#0B2E4A" }}>
              {editing ? "Edit Child" : "Add Child"}
            </h2>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#5A5A5A", marginBottom: "0.25rem" }}>
                Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={formInput}
                placeholder="Child's name or nickname"
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#5A5A5A", marginBottom: "0.25rem" }}>
                Date of Birth
              </label>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                style={formInput}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#5A5A5A", marginBottom: "0.25rem" }}>
                Grade Level
              </label>
              <p style={{ fontSize: "0.75rem", color: "#767676", marginBottom: "0.25rem" }}>
                This may not match their age — choose what fits your child.
              </p>
              <select
                value={form.gradeLevel}
                onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })}
                style={formInput}
              >
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g === "K" ? "Kindergarten" : `Grade ${g}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2" style={{ fontSize: "0.875rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={form.standardsOptIn}
                  onChange={(e) => setForm({ ...form, standardsOptIn: e.target.checked })}
                  style={{ borderRadius: "4px" }}
                />
                <span style={{ color: "#5A5A5A" }}>Track state standards</span>
              </label>
              <p style={{ fontSize: "0.75rem", color: "#767676", marginTop: "0.25rem", marginLeft: "1.5rem" }}>
                When enabled, lessons will align with your state&apos;s learning objectives
                and you can track which ones your child has covered.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={!form.name || !form.dateOfBirth || saving}
                style={{ ...nightButton, opacity: !form.name || !form.dateOfBirth || saving ? 0.5 : 1, cursor: !form.name || !form.dateOfBirth || saving ? "not-allowed" : "pointer" }}
              >
                {saving ? "Saving..." : editing ? "Save Changes" : "Add Child"}
              </button>
              <button
                onClick={() => { setShowAdd(false); setEditing(null); resetForm(); }}
                style={ghostButton}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => { resetForm(); setShowAdd(true); }}
            style={{
              ...frostCard,
              width: "100%",
              border: "1px dashed rgba(110,110,158,0.3)",
              cursor: "pointer",
              display: "block",
              textAlign: "center",
              fontSize: "0.875rem",
              color: "#6E6E9E",
              background: "rgba(255,255,255,0.5)",
            }}
          >
            + Add Child
          </button>
        )}
      </div>
    </Shell>
  );
}
