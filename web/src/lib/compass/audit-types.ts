// Shared types for the /api/audit endpoint and /audit page

export interface OverlapCell {
  philosophyA: string;
  philosophyB: string;
  jaccard: number;
  sharedTermCount: number;
  topSharedTerms: string[];
}

export interface OverlapMatrix {
  philosophies: string[];
  matrix: number[][];
  topPairs: OverlapCell[];
}

// Per-dimension KG-derived score for a philosophy
export interface DimensionScore {
  kgScore: number;           // 0-100 derived from KG data
  hardcoded: number | null;  // current hardcoded value (null if not set)
  delta: number;             // kgScore - hardcoded
  verdict: "aligned" | "minor-gap" | "major-gap" | "no-hardcoded";
  evidence: string;          // brief explanation of how KG score was derived
}

// Full 5-dimension profile for a philosophy
export interface DimensionProfile {
  philosophy: string;
  dimensions: Record<string, DimensionScore>;
  // Raw counts for modality (kept for detail view)
  activityCount: number;
  outdoorCount: number;
  indoorCount: number;
  bothCount: number;
  materialCount: number;
  bookMaterialCount: number;
  handsOnMaterialCount: number;
}

export interface ArchetypeDimensionAudit {
  dimension: string;
  archetypeValue: number | undefined;
  kgValue: number;
  delta: number;
  verdict: "aligned" | "minor-gap" | "major-gap" | "no-value";
}

export interface ArchetypeAudit {
  archetypeId: string;
  archetypeName: string;
  philosophyProfile: Record<string, number>;
  dimensionTendencies: Record<string, number | undefined>;
  profileValidation: {
    primaryPhilosophy: string;
    primaryWeight: number;
    secondaries: Array<{
      philosophy: string;
      weight: number;
      overlapWithPrimary: number;
      overlapRank: number;
      verdict: "aligned" | "weak" | "misaligned";
    }>;
  };
  dimensionAudits: ArchetypeDimensionAudit[];
}

export interface QuizChoiceAudit {
  index: number;
  text: string;
  dimensions: Record<string, number>;
  philosophies: Record<string, number>;
  flags: string[];
}

export interface QuizQuestionAudit {
  questionId: string;
  theme: string;
  scenario: string;
  choices: QuizChoiceAudit[];
  totalPhilosophyPoints: Record<string, number>;
  dimensionSwing: Record<string, { min: number; max: number; range: number }>;
}

export interface ProposedChange {
  file: string;
  location: string;
  field: string;
  currentValue: string;
  proposedValue: string;
  reason: string;
  severity: "action" | "warning";
  /** What this change affects */
  target: "explore-map" | "quiz-matching";
}

export interface ActionItem {
  severity: "info" | "warning" | "action";
  section: "overlap" | "dimensions" | "archetype" | "quiz";
  /** What this action affects */
  target?: "explore-map" | "quiz-matching" | "both";
  title: string;
  detail: string;
  suggestedAction: string;
}

export interface AuditResponse {
  overlapMatrix: OverlapMatrix;
  dimensionProfiles: DimensionProfile[];
  archetypeAudits: ArchetypeAudit[];
  quizAudits: QuizQuestionAudit[];
  actions: ActionItem[];
  proposedChanges: ProposedChange[];
  meta: {
    principleCount: number;
    activityCount: number;
    materialCount: number;
    philosophyCount: number;
    computedAt: string;
  };
}
