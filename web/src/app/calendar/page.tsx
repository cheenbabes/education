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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setView("week")}
              className={`px-3 py-1.5 text-sm rounded ${view === "week" ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600"}`}
            >
              Week
            </button>
            <button
              onClick={() => setView("month")}
              className={`px-3 py-1.5 text-sm rounded ${view === "month" ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600"}`}
            >
              Month
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => (view === "week" ? navigateWeek(-1) : navigateMonth(-1))}
            className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded hover:bg-gray-50"
          >
            &larr; Previous
          </button>
          <h2 className="font-medium text-gray-900">
            {view === "week"
              ? `${weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} — ${weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
              : currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h2>
          <button
            onClick={() => (view === "week" ? navigateWeek(1) : navigateMonth(1))}
            className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded hover:bg-gray-50"
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
                  className={`bg-white rounded border p-3 min-h-[160px] ${
                    isToday ? "border-blue-300 bg-blue-50/30" : "border-gray-200"
                  }`}
                >
                  <div className="text-center mb-2">
                    <p className="text-xs text-gray-500">{DAY_NAMES[date.getDay()]}</p>
                    <p className={`text-sm font-medium ${isToday ? "text-blue-600" : "text-gray-900"}`}>
                      {date.getDate()}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    {lessons.map((lesson) => (
                      <Link
                        key={lesson.id}
                        href={`/lessons/${lesson.id}`}
                        className={`block p-1.5 rounded text-xs ${
                          lesson.completed
                            ? "bg-green-50 border border-green-200"
                            : "bg-gray-50 border border-gray-150 hover:bg-gray-100"
                        }`}
                      >
                        <p className="font-medium text-gray-900 truncate">{lesson.title}</p>
                        <div className="flex gap-1 mt-0.5 flex-wrap">
                          {lesson.children.map((c) => (
                            <span key={c} className="text-gray-400">{c}</span>
                          ))}
                        </div>
                        {lesson.completed && lesson.rating && (
                          <div className="flex gap-0.5 mt-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <span key={s} className={`text-[10px] ${s <= lesson.rating! ? "text-yellow-400" : "text-gray-200"}`}>★</span>
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
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-t border border-gray-200">
              {DAY_NAMES.map((day) => (
                <div key={day} className="bg-gray-50 text-center py-2 text-xs font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-b border-x border-b border-gray-200">
              {monthDates.map((date) => {
                const dateStr = formatDate(date);
                const lessons = lessonsByDate[dateStr] || [];
                const isToday = dateStr === today;
                const isCurrentMonth = date.getMonth() === currentDate.getMonth();

                return (
                  <div
                    key={dateStr}
                    className={`bg-white p-2 min-h-[80px] ${
                      !isCurrentMonth ? "opacity-40" : ""
                    } ${isToday ? "bg-blue-50/50" : ""}`}
                  >
                    <p className={`text-xs mb-1 ${isToday ? "text-blue-600 font-medium" : "text-gray-500"}`}>
                      {date.getDate()}
                    </p>
                    {lessons.map((lesson) => (
                      <Link
                        key={lesson.id}
                        href={`/lessons/${lesson.id}`}
                        className={`block text-[10px] p-1 rounded mb-0.5 truncate ${
                          lesson.completed
                            ? "bg-green-50 text-green-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
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

        <div className="flex justify-center">
          <Link
            href="/generate"
            className="px-4 py-2 bg-gray-900 text-white rounded text-sm hover:bg-gray-800"
          >
            + Generate New Lesson
          </Link>
        </div>
      </div>
    </Shell>
  );
}
