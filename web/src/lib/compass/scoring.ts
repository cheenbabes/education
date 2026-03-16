import {
  DimensionKey,
  PhilosophyKey,
  PART1_QUESTIONS,
} from "./questions";

export type { DimensionKey, PhilosophyKey };
import { ARCHETYPES, Archetype } from "./archetypes";

export interface DimensionScores {
  structure: number;
  modality: number;
  subjectApproach: number;
  direction: number;
  social: number;
}

export type PhilosophyBlend = Record<PhilosophyKey, number>;

export interface StructureFlowSplit {
  hasSplit: boolean;
  foundationalScore: number;
  exploratoryScore: number;
  message: string;
}

export interface CompassResult {
  dimensions: DimensionScores;
  philosophies: PhilosophyBlend;
  archetype: Archetype;
  structureFlowSplit: StructureFlowSplit;
}

const ALL_DIMENSIONS: DimensionKey[] = [
  "structure",
  "modality",
  "subjectApproach",
  "direction",
  "social",
];

const ALL_PHILOSOPHIES: PhilosophyKey[] = [
  "montessori",
  "waldorf",
  "project_based",
  "place_nature",
  "classical",
  "charlotte_mason",
  "unschooling",
  "eclectic_flexible",
];

/**
 * Calculate dimension scores from Part 1 answers.
 * Raw scores range from negative (left pole) to positive (right pole).
 * We normalize to 0-100 where 0 = full left pole, 100 = full right pole.
 */
export function calculateDimensions(
  answers: Record<string, number>
): DimensionScores {
  const rawScores: Record<DimensionKey, number> = {
    structure: 0,
    modality: 0,
    subjectApproach: 0,
    direction: 0,
    social: 0,
  };

  // Max possible absolute score per dimension per question is 3
  // With 10 questions, theoretical max is 30 in either direction
  for (const q of PART1_QUESTIONS) {
    const choiceIdx = answers[q.id];
    if (choiceIdx === undefined) continue;
    const choice = q.choices[choiceIdx];
    for (const dim of ALL_DIMENSIONS) {
      rawScores[dim] += choice.dimensions[dim] || 0;
    }
  }

  // Normalize: find the max possible range and map to 0-100
  // Max absolute per dimension across all questions
  const maxAbsolute = 45; // 20 questions, calibrated for good spread
  const normalized: DimensionScores = {
    structure: 0,
    modality: 0,
    subjectApproach: 0,
    direction: 0,
    social: 0,
  };

  for (const dim of ALL_DIMENSIONS) {
    // Map from [-maxAbsolute, maxAbsolute] to [0, 100]
    normalized[dim] = Math.round(
      Math.min(100, Math.max(0, ((rawScores[dim] + maxAbsolute) / (2 * maxAbsolute)) * 100))
    );
  }

  return normalized;
}

/**
 * Calculate philosophy blend from Part 1 answers.
 * Returns percentages that sum to 100.
 */
export function calculatePhilosophies(
  answers: Record<string, number>
): PhilosophyBlend {
  const rawScores: Record<PhilosophyKey, number> = {
    montessori: 0,
    waldorf: 0,
    project_based: 0,
    place_nature: 0,
    classical: 0,
    charlotte_mason: 0,
    unschooling: 0,
    eclectic_flexible: 0,
  };

  for (const q of PART1_QUESTIONS) {
    const choiceIdx = answers[q.id];
    if (choiceIdx === undefined) continue;
    const choice = q.choices[choiceIdx];
    for (const phil of ALL_PHILOSOPHIES) {
      rawScores[phil] += choice.philosophies[phil] || 0;
    }
  }

  // Normalize to percentages
  const total = Object.values(rawScores).reduce((sum, v) => sum + v, 0);
  const blend: PhilosophyBlend = {} as PhilosophyBlend;
  for (const phil of ALL_PHILOSOPHIES) {
    blend[phil] = total > 0 ? Math.round((rawScores[phil] / total) * 100) : 0;
  }

  // Fix rounding to sum to exactly 100
  const currentSum = Object.values(blend).reduce((s, v) => s + v, 0);
  if (currentSum !== 100 && total > 0) {
    // Add/subtract difference from the largest value
    const maxPhil = ALL_PHILOSOPHIES.reduce((a, b) =>
      blend[a] >= blend[b] ? a : b
    );
    blend[maxPhil] += 100 - currentSum;
  }

  return blend;
}

/**
 * Detect structure/flow split — when the user prefers prescriptive
 * for foundational subjects but adaptive for others.
 */
export function detectStructureFlowSplit(
  answers: Record<string, number>
): StructureFlowSplit {
  let foundationalTotal = 0;
  let foundationalCount = 0;
  let otherTotal = 0;
  let otherCount = 0;

  for (const q of PART1_QUESTIONS) {
    const choiceIdx = answers[q.id];
    if (choiceIdx === undefined) continue;
    const choice = q.choices[choiceIdx];
    const structureScore = choice.dimensions.structure || 0;

    if (choice.subjectContext === "foundational") {
      foundationalTotal += structureScore;
      foundationalCount++;
    } else {
      otherTotal += structureScore;
      otherCount++;
    }
  }

  if (foundationalCount === 0 || otherCount === 0) {
    return { hasSplit: false, foundationalScore: 50, exploratoryScore: 50, message: "" };
  }

  const foundationalAvg = foundationalTotal / foundationalCount;
  const otherAvg = otherTotal / otherCount;

  // A split exists when foundational leans prescriptive (negative) and other leans adaptive (positive)
  // Threshold: at least 2 points of divergence on average
  const hasSplit = foundationalAvg < -0.5 && otherAvg > 0.5 && (otherAvg - foundationalAvg) >= 2;

  // Normalize averages to 0-100 scale (same logic as dimensions)
  const normalize = (v: number) => Math.round(Math.min(100, Math.max(0, ((v + 3) / 6) * 100)));

  return {
    hasSplit,
    foundationalScore: normalize(foundationalAvg),
    exploratoryScore: normalize(otherAvg),
    message: hasSplit
      ? "You lean prescriptive for literacy and math, adaptive for other subjects \u2014 a common and practical approach."
      : "",
  };
}

/**
 * Determine archetype from philosophy blend and dimension scores.
 *
 * Primary signal: cosine similarity between user's philosophy blend and
 * each archetype's ideal philosophy profile.
 * Secondary signal: dimension proximity (small tiebreaker).
 *
 * The Weaver archetype (eclectic) only wins when no single philosophy
 * dominates — i.e., the user's top philosophy is less than 20% of the blend.
 */
export function determineArchetype(
  dimensions: DimensionScores,
  philosophies?: PhilosophyBlend,
): Archetype {
  let bestMatch: Archetype = ARCHETYPES[0];
  let bestScore = -Infinity;

  // If no philosophies provided, use a flat blend (will match Weaver)
  const blend: Record<string, number> = philosophies
    ? { ...philosophies }
    : {};

  // Normalize philosophy blend to 0-1 (from 0-100 percentages)
  const blendNorm: Record<string, number> = {};
  for (const [key, value] of Object.entries(blend)) {
    blendNorm[key] = (value as number) / 100;
  }

  // Check if user has a dominant philosophy or is truly eclectic
  const sortedPhils = Object.entries(blendNorm).sort((a, b) => b[1] - a[1]);
  const topPhilPct = sortedPhils.length > 0 ? sortedPhils[0][1] : 0;
  const isTrulyEclectic = topPhilPct < 0.17; // No single philosophy > 17%

  for (const archetype of ARCHETYPES) {
    // --- Philosophy similarity (primary, weight = 0.8) ---
    let dotProduct = 0;
    let magA = 0;
    let magB = 0;

    for (const phil of ALL_PHILOSOPHIES) {
      const userVal = blendNorm[phil] || 0;
      const archVal = archetype.philosophyProfile[phil] || 0;
      dotProduct += userVal * archVal;
      magA += userVal * userVal;
      magB += archVal * archVal;
    }

    const cosineSim =
      magA > 0 && magB > 0
        ? dotProduct / (Math.sqrt(magA) * Math.sqrt(magB))
        : 0;

    // --- Dimension proximity (secondary, weight = 0.2) ---
    let dimScore = 0;
    let dimCount = 0;
    for (const [dim, targetVal] of Object.entries(archetype.dimensionTendencies)) {
      if (targetVal === undefined) continue;
      const userVal = dimensions[dim as DimensionKey];
      // Score is 1 when exact match, 0 when 100 points away
      dimScore += 1 - Math.abs(userVal - (targetVal as number)) / 100;
      dimCount++;
    }
    const dimSim = dimCount > 0 ? dimScore / dimCount : 0.5;

    // --- Combined score ---
    let finalScore = cosineSim * 0.8 + dimSim * 0.2;

    // Weaver penalty: only let Weaver win if user is truly eclectic
    if (archetype.id === "the-weaver" && !isTrulyEclectic) {
      finalScore -= 0.15;
    }

    if (finalScore > bestScore) {
      bestScore = finalScore;
      bestMatch = archetype;
    }
  }

  return bestMatch;
}

/**
 * Full scoring: takes Part 1 answers and returns the complete compass result.
 */
export function scoreCompass(answers: Record<string, number>): CompassResult {
  const dimensions = calculateDimensions(answers);
  const philosophies = calculatePhilosophies(answers);
  const archetype = determineArchetype(dimensions, philosophies);
  const structureFlowSplit = detectStructureFlowSplit(answers);

  return { dimensions, philosophies, archetype, structureFlowSplit };
}

/** Human-readable labels for dimensions */
export const DIMENSION_LABELS: Record<
  DimensionKey,
  { name: string; left: string; right: string }
> = {
  structure: { name: "Structure", left: "Prescriptive", right: "Adaptive" },
  modality: { name: "Modality", left: "Hands-on", right: "Books-first" },
  subjectApproach: {
    name: "Subject Approach",
    left: "Integrated",
    right: "Subject-focused",
  },
  direction: {
    name: "Direction",
    left: "Teacher-directed",
    right: "Child-directed",
  },
  social: { name: "Social", left: "Community", right: "Individual" },
};

/** Human-readable labels for philosophies */
export const PHILOSOPHY_LABELS: Record<PhilosophyKey, string> = {
  montessori: "Montessori-Inspired",
  waldorf: "Waldorf-Adjacent",
  project_based: "Project-Based Learning",
  place_nature: "Place/Nature-Based",
  classical: "Classical",
  charlotte_mason: "Charlotte Mason",
  unschooling: "Unschooling / Child-Led",
  eclectic_flexible: "Eclectic / Flexible",
};

/** Colors for philosophy pie chart */
export const PHILOSOPHY_COLORS: Record<PhilosophyKey, string> = {
  montessori: "#8B5CF6",
  waldorf: "#F59E0B",
  project_based: "#3B82F6",
  place_nature: "#10B981",
  classical: "#6366F1",
  charlotte_mason: "#EC4899",
  unschooling: "#F97316",
  eclectic_flexible: "#6B7280",
};
