"use client";

import { Shell } from "@/components/shell";
import Link from "next/link";
import { PART1_QUESTIONS } from "@/lib/compass/questions";

export default function CompassPage() {
  return (
    <Shell>
      <div className="max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Education Compass</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Discover your teaching philosophy and get matched with curricula
          that fit your style, your schedule, and your family.
        </p>

        <div className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800 p-4 space-y-4">
          <h2 className="font-medium text-gray-900 dark:text-gray-100">How it works</h2>
          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-300">
                1
              </span>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Answer {PART1_QUESTIONS.length} scenario questions
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No right or wrong answers — just how you&apos;d naturally approach
                  teaching moments.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-300">
                2
              </span>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  See your teaching profile
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Get your archetype, dimension scores, and philosophy blend —
                  a picture of how you naturally educate.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-300">
                3
              </span>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Get curriculum recommendations
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Answer a few practical questions and get matched with vetted
                  curricula that fit your philosophy and life.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          For homeschool parents, co-op organizers, micro school teachers, and
          anyone making independent curriculum decisions. Takes about 5 minutes.
        </p>

        <Link
          href="/compass/quiz"
          className="inline-block w-full text-center py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded font-medium hover:bg-gray-800 dark:hover:bg-gray-200"
        >
          Take the Quiz
        </Link>
      </div>
    </Shell>
  );
}
