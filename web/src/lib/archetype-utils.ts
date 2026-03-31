/** Maps philosophyBlend keys (from quiz results) → PHILOSOPHIES IDs (used in lesson creation) */
export const BLEND_KEY_TO_PHILOSOPHY_ID: Record<string, string> = {
  montessori:      "montessori-inspired",
  waldorf:         "waldorf-adjacent",
  project_based:   "project-based-learning",
  place_nature:    "place-nature-based",
  classical:       "classical",
  charlotte_mason: "charlotte-mason",
  unschooling:     "unschooling",
  adaptive:        "adaptive",
};
