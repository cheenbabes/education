"use client";

import { Shell } from "@/components/shell";
import Link from "next/link";
import { useState, useEffect } from "react";

interface LessonData {
  id: string;
  title: string;
  interest: string;
  subjects: string[];
  philosophy: string;
  lessonChildren: { child: { id: string; name: string } }[];
  completions: { starRating: number }[];
  createdAt: string;
}

interface ChildData {
  id: string;
  name: string;
}

export default function LessonsPage() {
  const [lessons, setLessons] = useState<LessonData[]>([]);
  const [children, setChildren] = useState<ChildData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [childFilter, setChildFilter] = useState<string>("all");

  useEffect(() => {
    Promise.all([
      fetch("/api/lessons?userId=demo-user").then((r) => r.json()),
      fetch("/api/children?userId=demo-user").then((r) => r.json()),
    ]).then(([lessonsData, childrenData]) => {
      setLessons(lessonsData);
      setChildren(childrenData);
      setLoading(false);
    });
  }, []);

  const filtered = lessons.filter((l) => {
    const isCompleted = l.completions.length > 0;
    if (filter === "pending" && isCompleted) return false;
    if (filter === "completed" && !isCompleted) return false;
    if (childFilter !== "all") {
      const hasChild = l.lessonChildren.some((lc) => lc.child.id === childFilter);
      if (!hasChild) return false;
    }
    return true;
  });

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
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">All Lessons</h1>

        <div className="flex gap-4">
          <div className="flex gap-1">
            {(["all", "pending", "completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-sm rounded ${
                  filter === f ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <select
            value={childFilter}
            onChange={(e) => setChildFilter(e.target.value)}
            className="border border-gray-200 rounded px-3 py-1.5 text-sm text-gray-900"
          >
            <option value="all">All children</option>
            {children.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded border border-gray-200 divide-y divide-gray-100">
          {filtered.map((lesson) => {
            const isCompleted = lesson.completions.length > 0;
            const rating = lesson.completions[0]?.starRating;
            return (
              <Link
                key={lesson.id}
                href={`/lessons/${lesson.id}`}
                className="block p-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{lesson.title}</p>
                      {isCompleted && (
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Done</span>
                      )}
                    </div>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {lesson.subjects.map((s) => (
                        <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{s}</span>
                      ))}
                      <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded">{lesson.interest}</span>
                      {lesson.lessonChildren.map((lc) => (
                        <span key={lc.child.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{lc.child.name}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{lesson.createdAt.split("T")[0]}</p>
                    {rating && (
                      <div className="flex gap-0.5 justify-end mt-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <span key={s} className={`text-sm ${s <= rating ? "text-yellow-400" : "text-gray-200"}`}>★</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No lessons match your filters.
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
