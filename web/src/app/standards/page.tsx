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
      <Shell>
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </Shell>
    );
  }

  if (children.filter((c) => c.standardsOptIn).length === 0) {
    return (
      <Shell>
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-lg font-medium">No children have standards tracking enabled</p>
          <p className="text-sm mt-2">
            Enable it in the{" "}
            <Link href="/children" className="text-blue-600 hover:underline">
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
      <Shell>
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-lg font-medium">Standards tracking is off for {child.name}</p>
          <p className="text-sm mt-2">
            You can enable it in the{" "}
            <Link href="/children" className="text-blue-600 hover:underline">
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
    <Shell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Standards Progress</h1>
            {data && (
              <p className="text-sm text-gray-500 mt-1">
                {data.state} — Grade {data.gradeLevel} — {totalCovered} of {totalStandards} objectives covered
              </p>
            )}
          </div>
          <select
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
            className="border border-gray-200 dark:border-gray-700 rounded px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100"
          >
            {children
              .filter((c) => c.standardsOptIn)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — Grade {c.gradeLevel}
                </option>
              ))}
          </select>
        </div>

        {loadingStandards ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Loading standards...</p>
          </div>
        ) : (
          <>
            {/* Overview cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {progress.map((sp) => {
                const pct = sp.total > 0 ? Math.round((sp.covered / sp.total) * 100) : 0;
                return (
                  <div key={sp.subject} className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800 p-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{sp.subject}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{pct}%</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {sp.covered} of {sp.total} objectives
                    </p>
                    <div className="mt-2 bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-green-500 rounded-full h-2 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detailed checklists */}
            {progress.map((sp) => (
              <div key={sp.subject} className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                  <h2 className="font-medium text-gray-900 dark:text-gray-100">
                    {sp.subject} — {sp.covered}/{sp.total} covered
                  </h2>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {sp.standards.map((std) => (
                    <div
                      key={std.code}
                      className={`p-4 flex items-start gap-3 ${std.covered ? "bg-green-50/50" : ""}`}
                    >
                      <div
                        className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                          std.covered
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-gray-300"
                        }`}
                      >
                        {std.covered && <span className="text-xs">&#10003;</span>}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{std.code}</span>
                          {std.covered && std.lessonTitle && (
                            <span className="text-xs text-green-600">
                              via: {std.lessonTitle}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mt-0.5">{std.description}</p>
                      </div>
                    </div>
                  ))}
                  {sp.standards.length === 0 && (
                    <div className="p-4 text-center text-sm text-gray-400 dark:text-gray-500">
                      No standards found for this subject and grade.
                    </div>
                  )}
                </div>
              </div>
            ))}

            {progress.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No standards data available.</p>
                <p className="text-sm mt-1">Make sure the KG service is running.</p>
              </div>
            )}
          </>
        )}
      </div>
    </Shell>
  );
}
