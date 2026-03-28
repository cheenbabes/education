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

const PHILOSOPHY_COLORS: Record<string, string> = {
  classical: "#5B5E8A",
  charlotte_mason: "#B07A8A",
  waldorf: "#C4983D",
  montessori: "#7D6B9E",
  project_based: "#5A7FA0",
  place_nature: "#5A947A",
  unschooling: "#C07A42",
  adaptive: "#8A8A7E",
};

function getPhilosophyColor(philosophy: string): string {
  return PHILOSOPHY_COLORS[philosophy] ?? "#6E6E9E";
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
};

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
      <Shell hue="lessons">
        <div className="flex items-center justify-center py-12">
          <p style={{ color: "#5A5A5A" }}>Loading...</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell hue="lessons">
      <div className="space-y-4">
        <h1 className="font-cormorant-sc text-3xl" style={{ color: "#0B2E4A" }}>
          All Lessons
        </h1>

        {/* Filter row */}
        <div className="flex gap-4 flex-wrap items-center">
          <div className="flex gap-1">
            {(["all", "pending", "completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={
                  filter === f
                    ? { ...frostPillBase, background: "#0B2E4A", color: "#F9F6EF", border: "1px solid #0B2E4A" }
                    : frostPillBase
                }
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Child filter */}
          <div style={{ position: "relative" }}>
            <select
              value={childFilter}
              onChange={(e) => setChildFilter(e.target.value)}
              style={{
                ...frostPillBase,
                paddingRight: "1.4rem",
                appearance: "none",
                cursor: "pointer",
                color: "#0B2E4A",
              }}
            >
              <option value="all">All children</option>
              {children.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Lesson list */}
        <div className="space-y-2">
          {filtered.map((lesson) => {
            const isCompleted = lesson.completions.length > 0;
            const rating = lesson.completions[0]?.starRating;
            const philoColor = getPhilosophyColor(lesson.philosophy);
            return (
              <Link
                key={lesson.id}
                href={`/lessons/${lesson.id}`}
                style={{ display: "block", textDecoration: "none" }}
              >
                <div
                  style={{
                    ...frostCard,
                    transition: "box-shadow 0.15s, transform 0.15s",
                  }}
                  className="hover-frost-card"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium" style={{ color: "#0B2E4A" }}>{lesson.title}</p>
                        {isCompleted && (
                          <span
                            style={{
                              ...frostPillBase,
                              color: "#5A947A",
                              background: "rgba(122,158,138,0.15)",
                              border: "1px solid rgba(122,158,138,0.3)",
                            }}
                          >
                            Done
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {/* Philosophy badge */}
                        <span
                          style={{
                            ...frostPillBase,
                            color: philoColor,
                          }}
                        >
                          {lesson.philosophy.replace(/_/g, " ")}
                        </span>
                        {/* Subject tags */}
                        {lesson.subjects.map((s) => (
                          <span
                            key={s}
                            style={{
                              ...frostPillBase,
                              color: "#6E6E9E",
                            }}
                          >
                            {s}
                          </span>
                        ))}
                        {/* Interest tag */}
                        <span
                          style={{
                            ...frostPillBase,
                            color: "#9B7E8E",
                          }}
                        >
                          {lesson.interest}
                        </span>
                        {/* Children tags */}
                        {lesson.lessonChildren.map((lc) => (
                          <span
                            key={lc.child.id}
                            style={{
                              ...frostPillBase,
                              color: "#5A5A5A",
                            }}
                          >
                            {lc.child.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <p style={{ fontSize: "0.75rem", color: "#767676" }}>{lesson.createdAt.split("T")[0]}</p>
                      {rating && (
                        <div className="flex gap-0.5 justify-end mt-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span key={s} style={{ fontSize: "0.875rem", color: s <= rating ? "#C4983D" : "rgba(0,0,0,0.12)" }}>★</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-10 text-center">
              <p
                className="font-cormorant-sc"
                style={{ fontSize: "1.25rem", color: "#767676", fontStyle: "italic" }}
              >
                No lessons match your filters.
              </p>
            </div>
          )}
        </div>

        {/* Night button CTA */}
        <div className="flex justify-end pt-2">
          <Link href="/generate">
            <button style={nightButton} className="text-sm font-medium">
              + Generate Lesson
            </button>
          </Link>
        </div>
      </div>

      <style>{`
        .hover-frost-card:hover {
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          transform: translateY(-1px);
        }
      `}</style>
    </Shell>
  );
}
