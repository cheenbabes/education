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
