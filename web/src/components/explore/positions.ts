/** Hand-tuned artistic positions for the 8 philosophies spread across the full viewport.
 *  Camera zoom is 45, viewport ~1400x900 → visible range is roughly ±15 x ±10.
 *  Positions span ±10 x ±7 to fill most of the canvas with breathing room.
 */
export const PHILOSOPHY_POSITIONS: Record<string, [number, number]> = {
  "classical":              [-12,    8],     // top-left
  "charlotte-mason":        [  0,   10],     // top-center
  "waldorf-adjacent":       [ 12,    8],     // top-right
  "montessori-inspired":    [ 14,   -1],     // right
  "project-based-learning": [  8,   -9],     // lower-right
  "place-nature-based":     [ -4,  -10],     // bottom-left
  "unschooling":            [-14,   -2],     // left
  "flexible":               [  0,    0],     // center (eclectic — no placements rendered)
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

export function getOrbitalPosition(
  philosophyName: string,
  score: number,
  index: number,
  totalInOrbit: number,
): [number, number] {
  void totalInOrbit; // reserved for future use
  const philPos = PHILOSOPHY_POSITIONS[philosophyName];
  if (!philPos) return [0, 0];

  const minDist = 1.6;
  const maxDist = 4.0;
  const t = (score - 0.30) / 0.70;
  const dist = maxDist - t * (maxDist - minDist);

  const goldenAngle = 2.39996323;
  const angle = index * goldenAngle;

  const jitterR = (Math.sin(index * 7.13) * 0.15);
  const jitterA = (Math.cos(index * 3.77) * 0.2);

  const x = philPos[0] + (dist + jitterR) * Math.cos(angle + jitterA);
  const y = philPos[1] + (dist + jitterR) * Math.sin(angle + jitterA);

  return [x, y];
}

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
  let topPhilosophy: string | null = null;
  const connected: string[] = [];

  // Collect all valid scores
  const scored: { key: string; score: number; pos: [number, number] }[] = [];
  for (const [rawKey, rawValue] of Object.entries(philosophyScores || {})) {
    const score = Number(rawValue);
    if (!Number.isFinite(score) || score <= 0) continue;

    const key = normalizePhilosophyKey(rawKey);
    const pos = PHILOSOPHY_POSITIONS[key];
    if (!pos) continue;

    scored.push({ key, score, pos });
    connected.push(key);
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  topPhilosophy = scored.length > 0 ? scored[0].key : null;

  if (scored.length === 0) {
    return {
      position: [0, 0, 0],
      connectedPhilosophies: [],
      topPhilosophy: null,
    };
  }

  // ANCHOR to the #1 philosophy, then PULL slightly toward #2.
  // A 95% Waldorf / 40% Nature curriculum should orbit Waldorf,
  // not land halfway between them.
  const primary = scored[0];
  let centerX = primary.pos[0];
  let centerY = primary.pos[1];

  if (scored.length >= 2) {
    const secondary = scored[1];
    // Pull strength: ratio of scores, capped at 0.35 so we never go more
    // than 35% of the way from primary toward secondary.
    const ratio = secondary.score / primary.score;
    const pullStrength = Math.min(ratio * 0.35, 0.35);
    centerX += (secondary.pos[0] - primary.pos[0]) * pullStrength;
    centerY += (secondary.pos[1] - primary.pos[1]) * pullStrength;
  }

  // Spread curricula outside the philosophy constellation glyph (~1.1 unit radius).
  // Minimum distance of 1.5 ensures no curriculum lands inside a philosophy.
  const goldenAngle = 2.399963229728653;
  const theta = index * goldenAngle;
  const spiralRadius = 1.5 + Math.sqrt(index + 1) * 0.2;
  const spiralX = Math.cos(theta) * spiralRadius;
  const spiralY = Math.sin(theta) * spiralRadius * 0.82;
  const jitterX = Math.sin(index * 7.13) * 0.2;
  const jitterY = Math.cos(index * 5.37) * 0.16;

  return {
    position: [centerX + spiralX + jitterX, centerY + spiralY + jitterY, 0],
    connectedPhilosophies: Array.from(new Set(connected)),
    topPhilosophy,
  };
}
