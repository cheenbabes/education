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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <Link
            href="/generate"
            className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 text-sm"
          >
            Generate Lesson
          </Link>
        </div>

        {/* Children summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {children.map((child) => (
            <div key={child.id} className="bg-white rounded border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{child.name}</h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  Grade {child.gradeLevel}
                </span>
              </div>
              <p className="text-sm text-gray-600">Age {getAge(child.dateOfBirth)}</p>
              <p className="text-sm text-gray-500 mt-1">
                Standards: {child.standardsOptIn ? "Tracking" : "Not tracking"}
              </p>
              {child.standardsOptIn && (
                <Link href={`/standards?child=${child.id}`} className="text-sm text-blue-600 hover:underline mt-2 block">
                  View progress
                </Link>
              )}
            </div>
          ))}
          <Link
            href="/children"
            className="bg-white rounded border border-dashed border-gray-300 p-4 flex items-center justify-center text-gray-500 hover:border-gray-400 hover:text-gray-600"
          >
            + Add child
          </Link>
        </div>

        {/* Upcoming lessons */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Lessons</h2>
            <Link href="/calendar" className="text-sm text-blue-600 hover:underline">
              View calendar
            </Link>
          </div>
          <div className="bg-white rounded border border-gray-200 divide-y divide-gray-100">
            {upcoming.length === 0 && (
              <div className="p-4 text-center text-gray-500 text-sm">
                No upcoming lessons scheduled. <Link href="/generate" className="text-blue-600 hover:underline">Generate one</Link>
              </div>
            )}
            {upcoming.map((lesson) => (
              <Link
                key={lesson.id}
                href={`/lessons/${lesson.id}`}
                className="block p-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{lesson.title}</p>
                    <div className="flex gap-2 mt-1">
                      {lesson.subjects.map((s) => (
                        <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                          {s}
                        </span>
                      ))}
                      {lesson.lessonChildren.map((lc) => (
                        <span key={lc.child.name} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
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

        {/* Recent completions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Completions</h2>
          <div className="bg-white rounded border border-gray-200 divide-y divide-gray-100">
            {recentCompletions.length === 0 && (
              <div className="p-4 text-center text-gray-500 text-sm">
                No completed lessons yet.
              </div>
            )}
            {recentCompletions.map((completion, idx) => (
              <div key={`${completion.id}-${idx}`} className="p-4 flex items-center justify-between">
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}
