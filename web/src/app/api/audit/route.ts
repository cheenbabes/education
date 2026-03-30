import { NextResponse } from "next/server";
import { ARCHETYPES } from "@/lib/compass/archetypes";
import { PART1_QUESTIONS, type PhilosophyKey, type DimensionKey } from "@/lib/compass/questions";
import { PHILOSOPHY_LABELS } from "@/lib/compass/scoring";
import type {
  AuditResponse,
  ActionItem,
  ProposedChange,
  OverlapMatrix,
  OverlapCell,
  DimensionProfile,
  DimensionScore,
  ArchetypeAudit,
  ArchetypeDimensionAudit,
  QuizQuestionAudit,
  QuizChoiceAudit,
} from "@/lib/compass/audit-types";

export const dynamic = "force-dynamic";

const KG_URL = process.env.KG_SERVICE_URL || process.env.NEXT_PUBLIC_KG_SERVICE_URL || "http://127.0.0.1:8000";

// ── Philosophy name mapping ──────────────────────────────────────────────────
const KG_TO_COMPASS: Record<string, string> = {
  "montessori-inspired": "montessori",
  "waldorf-adjacent": "waldorf",
  "project-based-learning": "project_based",
  "place-nature-based": "place_nature",
  "classical": "classical",
  "charlotte-mason": "charlotte_mason",
  "unschooling": "unschooling",
  "adaptive": "adaptive",
};

const COMPASS_TO_KG: Record<string, string> = Object.fromEntries(
  Object.entries(KG_TO_COMPASS).map(([k, v]) => [v, k]),
);

// Hardcoded dimension values from /api/explore/graph/route.ts (only structure + modality exist today)
const PHILOSOPHY_HARDCODED: Record<string, Record<string, number>> = {
  montessori:     { structure: 35, modality: 30 },
  waldorf:        { structure: 45, modality: 25 },
  project_based:  { structure: 40, modality: 20 },  // mapped from 35 in route.ts
  place_nature:   { structure: 30, modality: 15 },
  classical:      { structure: 85, modality: 80 },
  charlotte_mason:{ structure: 60, modality: 55 },
  unschooling:    { structure: 10, modality: 35 },   // mapped from 20 in route.ts
  adaptive:       { structure: 50, modality: 50 },
};

const PHILOSOPHY_ORDER: PhilosophyKey[] = [
  "montessori", "waldorf", "project_based", "place_nature",
  "classical", "charlotte_mason", "unschooling", "adaptive",
];

const DIMENSION_ORDER: DimensionKey[] = ["structure", "modality", "subjectApproach", "direction", "social"];

const DIMENSION_NAMES: Record<string, { name: string; low: string; high: string }> = {
  structure:       { name: "Structure",         low: "Prescriptive",     high: "Adaptive" },
  modality:        { name: "Modality",          low: "Hands-on",         high: "Books-first" },
  subjectApproach: { name: "Subject Approach",  low: "Integrated",       high: "Subject-focused" },
  direction:       { name: "Direction",         low: "Teacher-directed", high: "Child-directed" },
  social:          { name: "Social",            low: "Community",        high: "Individual" },
};

// ── Stopwords ────────────────────────────────────────────────────────────────
const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "shall", "can", "must", "need",
  "and", "or", "but", "if", "in", "on", "at", "to", "for", "of", "with",
  "by", "from", "as", "into", "through", "during", "before", "after",
  "about", "between", "under", "above", "over", "out", "up", "down",
  "this", "that", "these", "those", "it", "its", "they", "them", "their",
  "he", "she", "his", "her", "we", "our", "you", "your", "who", "which",
  "what", "when", "where", "how", "why", "all", "each", "every", "both",
  "few", "more", "most", "other", "some", "such", "no", "not", "only",
  "own", "same", "so", "than", "too", "very", "just", "also", "well",
  "even", "still", "already", "much", "many", "then", "here", "there",
  "now", "way", "make", "like", "use", "used", "using", "new", "one",
  "two", "first", "part", "take", "get", "set", "help", "come",
  "made", "find", "give", "good", "different", "work", "important",
  "able", "rather", "within", "without", "however", "whether",
  "because", "since", "while", "although", "though", "per", "any",
  "child", "children", "student", "students", "learner", "learners",
  "learn", "learning", "learned", "teach", "teaching", "teacher", "teachers",
  "education", "educational", "educate", "school", "schools", "schooling",
  "curriculum", "curricula", "lesson", "lessons", "instruction",
  "development", "develop", "developing", "developmental",
  "knowledge", "understand", "understanding", "experience", "experiences",
  "activity", "activities", "process", "approach", "skill", "skills",
  "environment", "world", "time", "age", "young", "ability", "provide",
  "allow", "support", "encourage", "include", "based", "through",
]);

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOPWORDS.has(t));
}

// ── KG data types ────────────────────────────────────────────────────────────
interface KgPrinciple { id: string; name: string; description: string; philosophyId: string }
interface KgActivity { id: string; name: string; description: string; indoorOutdoor: string; philosophyId: string }
interface KgMaterial { id: string; name: string; category: string; philosophyId: string }
interface KgPhilosophy { name: string; description: string; principleCount: number; activityCount: number; materialCount: number }

// ── Dimension keyword lists ──────────────────────────────────────────────────
// For each dimension, keywords that signal high (100) vs low (0) pole
// We scan principle + activity descriptions to score each philosophy

const DIM_KEYWORDS: Record<string, { high: string[]; low: string[] }> = {
  structure: {
    // high = adaptive/flexible, low = prescriptive/structured
    high: [
      "flexible", "adaptive", "emergent", "organic", "fluid", "spontaneous",
      "responsive", "open-ended", "child-pace", "unhurried", "freedom",
      "unstructured", "flow", "natural", "self-paced",
    ],
    low: [
      "structured", "systematic", "sequence", "prescribed", "scheduled",
      "planned", "routine", "orderly", "discipline", "framework",
      "rigorous", "methodical", "curriculum", "scope", "progression",
      "grammar", "logic", "rhetoric", "trivium", "stages",
    ],
  },
  modality: {
    // high = books-first/academic, low = hands-on/experiential
    high: [
      "reading", "books", "literature", "written", "textbook", "lecture",
      "narration", "copywork", "recitation", "memorization", "academic",
      "intellectual", "classical", "great books", "literary",
    ],
    low: [
      "hands-on", "manipulative", "sensory", "tactile", "physical",
      "outdoor", "nature", "garden", "build", "craft", "art",
      "movement", "kinesthetic", "experiential", "practical",
      "concrete", "materials", "tools", "experiment",
    ],
  },
  subjectApproach: {
    // high = subject-focused, low = integrated/cross-curricular
    high: [
      "subject", "discipline", "separate", "distinct", "specialized",
      "departmental", "isolated", "specific", "focused", "targeted",
      "math", "reading", "spelling",
    ],
    low: [
      "integrated", "cross-curricular", "thematic", "holistic", "connected",
      "interdisciplinary", "whole", "unified", "project", "woven",
      "blended", "comprehensive", "broad", "multidisciplinary",
    ],
  },
  direction: {
    // high = child-directed, low = teacher-directed
    high: [
      "child-led", "child-directed", "self-directed", "autonomy", "choice",
      "interest", "curiosity", "intrinsic", "motivation", "freedom",
      "initiative", "independence", "self-regulation", "agency", "ownership",
      "follow the child", "natural curiosity",
    ],
    low: [
      "teacher-directed", "teacher-led", "guided", "instruction", "direct",
      "authority", "assigned", "directed", "explicit", "modeled",
      "demonstration", "lecture", "presentation", "scaffolded",
    ],
  },
  social: {
    // high = individual, low = community/collaborative
    high: [
      "individual", "independent", "self-paced", "solitary", "personal",
      "alone", "private", "one-on-one", "self-study", "concentrated",
    ],
    low: [
      "collaborative", "community", "group", "social", "cooperative",
      "peer", "together", "shared", "collective", "team",
      "mixed-age", "discussion", "dialogue", "family", "circle",
    ],
  },
};

// ── 1. Cross-Philosophy Overlap Matrix ───────────────────────────────────────

function computeOverlapMatrix(principles: KgPrinciple[]): OverlapMatrix {
  const termsByPhil: Record<string, Set<string>> = {};
  for (const phil of PHILOSOPHY_ORDER) termsByPhil[phil] = new Set();

  for (const p of principles) {
    const compassKey = KG_TO_COMPASS[p.philosophyId];
    if (!compassKey || !termsByPhil[compassKey]) continue;
    for (const t of tokenize(p.name + " " + p.description)) {
      termsByPhil[compassKey].add(t);
    }
  }

  const n = PHILOSOPHY_ORDER.length;
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  const cells: OverlapCell[] = [];

  for (let i = 0; i < n; i++) {
    matrix[i][i] = 1.0;
    for (let j = i + 1; j < n; j++) {
      const setA = termsByPhil[PHILOSOPHY_ORDER[i]];
      const setB = termsByPhil[PHILOSOPHY_ORDER[j]];
      const arrA = Array.from(setA);
      const arrB = Array.from(setB);
      const intersection = new Set(arrA.filter(x => setB.has(x)));
      const union = new Set(arrA.concat(arrB));
      const jaccard = union.size > 0 ? intersection.size / union.size : 0;
      matrix[i][j] = jaccard;
      matrix[j][i] = jaccard;
      cells.push({
        philosophyA: PHILOSOPHY_ORDER[i],
        philosophyB: PHILOSOPHY_ORDER[j],
        jaccard: Math.round(jaccard * 1000) / 1000,
        sharedTermCount: intersection.size,
        topSharedTerms: Array.from(intersection).sort().slice(0, 8),
      });
    }
  }

  return {
    philosophies: [...PHILOSOPHY_ORDER],
    matrix: matrix.map(row => row.map(v => Math.round(v * 1000) / 1000)),
    topPairs: [...cells].sort((a, b) => b.jaccard - a.jaccard).slice(0, 10),
  };
}

// ── 2. Full 5-Dimension Profiling ────────────────────────────────────────────

const BOOKISH_CATEGORIES = new Set(["book", "reference book"]);
const HANDS_ON_CATEGORIES = new Set(["tool", "art supply", "natural material", "manipulative", "musical instrument", "building material"]);

function scoreDimensionFromText(texts: string[], dim: string): { score: number; highHits: number; lowHits: number } {
  const kw = DIM_KEYWORDS[dim];
  if (!kw) return { score: 50, highHits: 0, lowHits: 0 };

  let highHits = 0;
  let lowHits = 0;
  const corpus = texts.join(" ").toLowerCase();

  for (const word of kw.high) {
    // Count occurrences
    const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const matches = corpus.match(regex);
    if (matches) highHits += matches.length;
  }
  for (const word of kw.low) {
    const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const matches = corpus.match(regex);
    if (matches) lowHits += matches.length;
  }

  const total = highHits + lowHits;
  if (total === 0) return { score: 50, highHits: 0, lowHits: 0 };

  // Score: 0 = fully low-pole, 100 = fully high-pole
  const score = Math.round((highHits / total) * 100);
  return { score, highHits, lowHits };
}

function computeDimensionProfiles(
  principles: KgPrinciple[],
  activities: KgActivity[],
  materials: KgMaterial[],
): DimensionProfile[] {
  const profiles: DimensionProfile[] = [];

  for (const phil of PHILOSOPHY_ORDER) {
    const philPrinciples = principles.filter(p => KG_TO_COMPASS[p.philosophyId] === phil);
    const philActivities = activities.filter(a => KG_TO_COMPASS[a.philosophyId] === phil);
    const philMaterials = materials.filter(m => KG_TO_COMPASS[m.philosophyId] === phil);

    // Collect all text for keyword analysis
    const allTexts = [
      ...philPrinciples.map(p => p.name + " " + p.description),
      ...philActivities.map(a => a.name + " " + a.description),
    ];

    const outdoorCount = philActivities.filter(a => a.indoorOutdoor === "outdoor").length;
    const indoorCount = philActivities.filter(a => a.indoorOutdoor === "indoor").length;
    const bothCount = philActivities.filter(a => a.indoorOutdoor === "both").length;
    const bookMaterialCount = philMaterials.filter(m => BOOKISH_CATEGORIES.has(m.category)).length;
    const handsOnMaterialCount = philMaterials.filter(m => HANDS_ON_CATEGORIES.has(m.category)).length;

    const dimensions: Record<string, DimensionScore> = {};

    for (const dim of DIMENSION_ORDER) {
      let kgScore: number;
      let evidence: string;

      if (dim === "modality") {
        // Modality uses structural data (indoor/outdoor + material categories) plus text
        const actBookish = indoorCount * 0.3;
        const actHandsOn = outdoorCount + bothCount * 0.5;
        const actScore = (actBookish + actHandsOn > 0)
          ? Math.round((actBookish / (actBookish + actHandsOn)) * 100)
          : 50;

        const matTotal = bookMaterialCount + handsOnMaterialCount || 1;
        const matScore = Math.round((bookMaterialCount / matTotal) * 100);

        const textResult = scoreDimensionFromText(allTexts, dim);

        // Weight: 30% activity structure, 30% materials, 40% text keywords
        kgScore = Math.round(actScore * 0.3 + matScore * 0.3 + textResult.score * 0.4);
        evidence = `Activities: ${outdoorCount} outdoor, ${indoorCount} indoor, ${bothCount} both. Materials: ${bookMaterialCount} book, ${handsOnMaterialCount} hands-on. Text: ${textResult.highHits} bookish hits, ${textResult.lowHits} hands-on hits.`;
      } else {
        // Other dimensions use purely text keyword analysis
        const result = scoreDimensionFromText(allTexts, dim);
        kgScore = result.score;
        evidence = `${result.highHits} "${DIMENSION_NAMES[dim].high}" keyword hits, ${result.lowHits} "${DIMENSION_NAMES[dim].low}" keyword hits across ${allTexts.length} texts.`;
      }

      const hardcoded = PHILOSOPHY_HARDCODED[phil]?.[dim] ?? null;
      const delta = hardcoded != null ? kgScore - hardcoded : 0;
      const absDelta = Math.abs(delta);

      dimensions[dim] = {
        kgScore,
        hardcoded,
        delta,
        verdict: hardcoded == null ? "no-hardcoded"
          : absDelta <= 15 ? "aligned"
          : absDelta <= 30 ? "minor-gap"
          : "major-gap",
        evidence,
      };
    }

    profiles.push({
      philosophy: phil,
      dimensions,
      activityCount: philActivities.length,
      outdoorCount,
      indoorCount,
      bothCount,
      materialCount: philMaterials.length,
      bookMaterialCount,
      handsOnMaterialCount,
    });
  }

  return profiles;
}

// ── 3. Archetype Audit (all 5 dimensions) ────────────────────────────────────

function computeArchetypeAudits(
  overlapMatrix: OverlapMatrix,
  dimensionProfiles: DimensionProfile[],
): ArchetypeAudit[] {
  // Build dimension lookup: phil -> dim -> kgScore
  const dimMap: Record<string, Record<string, number>> = {};
  for (const dp of dimensionProfiles) {
    dimMap[dp.philosophy] = {};
    for (const [dim, score] of Object.entries(dp.dimensions)) {
      dimMap[dp.philosophy][dim] = score.kgScore;
    }
  }

  return ARCHETYPES.map(arch => {
    const sorted = Object.entries(arch.philosophyProfile).sort(([, a], [, b]) => b - a);
    const [primaryPhil, primaryWeight] = sorted[0];
    const primaryIdx = PHILOSOPHY_ORDER.indexOf(primaryPhil as PhilosophyKey);

    // Secondary validation
    const secondaries = sorted
      .filter(([, w]) => w >= 0.10)
      .slice(1)
      .map(([phil, weight]) => {
        const philIdx = PHILOSOPHY_ORDER.indexOf(phil as PhilosophyKey);
        const overlap = primaryIdx >= 0 && philIdx >= 0
          ? overlapMatrix.matrix[primaryIdx][philIdx] : 0;

        const allOverlaps = PHILOSOPHY_ORDER
          .filter(p => p !== primaryPhil)
          .map(p => ({
            philosophy: p,
            overlap: overlapMatrix.matrix[primaryIdx][PHILOSOPHY_ORDER.indexOf(p as PhilosophyKey)],
          }))
          .sort((a, b) => b.overlap - a.overlap);

        const rank = allOverlaps.findIndex(o => o.philosophy === phil) + 1;

        return {
          philosophy: phil,
          weight,
          overlapWithPrimary: Math.round(overlap * 1000) / 1000,
          overlapRank: rank,
          verdict: (rank <= 3 ? "aligned" : rank <= 5 ? "weak" : "misaligned") as "aligned" | "weak" | "misaligned",
        };
      });

    // All 5 dimension audits
    const dimensionAudits: ArchetypeDimensionAudit[] = DIMENSION_ORDER.map(dim => {
      const archValue = arch.dimensionTendencies[dim as keyof typeof arch.dimensionTendencies];
      const kgValue = dimMap[primaryPhil]?.[dim] ?? 50;
      const delta = archValue != null ? archValue - kgValue : 0;
      const absDelta = Math.abs(delta);

      return {
        dimension: dim,
        archetypeValue: archValue,
        kgValue,
        delta,
        verdict: archValue == null ? "no-value" as const
          : absDelta <= 15 ? "aligned" as const
          : absDelta <= 30 ? "minor-gap" as const
          : "major-gap" as const,
      };
    });

    return {
      archetypeId: arch.id,
      archetypeName: arch.name,
      philosophyProfile: { ...arch.philosophyProfile },
      dimensionTendencies: { ...arch.dimensionTendencies },
      profileValidation: {
        primaryPhilosophy: primaryPhil,
        primaryWeight,
        secondaries,
      },
      dimensionAudits,
    };
  });
}

// ── 4. Quiz Question Audit ───────────────────────────────────────────────────

const HANDS_ON_QUIZ_KW = [
  "build", "create", "hands-on", "manipulative", "outdoor", "physical",
  "craft", "garden", "experiment", "touch", "model", "construct", "tools",
  "station", "materials", "blocks", "beads", "measure", "baking",
  "cooking", "field", "nature", "walk", "explore", "observe", "sketch",
  "paint", "watercolor", "art", "music", "song", "drama", "play",
  "sandbox", "sensory",
];

const BOOKISH_QUIZ_KW = [
  "textbook", "worksheet", "workbook", "read", "reading", "book",
  "chapter", "quiz", "test", "assessment", "written", "essay",
  "desk", "schedule", "pages", "phonics", "program", "curriculum",
  "systematic", "chronological",
];

function computeQuizAudits(): QuizQuestionAudit[] {
  return PART1_QUESTIONS.map(q => {
    const choices: QuizChoiceAudit[] = q.choices.map((c, idx) => {
      const flags: string[] = [];
      const textLower = c.text.toLowerCase();

      const hasHandsOnText = HANDS_ON_QUIZ_KW.some(kw => textLower.includes(kw));
      const hasBookishText = BOOKISH_QUIZ_KW.some(kw => textLower.includes(kw));
      const modalityScore = c.dimensions.modality ?? 0;

      if (hasHandsOnText && !hasBookishText && modalityScore > 1) {
        flags.push(`Modality mismatch: text sounds hands-on but modality=${modalityScore} (books-first direction)`);
      }
      if (hasBookishText && !hasHandsOnText && modalityScore < -1) {
        flags.push(`Modality mismatch: text sounds bookish but modality=${modalityScore} (hands-on direction)`);
      }

      return {
        index: idx,
        text: c.text,
        dimensions: { ...c.dimensions } as Record<string, number>,
        philosophies: { ...c.philosophies } as Record<string, number>,
        flags,
      };
    });

    const totalPhilosophyPoints: Record<string, number> = {};
    for (const phil of PHILOSOPHY_ORDER) {
      totalPhilosophyPoints[phil] = choices.reduce((sum, c) => sum + (c.philosophies[phil] ?? 0), 0);
    }

    const dimensionSwing: Record<string, { min: number; max: number; range: number }> = {};
    for (const dim of DIMENSION_ORDER) {
      const values = choices.map(c => c.dimensions[dim] ?? 0);
      const min = Math.min(...values);
      const max = Math.max(...values);
      dimensionSwing[dim] = { min, max, range: max - min };
    }

    return { questionId: q.id, theme: q.theme, scenario: q.scenario, choices, totalPhilosophyPoints, dimensionSwing };
  });
}

// ── 5. Generate Actions + Proposed Changes ───────────────────────────────────

function generateActionsAndChanges(
  overlapMatrix: OverlapMatrix,
  dimensionProfiles: DimensionProfile[],
  archetypeAudits: ArchetypeAudit[],
  quizAudits: QuizQuestionAudit[],
): { actions: ActionItem[]; proposedChanges: ProposedChange[] } {
  const actions: ActionItem[] = [];
  const proposedChanges: ProposedChange[] = [];
  const philLabel = (k: string) => PHILOSOPHY_LABELS[k as PhilosophyKey] || k;

  // --- Overlap Matrix ---
  const topPair = overlapMatrix.topPairs[0];
  if (topPair) {
    actions.push({
      severity: "info", section: "overlap", target: "both",
      title: `Highest overlap: ${philLabel(topPair.philosophyA)} ↔ ${philLabel(topPair.philosophyB)} (${topPair.jaccard.toFixed(3)})`,
      detail: `These philosophies share ${topPair.sharedTermCount} terms in their foundational texts. Archetypes combining these two should have strong secondary weights.`,
      suggestedAction: `Review archetypes that pair these — their secondary weights should reflect this natural affinity.`,
    });
  }

  // --- Dimension Profiles: gaps between KG and hardcoded ---
  for (const dp of dimensionProfiles) {
    for (const [dim, score] of Object.entries(dp.dimensions)) {
      if (score.verdict === "major-gap") {
        const dn = DIMENSION_NAMES[dim];
        actions.push({
          severity: "action", section: "dimensions", target: "explore-map",
          title: `${philLabel(dp.philosophy)} ${dn.name}: hardcoded=${score.hardcoded}, KG=${score.kgScore} (delta=${score.delta})`,
          detail: `${score.evidence} The hardcoded value is ${(score.delta < 0) ? `more "${dn.high}" than KG evidence supports` : `more "${dn.low}" than KG evidence supports`}.`,
          suggestedAction: `Update PHILOSOPHY_DIMENSIONS in explore/graph route. This moves the philosophy dot on the explore constellation map but does NOT affect quiz results.`,
        });
        if (score.hardcoded != null) {
          proposedChanges.push({
            file: "web/src/app/api/explore/graph/route.ts",
            location: `PHILOSOPHY_DIMENSIONS["${COMPASS_TO_KG[dp.philosophy]}"]`,
            field: `${dim}`,
            currentValue: String(score.hardcoded),
            proposedValue: String(score.kgScore),
            reason: `KG evidence (${score.evidence.split(".")[0]}) suggests ${score.kgScore}, not ${score.hardcoded}.`,
            severity: "action",
            target: "explore-map",
          });
        }
      } else if (score.verdict === "minor-gap" && score.hardcoded != null) {
        proposedChanges.push({
          file: "web/src/app/api/explore/graph/route.ts",
          location: `PHILOSOPHY_DIMENSIONS["${COMPASS_TO_KG[dp.philosophy]}"]`,
          field: `${dim}`,
          currentValue: String(score.hardcoded),
          proposedValue: String(score.kgScore),
          reason: `Minor gap: KG=${score.kgScore} vs hardcoded=${score.hardcoded}.`,
          severity: "warning",
          target: "explore-map",
        });
      }
    }
  }

  // --- Archetype Dimension Audits ---
  for (const arch of archetypeAudits) {
    const majorGaps = arch.dimensionAudits.filter(d => d.verdict === "major-gap");
    const minorGaps = arch.dimensionAudits.filter(d => d.verdict === "minor-gap");

    if (majorGaps.length > 0) {
      actions.push({
        severity: "action", section: "archetype", target: "quiz-matching",
        title: `${arch.archetypeName}: ${majorGaps.length} dimension${majorGaps.length > 1 ? "s" : ""} significantly misaligned`,
        detail: majorGaps.map(g => {
          const dn = DIMENSION_NAMES[g.dimension];
          return `${dn.name}: archetype=${g.archetypeValue}, KG=${g.kgValue} (delta=${g.delta > 0 ? "+" : ""}${g.delta})`;
        }).join(". "),
        suggestedAction: `Update dimensionTendencies in archetypes.ts for ${arch.archetypeName}. This changes which users get matched to this archetype (20% of match score).`,
      });

      for (const g of majorGaps) {
        proposedChanges.push({
          file: "web/src/lib/compass/archetypes.ts",
          location: `ARCHETYPES["${arch.archetypeId}"].dimensionTendencies`,
          field: g.dimension,
          currentValue: String(g.archetypeValue ?? "undefined"),
          proposedValue: String(g.kgValue),
          reason: `${arch.archetypeName}'s primary is ${philLabel(arch.profileValidation.primaryPhilosophy)}. KG analysis of that philosophy's texts gives ${DIMENSION_NAMES[g.dimension].name}=${g.kgValue}.`,
          severity: "action",
          target: "quiz-matching",
        });
      }
    }

    for (const g of minorGaps) {
      proposedChanges.push({
        file: "web/src/lib/compass/archetypes.ts",
        location: `ARCHETYPES["${arch.archetypeId}"].dimensionTendencies`,
        field: g.dimension,
        currentValue: String(g.archetypeValue ?? "undefined"),
        proposedValue: String(g.kgValue),
        reason: `Minor gap for ${arch.archetypeName}: KG=${g.kgValue} vs current=${g.archetypeValue}.`,
        severity: "warning",
        target: "quiz-matching",
      });
    }

    // Misaligned secondary philosophies
    const misaligned = arch.profileValidation.secondaries.filter(s => s.verdict === "misaligned");
    if (misaligned.length > 0) {
      actions.push({
        severity: "warning", section: "archetype", target: "quiz-matching",
        title: `${arch.archetypeName}: ${misaligned.length} secondary weight${misaligned.length > 1 ? "s" : ""} not supported by KG overlap`,
        detail: misaligned.map(s =>
          `${philLabel(s.philosophy)} has weight ${(s.weight * 100).toFixed(0)}% but ranks #${s.overlapRank}/7 in overlap with ${philLabel(arch.profileValidation.primaryPhilosophy)}`
        ).join(". "),
        suggestedAction: `Consider reducing these weights and redistributing to philosophies with higher overlap. This changes archetype matching (80% cosine similarity on philosophy profile).`,
      });
    }
  }

  // --- Quiz ---
  const flaggedQuestions = quizAudits.filter(q => q.choices.some(c => c.flags.length > 0));
  if (flaggedQuestions.length > 0) {
    const totalFlags = flaggedQuestions.reduce((n, q) => n + q.choices.reduce((m, c) => m + c.flags.length, 0), 0);
    actions.push({
      severity: "warning", section: "quiz", target: "quiz-matching",
      title: `${totalFlags} modality scoring mismatch${totalFlags > 1 ? "es" : ""} across ${flaggedQuestions.length} question${flaggedQuestions.length > 1 ? "s" : ""}`,
      detail: `Flagged questions: ${flaggedQuestions.map(q => q.questionId.toUpperCase()).join(", ")}.`,
      suggestedAction: `Review each flagged choice. Either adjust the modality weight or reword the text. This affects which dimension scores users get from the quiz.`,
    });
  }

  // Sort
  const sOrder: Record<string, number> = { action: 0, warning: 1, info: 2 };
  actions.sort((a, b) => sOrder[a.severity] - sOrder[b.severity]);

  return { actions, proposedChanges };
}

// ── GET handler ──────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const kgRes = await fetch(`${KG_URL}/graph-export`, { cache: "no-store" });
    if (!kgRes.ok) {
      return NextResponse.json({ error: "Failed to fetch KG data", status: kgRes.status }, { status: 502 });
    }
    const kgData: {
      philosophies: KgPhilosophy[];
      principles: KgPrinciple[];
      activities: KgActivity[];
      materials: KgMaterial[];
    } = await kgRes.json();

    const overlapMatrix = computeOverlapMatrix(kgData.principles);
    const dimensionProfiles = computeDimensionProfiles(kgData.principles, kgData.activities, kgData.materials);
    const archetypeAudits = computeArchetypeAudits(overlapMatrix, dimensionProfiles);
    const quizAudits = computeQuizAudits();
    const { actions, proposedChanges } = generateActionsAndChanges(overlapMatrix, dimensionProfiles, archetypeAudits, quizAudits);

    const response: AuditResponse = {
      overlapMatrix,
      dimensionProfiles,
      archetypeAudits,
      quizAudits,
      actions,
      proposedChanges,
      meta: {
        principleCount: kgData.principles.length,
        activityCount: kgData.activities.length,
        materialCount: kgData.materials.length,
        philosophyCount: kgData.philosophies.length,
        computedAt: new Date().toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (err) {
    return NextResponse.json({ error: "Audit computation failed", detail: String(err) }, { status: 500 });
  }
}
