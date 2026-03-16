"use client";

import { Shell } from "@/components/shell";

export default function CurriculumReviewPage() {
  return (
    <Shell>
      <iframe
        src="/curriculum-review.html"
        className="w-full border-0"
        style={{ minHeight: "calc(100vh - 80px)" }}
        title="Curriculum Review"
      />
    </Shell>
  );
}
