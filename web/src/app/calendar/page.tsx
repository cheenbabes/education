"use client";

import { Shell } from "@/components/shell";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";

interface CalendarLesson {
  id: string;
  title: string;
  subjects: string[];
  children: string[];
  completed: boolean;
  rating?: number;
}

interface LessonData {
  id: string;
  title: string;
  subjects: string[];
  lessonChildren: { child: { name: string } }[];
  completions: { starRating: number }[];
  calendarEntries: { scheduledDate: string }[];
}

function getWeekDates(date: Date): Date[] {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay()); // Sunday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
  cursor: "pointer",
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
  textDecoration: "none",
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"week" | "month">("week");
  const [lessonsByDate, setLessonsByDate] = useState<Record<string, CalendarLesson[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/lessons?userId=demo-user")
      .then((r) => r.json())
      .then((lessons: LessonData[]) => {
        const byDate: Record<string, CalendarLesson[]> = {};
        for (const lesson of lessons) {
          for (const entry of lesson.calendarEntries) {
            const date = entry.scheduledDate.split("T")[0];
            if (!byDate[date]) byDate[date] = [];
            byDate[date].push({
              id: lesson.id,
              title: lesson.title,
              subjects: lesson.subjects,
              children: lesson.lessonChildren.map((lc) => lc.child.name),
              completed: lesson.completions.length > 0,
              rating: lesson.completions[0]?.starRating,
            });
          }
        }
        setLessonsByDate(byDate);
        setLoading(false);
      });
  }, []);

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  const monthDates = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    const dates: Date[] = [];
    const current = new Date(startDate);
    while (current <= lastDay || current.getDay() !== 0) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
      if (dates.length > 42) break;
    }
    return dates;
  }, [currentDate]);

  const navigateWeek = (dir: number) => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + dir * 7);
      return next;
    });
  };

  const navigateMonth = (dir: number) => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + dir);
      return next;
    });
  };

  const today = formatDate(new Date());

  if (loading) {
    return (
      <Shell hue="calendar">
        <div className="flex items-center justify-center py-12">
          <p style={{ color: "#5A5A5A" }}>Loading...</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell hue="calendar">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="font-cormorant-sc text-3xl" style={{ color: "#0B2E4A" }}>Calendar</h1>
          <div className="flex gap-1.5">
            <button
              onClick={() => setView("week")}
              style={
                view === "week"
                  ? { ...frostPillBase, background: "#0B2E4A", color: "#F9F6EF", border: "1px solid #0B2E4A", fontSize: "0.8rem", padding: "0.35rem 0.8rem" }
                  : { ...frostPillBase, fontSize: "0.8rem", padding: "0.35rem 0.8rem", color: "#5A5A5A" }
              }
            >
              Week
            </button>
            <button
              onClick={() => setView("month")}
              style={
                view === "month"
                  ? { ...frostPillBase, background: "#0B2E4A", color: "#F9F6EF", border: "1px solid #0B2E4A", fontSize: "0.8rem", padding: "0.35rem 0.8rem" }
                  : { ...frostPillBase, fontSize: "0.8rem", padding: "0.35rem 0.8rem", color: "#5A5A5A" }
              }
            >
              Month
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => (view === "week" ? navigateWeek(-1) : navigateMonth(-1))}
            style={frostPillBase}
          >
            &larr; Previous
          </button>
          <h2 className="font-cormorant-sc" style={{ fontSize: "1.1rem", color: "#0B2E4A" }}>
            {view === "week"
              ? `${weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} — ${weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
              : currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h2>
          <button
            onClick={() => (view === "week" ? navigateWeek(1) : navigateMonth(1))}
            style={frostPillBase}
          >
            Next &rarr;
          </button>
        </div>

        {/* Week View */}
        {view === "week" && (
          <div className="grid grid-cols-7 gap-2">
            {weekDates.map((date) => {
              const dateStr = formatDate(date);
              const lessons = lessonsByDate[dateStr] || [];
              const isToday = dateStr === today;

              return (
                <div
                  key={dateStr}
                  style={{
                    background: lessons.length > 0 ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.35)",
                    backdropFilter: "blur(12px)",
                    border: isToday ? "1px solid rgba(110,110,158,0.4)" : "1px solid rgba(255,255,255,0.5)",
                    borderRadius: "10px",
                    padding: "0.6rem",
                    minHeight: "10rem",
                    boxShadow: lessons.length > 0 ? "0 2px 10px rgba(0,0,0,0.04)" : "none",
                  }}
                >
                  <div className="text-center mb-2">
                    <p
                      style={{
                        fontSize: "0.65rem",
                        color: "#767676",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        fontVariantCaps: "small-caps",
                      }}
                    >
                      {DAY_NAMES[date.getDay()]}
                    </p>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        color: isToday ? "#6E6E9E" : "#0B2E4A",
                      }}
                    >
                      {date.getDate()}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    {lessons.map((lesson) => (
                      <Link
                        key={lesson.id}
                        href={`/lessons/${lesson.id}`}
                        style={{
                          display: "block",
                          padding: "0.375rem 0.5rem",
                          borderRadius: "6px",
                          fontSize: "0.7rem",
                          textDecoration: "none",
                          background: lesson.completed
                            ? "rgba(122,158,138,0.15)"
                            : "rgba(255,255,255,0.72)",
                          border: isToday
                            ? "1px solid rgba(255,255,255,0.5)"
                            : "1px solid rgba(255,255,255,0.5)",
                          borderLeft: isToday ? "3px solid #6E6E9E" : lesson.completed ? "3px solid #7A9E8A" : "1px solid rgba(255,255,255,0.5)",
                          backdropFilter: "blur(8px)",
                        }}
                      >
                        <p style={{ fontWeight: 500, color: "#0B2E4A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {lesson.title}
                        </p>
                        <div className="flex gap-1 mt-0.5 flex-wrap">
                          {lesson.children.map((c) => (
                            <span key={c} style={{ color: "#767676", fontSize: "0.65rem" }}>{c}</span>
                          ))}
                        </div>
                        {lesson.completed && lesson.rating && (
                          <div className="flex gap-0.5 mt-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <span key={s} style={{ fontSize: "0.625rem", color: s <= lesson.rating! ? "#C4983D" : "rgba(0,0,0,0.12)" }}>★</span>
                            ))}
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Month View */}
        {view === "month" && (
          <div>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-px" style={{ background: "rgba(255,255,255,0.3)", borderRadius: "10px 10px 0 0", marginBottom: "1px" }}>
              {DAY_NAMES.map((day) => (
                <div
                  key={day}
                  style={{
                    textAlign: "center",
                    padding: "0.5rem 0",
                    fontSize: "0.65rem",
                    color: "#767676",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    fontVariantCaps: "small-caps",
                    background: "rgba(255,255,255,0.55)",
                  }}
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px" style={{ background: "rgba(0,0,0,0.04)", borderRadius: "0 0 10px 10px" }}>
              {monthDates.map((date) => {
                const dateStr = formatDate(date);
                const lessons = lessonsByDate[dateStr] || [];
                const isToday = dateStr === today;
                const isCurrentMonth = date.getMonth() === currentDate.getMonth();

                return (
                  <div
                    key={dateStr}
                    style={{
                      background: isToday ? "rgba(110,110,158,0.08)" : "rgba(255,255,255,0.6)",
                      padding: "0.5rem",
                      minHeight: "5rem",
                      opacity: isCurrentMonth ? 1 : 0.4,
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.75rem",
                        marginBottom: "0.25rem",
                        color: isToday ? "#6E6E9E" : "#767676",
                        fontWeight: isToday ? 600 : 400,
                      }}
                    >
                      {date.getDate()}
                    </p>
                    {lessons.map((lesson) => (
                      <Link
                        key={lesson.id}
                        href={`/lessons/${lesson.id}`}
                        style={{
                          display: "block",
                          fontSize: "0.625rem",
                          padding: "0.2rem 0.375rem",
                          borderRadius: "4px",
                          marginBottom: "0.125rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          textDecoration: "none",
                          background: lesson.completed
                            ? "rgba(122,158,138,0.15)"
                            : "rgba(255,255,255,0.72)",
                          color: lesson.completed ? "#5A947A" : "#6E6E9E",
                          border: "1px solid rgba(255,255,255,0.5)",
                        }}
                      >
                        {lesson.title}
                      </Link>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-center pt-2">
          <Link href="/create" style={{ ...nightButton, display: "inline-block" }}>
            + Create New Lesson
          </Link>
        </div>
      </div>
    </Shell>
  );
}
