/**
 * Curriculum matching algorithm for the Education Compass.
 *
 * Scores and ranks curricula against a user's philosophy blend and
 * practical preferences from the compass quiz.
 */

// --- Types ---

export interface PhilosophyBlend {
  montessori?: number;
  waldorf?: number;
  project_based?: number;
  place_nature?: number;
  classical?: number;
  charlotte_mason?: number;
  unschooling?: number;
  eclectic_flexible?: number;
  [key: string]: number | undefined;
}

export interface Part2Preferences {
  subjects?: string[];
  integrated?: "one-program" | "per-subject" | "open-to-either";
  prepLevel?: "open-and-go" | "15-30-min" | "1-2-hours" | "3-plus-hours";
  religiousPreference?: "secular" | "christian" | "other" | "no-preference";
  faithDepth?: "fully-integrated" | "worldview" | "light";
  budget?: "under-50" | "50-150" | "150-300" | "over-300" | "not-a-factor";
  grades?: string[];
  setting?: "home" | "co-op" | "micro-school" | "private-school" | "other";
  screenTime?: "avoid" | "minimal" | "some" | "welcome";
  learningNeeds?: string[]; // "dyslexia", "adhd", "gifted", "none"
}

export interface CurriculumRecord {
  id: string;
  name: string;
  publisher: string;
  description: string;
  subjects: string[];
  gradeRange: string;
  philosophyScores: Record<string, number>;
  prepLevel: string;
  religiousType: string;
  faithDepth: string;
  priceRange: string;
  qualityScore: number;
  affiliateUrl: string | null;
  settingFit: string[];
  notes: string | null;
}

export interface MatchResult {
  curriculum: CurriculumRecord;
  totalScore: number;
  philosophyFitScore: number;
  fitLabel: "strong" | "good" | "partial";
}

export interface MatchWarning {
  type: "prep-mismatch" | "unschooling-dominant" | "dyslexia-recommendation" | "adhd-recommendation";
  message: string;
}

export interface MatchOutput {
  bySubject: Record<string, MatchResult[]>;
  warnings: MatchWarning[];
}

// --- Constants ---

const PREP_LEVELS_ORDERED = ["open-and-go", "light", "moderate", "heavy"];

const BUDGET_MAX: Record<string, number> = {
  "under-50": 50,
  "50-150": 150,
  "150-300": 300,
  "over-300": Infinity,
  "not-a-factor": Infinity,
};

const SETTING_MAP: Record<string, string> = {
  home: "individual",
  "co-op": "co-op",
  "micro-school": "micro-school",
  "private-school": "private-school",
  other: "individual",
};

const PREP_BONUS = 0.10;
const SETTING_BONUS = 0.05;
const INTEGRATED_BONUS = 0.08;

const TOP_N = 3;

// --- Helpers ---

function parsePriceMax(priceRange: string): number {
  // Handle formats like "$50-150", "Under $50", "$150-300", "Over $300", "$0-50"
  const numbers = priceRange.match(/\d+/g);
  if (!numbers || numbers.length === 0) return Infinity;
  // Use the highest number as the max price
  return Math.max(...numbers.map(Number));
}

function parseGradeRange(gradeRange: string): string[] {
  // Handle formats like "K-6", "K-12", "1-8", "K", "3-5"
  const match = gradeRange.match(/^(K|\d+)(?:\s*-\s*(K|\d+))?$/i);
  if (!match) return [];

  const allGrades = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
  const startIdx = allGrades.indexOf(match[1].toUpperCase());
  const endIdx = match[2] ? allGrades.indexOf(match[2]) : startIdx;

  if (startIdx === -1 || endIdx === -1) return [];
  return allGrades.slice(startIdx, endIdx + 1);
}

function gradesOverlap(curriculumRange: string, userGrades: string[]): boolean {
  if (!userGrades.length) return true; // no filter
  const currGrades = parseGradeRange(curriculumRange);
  if (!currGrades.length) return true; // can't parse, don't exclude
  return userGrades.some((g) => currGrades.includes(g));
}

function prepLevelIndex(level: string): number {
  return PREP_LEVELS_ORDERED.indexOf(level);
}

function userPrepMaxIndex(prepLevel: string | undefined): number {
  switch (prepLevel) {
    case "open-and-go":
    case "none": return 0;         // only open-and-go
    case "15-30-min":
    case "light": return 1;        // open-and-go or light
    case "1-2-hours":
    case "moderate": return 2;     // up to moderate
    case "3-plus-hours":
    case "heavy": return 3;        // any
    default: return 3;
  }
}

function fitLabel(score: number): "strong" | "good" | "partial" {
  if (score >= 0.65) return "strong";
  if (score >= 0.40) return "good";
  return "partial";
}

// --- Main Algorithm ---

export function matchCurricula(
  philosophyBlend: PhilosophyBlend,
  preferences: Part2Preferences,
  curricula: CurriculumRecord[],
): MatchOutput {
  const warnings: MatchWarning[] = [];

  // Default subjects to literacy + math if none selected
  const requestedSubjects =
    preferences.subjects && preferences.subjects.length > 0
      ? preferences.subjects.map((s) => s.toLowerCase())
      : ["literacy", "math"];

  // Detect unschooling-dominant blend
  const unschoolingWeight = philosophyBlend.unschooling ?? 0;
  if (unschoolingWeight > 0.5) {
    warnings.push({
      type: "unschooling-dominant",
      message:
        "Your teaching style is heavily child-led. Traditional boxed curricula may not be the best fit — consider using EduApp to create interest-driven lessons on the fly.",
    });
  }

  // Detect prep mismatch potential
  const highPrepPhilosophies = ["waldorf", "montessori", "charlotte_mason"];
  const highPrepWeight = highPrepPhilosophies.reduce(
    (sum, p) => sum + (philosophyBlend[p] ?? 0),
    0,
  );
  const userPrepMax = userPrepMaxIndex(preferences.prepLevel);
  if (highPrepWeight > 0.4 && userPrepMax <= 1) {
    warnings.push({
      type: "prep-mismatch",
      message:
        "Your compass points toward approaches that typically require significant preparation, but you indicated you need low-prep options. We've included adapted and open-and-go alternatives that share similar values.",
    });
  }

  // Detect dyslexia — recommend Orton-Gillingham approach
  const learningNeeds = preferences.learningNeeds ?? [];
  const hasDyslexia = learningNeeds.includes("dyslexia");
  const hasADHD = learningNeeds.includes("adhd");
  const isGifted = learningNeeds.includes("gifted");

  if (hasDyslexia) {
    warnings.push({
      type: "dyslexia-recommendation",
      message:
        "For children with dyslexia or reading difficulties, research strongly supports the Orton-Gillingham approach — a structured, multisensory, phonics-based method. We've prioritized curricula that use this evidence-based approach, such as All About Reading, Logic of English, and Explode the Code.",
    });
  }

  if (hasADHD) {
    warnings.push({
      type: "adhd-recommendation",
      message:
        "For children with ADHD, research shows shorter lessons, hands-on activities, movement breaks, and open-and-go curricula work best. Highly structured, long-sitting classical programs can be challenging. We've prioritized curricula with shorter lesson times, multisensory approaches, and lower prep requirements.",
    });
  }

  const budgetMax = BUDGET_MAX[preferences.budget ?? "not-a-factor"] ?? Infinity;
  const userSetting = SETTING_MAP[preferences.setting ?? "home"] ?? "individual";
  const wantsIntegrated = preferences.integrated === "one-program";

  const bySubject: Record<string, MatchResult[]> = {};

  for (const curriculum of curricula) {
    // --- Hard filters ---

    // Religious filter
    if (
      preferences.religiousPreference &&
      preferences.religiousPreference !== "no-preference"
    ) {
      if (preferences.religiousPreference === "secular" && curriculum.religiousType !== "secular") {
        continue;
      }
      if (
        preferences.religiousPreference === "christian" &&
        curriculum.religiousType !== "christian"
      ) {
        continue;
      }
      if (
        preferences.religiousPreference === "other" &&
        curriculum.religiousType !== "other" &&
        curriculum.religiousType !== "secular"
      ) {
        continue;
      }
    }

    // Grade filter
    if (!gradesOverlap(curriculum.gradeRange, preferences.grades ?? [])) {
      continue;
    }

    // Budget filter
    if (budgetMax < Infinity) {
      const currMax = parsePriceMax(curriculum.priceRange);
      if (currMax > budgetMax) continue;
    }

    // --- Philosophy fit score ---
    let philosophyFitScore = 0;
    for (const [philosophy, userWeight] of Object.entries(philosophyBlend)) {
      if (userWeight === undefined) continue;
      const currScore = curriculum.philosophyScores[philosophy] ?? 0;
      philosophyFitScore += userWeight * currScore;
    }

    let totalScore = philosophyFitScore;

    // --- Soft scoring ---

    // Prep level match: bonus if curriculum prep <= user tolerance
    const currPrepIdx = prepLevelIndex(curriculum.prepLevel);
    if (currPrepIdx !== -1 && currPrepIdx <= userPrepMax) {
      totalScore += PREP_BONUS;
    }

    // Setting fit
    if (curriculum.settingFit.includes(userSetting)) {
      totalScore += SETTING_BONUS;
    }

    // Integrated preference
    if (wantsIntegrated && curriculum.subjects.includes("all-in-one")) {
      totalScore += INTEGRATED_BONUS;
    }

    // Quality score tiebreaker (small weight so it doesn't dominate)
    totalScore += curriculum.qualityScore * 0.05;

    // --- Screen time preference ---
    // Curricula with "video" or "app" or "online" in notes/description get penalized for screen-avoiders
    const currText = `${curriculum.description} ${curriculum.notes ?? ""}`.toLowerCase();
    const isScreenBased = /\bvideo lesson|\bapp-based|\bonline platform|\bvideo instruction|\bdigital/.test(currText);
    if (preferences.screenTime === "avoid" && isScreenBased) {
      totalScore -= 0.15; // significant penalty
    } else if (preferences.screenTime === "minimal" && isScreenBased) {
      totalScore -= 0.05;
    } else if (preferences.screenTime === "welcome" && isScreenBased) {
      totalScore += 0.05; // small bonus
    }

    // --- Learning needs adjustments ---
    const isOrtonGillingham = /orton.gillingham|multi.?sensory.*phonics|structured literacy/i.test(currText);
    const isHandsOn = /hands.on|manipulat|tactile|multi.?sensory/i.test(currText);
    const isShortLessons = /15 min|short lesson|brief lesson/i.test(currText);

    if (hasDyslexia) {
      if (isOrtonGillingham) {
        totalScore += 0.20; // strong bonus for OG-based curricula
      }
      if (isHandsOn) {
        totalScore += 0.05;
      }
    }

    if (hasADHD) {
      // Boost open-and-go, hands-on, shorter lessons
      if (curriculum.prepLevel === "open-and-go") {
        totalScore += 0.10;
      }
      if (isHandsOn) {
        totalScore += 0.10;
      }
      if (isShortLessons) {
        totalScore += 0.05;
      }
      // Penalize heavy-prep classical programs (long structured lessons)
      if (curriculum.prepLevel === "heavy" && (curriculum.philosophyScores.classical ?? 0) > 0.5) {
        totalScore -= 0.15;
      }
    }

    if (isGifted) {
      // Boost challenging, rigorous curricula
      if (/challenging|advanced|gifted|problem.solving|critical think/i.test(currText)) {
        totalScore += 0.10;
      }
    }

    // --- Assign to subjects ---
    const currSubjects = curriculum.subjects.includes("all-in-one")
      ? requestedSubjects
      : curriculum.subjects.map((s) => s.toLowerCase());

    for (const subj of currSubjects) {
      if (!requestedSubjects.includes(subj)) continue;
      if (!bySubject[subj]) bySubject[subj] = [];

      bySubject[subj].push({
        curriculum,
        totalScore,
        philosophyFitScore,
        fitLabel: fitLabel(philosophyFitScore),
      });
    }
  }

  // Sort and trim to top N per subject
  for (const subj of Object.keys(bySubject)) {
    bySubject[subj].sort((a, b) => b.totalScore - a.totalScore);
    bySubject[subj] = bySubject[subj].slice(0, TOP_N);
  }

  return { bySubject, warnings };
}
