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

export default function ChildrenPage() {
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [state, setState] = useState("MI");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Omit<ChildProfile, "id">>({
    name: "",
    dateOfBirth: "",
    gradeLevel: "K",
    standardsOptIn: true,
  });

  useEffect(() => {
    fetch("/api/children?userId=demo-user")
      .then((r) => r.json())
      .then((data) => {
        setChildren(
          data.map((c: { id: string; name: string; dateOfBirth: string; gradeLevel: string; standardsOptIn: boolean }) => ({
            ...c,
            dateOfBirth: c.dateOfBirth.split("T")[0],
          }))
        );
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
          body: JSON.stringify({ ...form, userId: "demo-user" }),
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
      <Shell>
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Loading...</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Children & Settings</h1>

        {/* State selection (account-level) */}
        <div className="bg-white rounded border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your State
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Used for state standards. Applies to all children.
          </p>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm w-full max-w-xs text-gray-900"
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
            <div key={child.id} className="bg-white rounded border border-gray-200 p-4 flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{child.name}</h3>
                <p className="text-sm text-gray-500">
                  Born {child.dateOfBirth} — Grade {child.gradeLevel}
                </p>
                <p className="text-sm text-gray-500">
                  State standards: {child.standardsOptIn ? "Opted in" : "Opted out"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(child)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(child.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add/Edit form */}
        {showAdd ? (
          <div className="bg-white rounded border border-gray-200 p-4 space-y-4">
            <h2 className="font-medium text-gray-900">
              {editing ? "Edit Child" : "Add Child"}
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="border border-gray-300 rounded px-3 py-2 text-sm w-full max-w-xs text-gray-900"
                placeholder="Child's name or nickname"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                className="border border-gray-300 rounded px-3 py-2 text-sm w-full max-w-xs text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
              <p className="text-xs text-gray-500 mb-1">
                This may not match their age — choose what fits your child.
              </p>
              <select
                value={form.gradeLevel}
                onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })}
                className="border border-gray-300 rounded px-3 py-2 text-sm w-full max-w-xs text-gray-900"
              >
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g === "K" ? "Kindergarten" : `Grade ${g}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.standardsOptIn}
                  onChange={(e) => setForm({ ...form, standardsOptIn: e.target.checked })}
                  className="rounded"
                />
                <span className="text-gray-700">Track state standards</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                When enabled, lessons will align with your state&apos;s learning objectives
                and you can track which ones your child has covered.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={!form.name || !form.dateOfBirth || saving}
                className="px-4 py-2 bg-gray-900 text-white rounded text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : editing ? "Save Changes" : "Add Child"}
              </button>
              <button
                onClick={() => { setShowAdd(false); setEditing(null); resetForm(); }}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => { resetForm(); setShowAdd(true); }}
            className="px-4 py-2 bg-white border border-dashed border-gray-300 text-gray-600 rounded text-sm hover:border-gray-400 w-full"
          >
            + Add Child
          </button>
        )}
      </div>
    </Shell>
  );
}
