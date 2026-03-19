export type ExploreGlyphKind =
  | "philosophy"
  | "philosophyFocused"
  | "curriculum"
  | "detailPrinciple"
  | "detailActivity"
  | "detailMaterial";

export const GLYPH_PATHS: Record<ExploreGlyphKind, string> = {
  philosophy: "/explore/glyphs/philosophy-major.png",
  philosophyFocused: "/explore/glyphs/philosophy-focused.png",
  curriculum: "/explore/glyphs/curriculum-node.png",
  detailPrinciple: "/explore/glyphs/detail-principle.png",
  detailActivity: "/explore/glyphs/detail-activity.png",
  detailMaterial: "/explore/glyphs/detail-material.png",
};

export const GLYPH_SIZES = {
  philosophyBase: 1.65,
  curriculumBase: 0.18,
  detailBase: 0.07,
};

export const PHILOSOPHY_SEMANTIC_GLYPHS: Record<string, string> = {
  "classical": "/explore/constellation-philosophy/classical.png",
  "charlotte-mason": "/explore/constellation-philosophy/charlotte-mason.png",
  "waldorf-adjacent": "/explore/constellation-philosophy/waldorf-adjacent.png",
  "montessori-inspired": "/explore/constellation-philosophy/montessori-inspired.png",
  "project-based-learning": "/explore/constellation-philosophy/project-based-learning.png",
  "place-nature-based": "/explore/constellation-philosophy/place-nature-based.png",
  "unschooling": "/explore/constellation-philosophy/unschooling.png",
  "flexible": "/explore/constellation-philosophy/flexible.png",
};

export const CURRICULUM_VARIANTS_BY_PHILOSOPHY: Record<string, string> = {
  "classical": "/explore/semantic-glyphs/curriculum-structured.png",
  "charlotte-mason": "/explore/semantic-glyphs/curriculum-structured.png",
  "montessori-inspired": "/explore/semantic-glyphs/curriculum-structured.png",
  "waldorf-adjacent": "/explore/semantic-glyphs/curriculum-creative.png",
  "project-based-learning": "/explore/semantic-glyphs/curriculum-explorer.png",
  "place-nature-based": "/explore/semantic-glyphs/curriculum-explorer.png",
  "unschooling": "/explore/semantic-glyphs/curriculum-explorer.png",
  "flexible": "/explore/semantic-glyphs/curriculum-creative.png",
};

export function getPhilosophyGlyphPath(philosophyId: string): string {
  return PHILOSOPHY_SEMANTIC_GLYPHS[philosophyId] ?? GLYPH_PATHS.philosophy;
}

export function getPhilosophyFocusedGlyphPath(philosophyId: string): string {
  return PHILOSOPHY_SEMANTIC_GLYPHS[philosophyId] ?? GLYPH_PATHS.philosophyFocused;
}

export function getCurriculumGlyphPath(topPhilosophy: string | null): string {
  void topPhilosophy;
  // Standardized curriculum marker for clarity; variation stays in Glyph Lab.
  return GLYPH_PATHS.curriculum;
}

export const PHILOSOPHY_PLANET_SIGNS: Record<string, string> = {
  // Saturn: structure, tradition, discipline.
  "classical": "♄",
  // Mercury: language, observation, narration.
  "charlotte-mason": "☿",
  // Neptune: imagination, arts, mythic tone.
  "waldorf-adjacent": "♆",
  // Earth: practical, grounded, hands-on materials.
  "montessori-inspired": "♁",
  // Mars: action, projects, building.
  "project-based-learning": "♂",
  // Venus: harmony with nature, aesthetics, stewardship.
  "place-nature-based": "♀",
  // Uranus: autonomy, unconventional learning paths.
  "unschooling": "♅",
  // Jupiter: synthesis, breadth, eclectic integration.
  "flexible": "♃",
};

export function getPhilosophyPlanetSign(philosophyId: string): string {
  return PHILOSOPHY_PLANET_SIGNS[philosophyId] ?? "✦";
}

