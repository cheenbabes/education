"use client";

import { Shell } from "@/components/shell";
import Link from "next/link";

export default function CompassPage() {
  return (
    <Shell hue="compass">
      <div className="max-w-2xl mx-auto space-y-8 py-4">
        <div className="space-y-2">
          <h1 className="font-cormorant-sc text-4xl text-gray-900">
            The Sage&apos;s Compass
          </h1>
          <p className="text-sm text-gray-500">
            Discover your teaching archetype
          </p>
        </div>

        <div className="space-y-4" style={{ fontSize: "0.92rem", lineHeight: 1.75, color: "var(--text-secondary)" }}>
          <p>
            This assessment is designed to reveal your natural propensities as a teacher.
            You&apos;ll get the most accurate results by considering both what you feel
            is important <strong style={{ color: "var(--ink)", fontWeight: 500 }}>and</strong> how you naturally operate.
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

          <p className="font-cormorant-sc" style={{ fontSize: "1rem", fontWeight: 600, color: "var(--ink)", letterSpacing: "0.02em" }}>
            Just be yourself. There are no wrong answers.
          </p>
        </div>

        <div className="border-t border-gray-200 pt-6 space-y-4">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span
              className="flex items-center gap-1.5"
              style={{
                background: "rgba(255,255,255,0.68)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.45)",
                borderRadius: "6px",
                fontSize: "0.7rem",
                padding: "0.25rem 0.6rem",
                fontWeight: 500,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              About 5 minutes
            </span>
            <span
              className="flex items-center gap-1.5"
              style={{
                background: "rgba(255,255,255,0.68)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.45)",
                borderRadius: "6px",
                fontSize: "0.7rem",
                padding: "0.25rem 0.6rem",
                fontWeight: 500,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              20 scenarios
            </span>
          </div>

          <Link
            href="/compass/quiz"
            className="inline-block w-full text-center"
            style={{
              background: "#0B2E4A",
              color: "#F9F6EF",
              borderRadius: "10px",
              padding: "0.6rem 1.4rem",
              fontSize: "0.85rem",
            }}
          >
            Begin
          </Link>

          <p className="text-xs text-center" style={{ color: "var(--text-secondary)" }}>
            For homeschool parents, co-op organizers, micro school teachers,
            and anyone making independent curriculum decisions.
          </p>
        </div>
      </div>
    </Shell>
  );
}
