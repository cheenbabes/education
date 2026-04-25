"use client";

import { useEffect } from "react";
import { track, type AnalyticsEvent } from "@/lib/analytics";

const ALLOWED_EVENTS: ReadonlySet<AnalyticsEvent> = new Set<AnalyticsEvent>([
  "lessons_gallery_card_clicked",
  "lessons_gallery_create_clicked",
  "lessons_gallery_create_card_clicked",
]);

/**
 * Fires `lessons_gallery_viewed` once on mount, and wires click-tracking for
 * elements inside the gallery that carry `data-track` attributes. Keeping the
 * tracking logic in a separate "use client" component lets the gallery page
 * itself remain a pure server component for SEO + fast TTFB.
 */
export function LessonsGalleryTracker() {
  useEffect(() => {
    track("lessons_gallery_viewed", {});

    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const el = target.closest<HTMLElement>("[data-track]");
      if (!el) return;
      const event = el.dataset.track as AnalyticsEvent | undefined;
      if (!event || !ALLOWED_EVENTS.has(event)) return;
      const props: Record<string, string | undefined> = {};
      for (const [key, value] of Object.entries(el.dataset)) {
        if (key === "track" || value === undefined) continue;
        props[key] = value;
      }
      track(event, props);
    };

    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  return null;
}
