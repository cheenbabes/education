"use client";

import { Shell } from "@/components/shell";
import Link from "next/link";

export default function CompassPage() {
  return (
    <Shell>
      <div className="max-w-2xl mx-auto space-y-8 py-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            The Sage&apos;s Compass
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Discover your teaching archetype
          </p>
        </div>

        <div className="space-y-5 text-[15px] leading-relaxed text-gray-700 dark:text-gray-300">
          <p>
            This quiz is designed to reveal your natural propensities as a teacher.
            You&apos;ll get the most accurate results by considering both what you feel
            is important <em>and</em> how you naturally operate.
          </p>

          <p>
            For example, someone who loves spending time reading at home with their
            children may not feel as inspired to head to the farmers market for a
            hands-on math lesson while buying fruit. Both ways of teaching can be
            wonderful — neither is better than the other.
          </p>

          <p>
            Answer based on what feels natural to you and what you want to give
            the children you teach. Let your conceptions of pedagogies and
            frameworks fall away.
          </p>

          <p className="text-gray-900 dark:text-gray-100 font-medium">
            Just be yourself. There are no wrong answers.
          </p>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-6 space-y-4">
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              About 5 minutes
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              20 scenarios
            </span>
          </div>

          <Link
            href="/compass/quiz"
            className="inline-block w-full text-center py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          >
            Begin
          </Link>

          <p className="text-xs text-center text-gray-400 dark:text-gray-500">
            For homeschool parents, co-op organizers, micro school teachers,
            and anyone making independent curriculum decisions.
          </p>
        </div>
      </div>
    </Shell>
  );
}
