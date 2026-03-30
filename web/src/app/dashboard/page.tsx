"use client";

import { Shell } from "@/components/shell";
import Link from "next/link";
import { useState, useEffect } from "react";

interface Child {
  id: string;
  name: string;
  gradeLevel: string;
  dateOfBirth: string;
  standardsOptIn: boolean;
}

interface LessonData {
  id: string;
  title: string;
  subjects: string[];
  interest: string;
  lessonChildren: { child: { name: string } }[];
  calendarEntries: { scheduledDate: string }[];
  completions: { childId: string; starRating: number; completedAt: string; child: { name: string } }[];
  createdAt: string;
}

const frostCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.5)",
  borderRadius: "12px",
  padding: "1.25rem",
};

const frostPill: React.CSSProperties = {
  background: "rgba(255,255,255,0.68)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255,255,255,0.45)",
  borderRadius: "6px",
  fontSize: "0.7rem",
  padding: "0.25rem 0.6rem",
  fontWeight: 500,
};

const nightButton: React.CSSProperties = {
  background: "#0B2E4A",
  color: "#F9F6EF",
  borderRadius: "10px",
  padding: "0.6rem 1.4rem",
  fontSize: "0.85rem",
};

export default function DashboardPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [lessons, setLessons] = useState<LessonData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/children?userId=demo-user").then((r) => r.json()),
      fetch("/api/lessons?userId=demo-user").then((r) => r.json()),
    ]).then(([childrenData, lessonsData]) => {
      setChildren(childrenData);
      setLessons(lessonsData);
      setLoading(false);
    });
  }, []);

  // Upcoming: lessons with calendar entries in the future (or today) that have no completions
  const today = new Date().toISOString().split("T")[0];
  const upcoming = lessons
    .filter((l) => {
      const entry = l.calendarEntries[0];
      if (!entry) return false;
      const date = entry.scheduledDate.split("T")[0];
      return date >= today && l.completions.length === 0;
    })
    .sort((a, b) => {
      const dateA = a.calendarEntries[0]?.scheduledDate || "";
      const dateB = b.calendarEntries[0]?.scheduledDate || "";
      return dateA.localeCompare(dateB);
    })
    .slice(0, 5);

  // Missed: past scheduled date, no completions
  const missed = lessons
    .filter((l) => {
      const entry = l.calendarEntries[0];
      if (!entry) return false;
      const date = entry.scheduledDate.split("T")[0];
      return date < today && l.completions.length === 0;
    })
    .sort((a, b) => {
      const dateA = a.calendarEntries[0]?.scheduledDate || "";
      const dateB = b.calendarEntries[0]?.scheduledDate || "";
      return dateB.localeCompare(dateA); // most recent missed first
    })
    .slice(0, 5);

  // Recent completions: lessons that have at least one completion, most recent first
  const recentCompletions = lessons
    .flatMap((l) =>
      l.completions.map((c) => ({
        id: l.id,
        title: l.title,
        childName: c.child?.name || "Unknown",
        rating: c.starRating,
        completedAt: c.completedAt.split("T")[0],
      }))
    )
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .slice(0, 5);

  // Compute age from dateOfBirth
  const getAge = (dob: string) => {
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  };

  if (loading) {
    return (
      <Shell hue="dashboard">
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Loading...</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell hue="dashboard">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-cormorant-sc text-3xl text-gray-900">Dashboard</h1>
          <Link
            href="/create"
            style={nightButton}
          >
            Create Lesson
          </Link>
        </div>

        {/* Children summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {children.map((child) => (
            <div key={child.id} style={frostCard}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{child.name}</h3>
                <span style={{ ...frostPill, color: "#6E6E9E" }}>
                  Grade {child.gradeLevel}
                </span>
              </div>
              <p className="text-sm text-gray-600">Age {getAge(child.dateOfBirth)}</p>
              <p className="text-sm text-gray-500 mt-1">
                Standards: {child.standardsOptIn ? "Tracking" : "Not tracking"}
              </p>
              {child.standardsOptIn && (
                <Link
                  href={`/standards?child=${child.id}`}
                  className="text-sm hover:underline mt-2 block"
                  style={{ color: "#6E6E9E" }}
                >
                  View progress
                </Link>
              )}
            </div>
          ))}
          <Link
            href="/children"
            className="rounded flex items-center justify-center text-gray-500 hover:text-gray-600"
            style={{
              background: "rgba(255,255,255,0.4)",
              border: "1px dashed rgba(255,255,255,0.6)",
              borderRadius: "12px",
              padding: "1.25rem",
            }}
          >
            + Add child
          </Link>
        </div>

        {/* Upcoming lessons */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-cormorant-sc text-xl text-gray-900">Upcoming Lessons</h2>
            <Link
              href="/calendar"
              className="text-sm hover:underline"
              style={{ color: "#6E6E9E" }}
            >
              View calendar
            </Link>
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.72)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.5)",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            {upcoming.length === 0 && (
              <div className="p-4 text-center text-gray-500 text-sm">
                No upcoming lessons scheduled.{" "}
                <Link href="/create" className="hover:underline" style={{ color: "#6E6E9E" }}>
                  Create one
                </Link>
              </div>
            )}
            {upcoming.map((lesson, idx) => (
              <Link
                key={lesson.id}
                href={`/lessons/${lesson.id}`}
                className="block p-4 hover:bg-white/30 transition-colors"
                style={idx > 0 ? { borderTop: "1px solid rgba(0,0,0,0.06)" } : {}}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{lesson.title}</p>
                    <div className="flex gap-2 mt-1">
                      {lesson.subjects.map((s) => (
                        <span key={s} style={{ ...frostPill, color: "#6E6E9E" }}>
                          {s}
                        </span>
                      ))}
                      {lesson.lessonChildren.map((lc) => (
                        <span key={lc.child.name} style={frostPill}>
                          {lc.child.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {lesson.calendarEntries[0]?.scheduledDate.split("T")[0]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Needs attention — past due, not completed */}
        {missed.length > 0 && (
          <div>
            <h2 className="font-cormorant-sc text-xl text-gray-900 mb-3">Needs Attention</h2>
            <div
              style={{
                background: "rgba(255,255,255,0.72)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(196,152,61,0.2)",
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              {missed.map((lesson, idx) => {
                const date = lesson.calendarEntries[0]?.scheduledDate.split("T")[0] || "";
                const daysAgo = Math.floor((new Date(today).getTime() - new Date(date).getTime()) / 86400000);
                return (
                  <Link
                    href={`/lessons/${lesson.id}`}
                    key={lesson.id}
                    className="p-4 flex items-center justify-between hover:bg-white/40 transition-colors"
                    style={{ display: "flex", textDecoration: "none", ...(idx > 0 ? { borderTop: "1px solid rgba(0,0,0,0.06)" } : {}) }}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{lesson.title}</p>
                      <p className="text-sm text-gray-500">
                        Scheduled {date} — {daysAgo === 1 ? "yesterday" : `${daysAgo} days ago`}
                      </p>
                    </div>
                    <span style={{
                      fontSize: "0.7rem",
                      fontWeight: 500,
                      padding: "0.2rem 0.6rem",
                      borderRadius: "6px",
                      background: "rgba(196,152,61,0.1)",
                      color: "#B08A2E",
                      whiteSpace: "nowrap",
                    }}>
                      Not completed
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent completions */}
        <div>
          <h2 className="font-cormorant-sc text-xl text-gray-900 mb-3">Recent Completions</h2>
          <div
            style={{
              background: "rgba(255,255,255,0.72)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.5)",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            {recentCompletions.length === 0 && (
              <div className="p-4 text-center text-gray-500 text-sm">
                No completed lessons yet.
              </div>
            )}
            {recentCompletions.map((completion, idx) => (
              <Link
                href={`/lessons/${completion.id}`}
                key={`${completion.id}-${idx}`}
                className="p-4 flex items-center justify-between hover:bg-white/40 transition-colors"
                style={{ display: "flex", textDecoration: "none", ...(idx > 0 ? { borderTop: "1px solid rgba(0,0,0,0.06)" } : {}) }}
              >
                <div>
                  <p className="font-medium text-gray-900">{completion.title}</p>
                  <p className="text-sm text-gray-500">{completion.childName} — {completion.completedAt}</p>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={star <= completion.rating ? "text-yellow-400" : "text-gray-200"}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}
