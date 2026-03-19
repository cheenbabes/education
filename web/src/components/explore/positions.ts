/** Hand-tuned artistic positions for the 8 philosophies spread across the full viewport.
 *  Camera zoom is 45, viewport ~1400x900 → visible range is roughly ±15 x ±10.
 *  Positions span ±10 x ±7 to fill most of the canvas with breathing room.
 */
export const PHILOSOPHY_POSITIONS: Record<string, [number, number]> = {
  "classical":              [-8,    5.5],   // top-left (structured, academic)
  "charlotte-mason":        [-2.5,  6.0],   // top-center (living books, narration)
  "waldorf-adjacent":       [ 5,    5.0],   // top-right (creative, artistic)
  "montessori-inspired":    [ 9,    0.5],   // far right (hands-on, self-directed)
  "project-based-learning": [ 4,   -4.0],   // lower-right (inquiry, real-world)
  "place-nature-based":     [-1,   -6.0],   // bottom-center (outdoor, nature)
  "unschooling":            [-8,   -3.0],   // lower-left (child-led, freedom)
  "flexible":               [ 0,    0.5],   // center (eclectic blend)
};

export const CANONICAL_PHILOSOPHIES = Object.keys(PHILOSOPHY_POSITIONS);

/** Display names with clean formatting */
export const PHILOSOPHY_DISPLAY_NAMES: Record<string, string> = {
  "classical":              "CLASSICAL",
  "charlotte-mason":        "CHARLOTTE MASON",
  "waldorf-adjacent":       "WALDORF",
  "montessori-inspired":    "MONTESSORI",
  "project-based-learning": "PROJECT-BASED",
  "place-nature-based":     "NATURE-BASED",
  "unschooling":            "UNSCHOOLING",
  "flexible":               "ECLECTIC",
};

/** Constellation lines — philosophies that share conceptual connections.
 *  Each pair gets a thin line drawn between them.
 */
export const CONSTELLATION_EDGES: [string, string][] = [
  // Structured cluster
  ["classical", "charlotte-mason"],
  ["charlotte-mason", "waldorf-adjacent"],
  // Hands-on cluster
  ["waldorf-adjacent", "montessori-inspired"],
  ["montessori-inspired", "project-based-learning"],
  // Nature/freedom cluster
  ["project-based-learning", "place-nature-based"],
  ["place-nature-based", "unschooling"],
  // Cross-connections
  ["unschooling", "flexible"],
  ["flexible", "classical"],
  ["flexible", "charlotte-mason"],
  ["flexible", "montessori-inspired"],
  // More subtle connections
  ["charlotte-mason", "place-nature-based"],  // nature study
  ["waldorf-adjacent", "place-nature-based"],  // outdoor emphasis
  ["unschooling", "project-based-learning"],   // child-driven inquiry
];

/** Normalize curriculum score keys to canonical philosophy IDs. */
export function normalizePhilosophyKey(key: string): string {
  const normalized = key.trim().toLowerCase();
  const map: Record<string, string> = {
    charlotte_mason: "charlotte-mason",
    waldorf: "waldorf-adjacent",
    montessori: "montessori-inspired",
    project_based: "project-based-learning",
    place_nature: "place-nature-based",
    eclectic_flexible: "flexible",
  };

  return map[normalized] || normalized.replace(/_/g, "-");
}

/**
 * Deterministic curriculum placement so moons/lines/camera always agree.
 * Returns position + connected philosophy IDs + top philosophy.
 */
export function getCurriculumPlacement(
  philosophyScores: Record<string, number>,
  index: number,
): {
  position: [number, number, number];
  connectedPhilosophies: string[];
  topPhilosophy: string | null;
} {
  let weightedX = 0;
  let weightedY = 0;
  let totalWeight = 0;
  let topPhilosophy: string | null = null;
  let topScore = -Infinity;
  const connected: string[] = [];

  for (const [rawKey, rawValue] of Object.entries(philosophyScores || {})) {
    const score = Number(rawValue);
    if (!Number.isFinite(score) || score <= 0) continue;

    const key = normalizePhilosophyKey(rawKey);
    const pos = PHILOSOPHY_POSITIONS[key];
    if (!pos) continue;

    weightedX += score * pos[0];
    weightedY += score * pos[1];
    totalWeight += score;
    connected.push(key);

    if (score > topScore) {
      topScore = score;
      topPhilosophy = key;
    }
  }

  if (totalWeight <= 0) {
    return {
      position: [0, 0, 0],
      connectedPhilosophies: [],
      topPhilosophy: null,
    };
  }

  const centerX = weightedX / totalWeight;
  const centerY = weightedY / totalWeight;

  // Broader deterministic spread to avoid curriculum clustering.
  const goldenAngle = 2.399963229728653;
  const theta = index * goldenAngle;
  const spiralRadius = 1.6 + Math.sqrt(index + 1) * 0.42;
  const spiralX = Math.cos(theta) * spiralRadius;
  const spiralY = Math.sin(theta) * spiralRadius * 0.82;
  const jitterX = Math.sin(index * 7.13) * 0.55;
  const jitterY = Math.cos(index * 5.37) * 0.42;

  return {
    position: [centerX + spiralX + jitterX, centerY + spiralY + jitterY, 0],
    connectedPhilosophies: Array.from(new Set(connected)),
    topPhilosophy,
  };
}
