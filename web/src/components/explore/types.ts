export interface PhilosophyNode {
  name: string;
  description: string;
  color: string;
  dimensions: { structure: number; modality: number };
  principleCount: number;
  activityCount: number;
  materialCount: number;
}

export interface CurriculumNode {
  id: string;
  name: string;
  publisher: string;
  description: string;
  subjects: string[];
  gradeRange: string;
  philosophyScores: Record<string, number>;
  prepLevel: string;
  religiousType: string;
  priceRange: string;
  qualityScore: number;
  affiliateUrl: string | null;
  notes: string | null;
}

export interface PrincipleNode {
  id: string;
  name: string;
  description: string;
  philosophyId: string;
}

export interface ActivityNode {
  id: string;
  name: string;
  description: string;
  indoorOutdoor: string;
  philosophyId: string;
}

export interface MaterialNode {
  id: string;
  name: string;
  category: string;
  philosophyId: string;
}

export interface CurriculumPlacement {
  placementId: string;
  curriculumId: string;
  philosophyName: string;
  score: number;
  name: string;
  publisher: string;
  description: string;
  subjects: string[];
  gradeRange: string;
  philosophyScores: Record<string, number>;
  prepLevel: string;
  religiousType: string;
  priceRange: string;
  qualityScore: number;
  affiliateUrl: string | null;
  notes: string | null;
}

export interface GraphData {
  philosophies: PhilosophyNode[];
  curricula: CurriculumNode[];
  curriculumPlacements?: CurriculumPlacement[];
  principles: PrincipleNode[];
  activities: ActivityNode[];
  materials: MaterialNode[];
  dataIntegrity?: {
    missingPhilosophies: string[];
  };
}
