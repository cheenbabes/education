/**
 * Static sample lessons, one per teaching philosophy.
 *
 * Rendered at /compass/sample/[philosophy] as a pre-generated "proof" of what
 * a lesson in that philosophy looks like. No AI generation, no wait, no auth.
 *
 * Content is authored by the product team, not engineering. The single filled
 * example below (charlotte-mason) exists as a shape reference; the other 7
 * carry TODO placeholders and should be filled in before shipping.
 */
import type { PhilosophyId } from "@/lib/types";

export interface SampleLessonActivity {
  /** Short label over the activity title, e.g. "Nature Observation" or "Living Book" */
  tag: string;
  title: string;
  /** 2-3 sentence description in the philosophy's voice */
  body: string;
}

export interface SampleLesson {
  philosophyId: PhilosophyId;
  /** Display label matching PHILOSOPHY_LABELS, e.g. "Charlotte Mason" */
  philosophyLabel: string;
  title: string;
  /** Grade level as a string, e.g. "3" or "K" */
  grade: string;
  /** Single primary subject, for the subtitle pill */
  subject: string;
  /** Approximate time commitment, e.g. "~45 min" */
  duration: string;
  activities: SampleLessonActivity[];
  /** Standards codes, 2-4 items */
  standards: string[];
}

const TODO: SampleLessonActivity[] = [
  { tag: "TODO", title: "Activity 1 title", body: "Replace me with real copy for this philosophy." },
  { tag: "TODO", title: "Activity 2 title", body: "Replace me with real copy for this philosophy." },
  { tag: "TODO", title: "Activity 3 title", body: "Replace me with real copy for this philosophy." },
];

export const SAMPLE_LESSONS: Record<PhilosophyId, SampleLesson> = {
  "charlotte-mason": {
    philosophyId: "charlotte-mason",
    philosophyLabel: "Charlotte Mason",
    title: "The Water Cycle",
    grade: "3",
    subject: "Science",
    duration: "~45 min",
    activities: [
      {
        tag: "Nature Observation",
        title: "Step outside after it rains",
        body: "Find a puddle. Watch how it shrinks as the morning goes on. Ask your child: \"Where is the water going?\" Let them guess. Then trace a finger from puddle → cloud → raindrop on a sketch.",
      },
      {
        tag: "Living Book",
        title: "Read aloud: A Drop Around the World",
        body: "Ten minutes of Barbara Shaw McKinney's picture book. Ask your child to narrate the journey the water drop took — mountain stream, ocean, cloud — in their own words.",
      },
      {
        tag: "Handwork",
        title: "Paint a watercolor cycle diagram",
        body: "Use real water. Label the four stages: evaporation, condensation, precipitation, collection. The pigment moving across wet paper is the lesson itself.",
      },
    ],
    standards: ["NGSS-ESS2.C", "3-ESS2-1", "CCSS.ELA.RL.3.2"],
  },

  // ── placeholders ──────────────────────────────────────────────────────────

  "classical": {
    philosophyId: "classical",
    philosophyLabel: "Classical",
    title: "TODO",
    grade: "3",
    subject: "TODO",
    duration: "~45 min",
    activities: TODO,
    standards: [],
  },
  "montessori-inspired": {
    philosophyId: "montessori-inspired",
    philosophyLabel: "Montessori-Inspired",
    title: "TODO",
    grade: "3",
    subject: "TODO",
    duration: "~45 min",
    activities: TODO,
    standards: [],
  },
  "waldorf-adjacent": {
    philosophyId: "waldorf-adjacent",
    philosophyLabel: "Waldorf-Inspired",
    title: "TODO",
    grade: "3",
    subject: "TODO",
    duration: "~45 min",
    activities: TODO,
    standards: [],
  },
  "project-based-learning": {
    philosophyId: "project-based-learning",
    philosophyLabel: "Project-Based Learning",
    title: "TODO",
    grade: "3",
    subject: "TODO",
    duration: "~45 min",
    activities: TODO,
    standards: [],
  },
  "place-nature-based": {
    philosophyId: "place-nature-based",
    philosophyLabel: "Place/Nature-Based",
    title: "TODO",
    grade: "3",
    subject: "TODO",
    duration: "~45 min",
    activities: TODO,
    standards: [],
  },
  "unschooling": {
    philosophyId: "unschooling",
    philosophyLabel: "Unschooling",
    title: "TODO",
    grade: "3",
    subject: "TODO",
    duration: "~45 min",
    activities: TODO,
    standards: [],
  },
  "adaptive": {
    philosophyId: "adaptive",
    philosophyLabel: "Adaptive",
    title: "TODO",
    grade: "3",
    subject: "TODO",
    duration: "~45 min",
    activities: TODO,
    standards: [],
  },
};

/**
 * Resolve the user's CompassResult.philosophyBlend (keyed by PhilosophyKey —
 * the underscore form: "charlotte_mason") to a sample-lesson PhilosophyId
 * (hyphen form: "charlotte-mason"). Returns the lesson for their top match,
 * or a safe fallback if the blend is empty.
 */
export function resolveSampleLessonForBlend(
  blend: Record<string, number> | null | undefined,
): SampleLesson {
  const topBlendKey = blend
    ? Object.entries(blend).sort(([, a], [, b]) => b - a)[0]?.[0]
    : undefined;

  const map: Record<string, PhilosophyId> = {
    montessori: "montessori-inspired",
    waldorf: "waldorf-adjacent",
    project_based: "project-based-learning",
    place_nature: "place-nature-based",
    classical: "classical",
    charlotte_mason: "charlotte-mason",
    unschooling: "unschooling",
    adaptive: "adaptive",
  };

  const philosophyId = (topBlendKey && map[topBlendKey]) || "charlotte-mason";
  return SAMPLE_LESSONS[philosophyId];
}
