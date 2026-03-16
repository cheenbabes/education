// Archetype definitions — each maps to a philosophy profile + dimension tendencies
// 8 archetypes, each with a distinct primary philosophy driver

import type { PhilosophyKey } from "./questions";

export interface Archetype {
  id: string;
  name: string;
  icon: string;
  description: string;
  /** Which philosophy pairings lead here */
  typicalPairings: string;
  /** Philosophy affinity profile — higher values = stronger match */
  philosophyProfile: Record<PhilosophyKey, number>;
  /** Dimension tendencies (0-100) — secondary signal */
  dimensionTendencies: {
    structure?: number;
    modality?: number;
    subjectApproach?: number;
    direction?: number;
    social?: number;
  };
}

export const ARCHETYPES: Archetype[] = [
  {
    id: "the-guide",
    name: "The Guide",
    icon: "\uD83E\uDDED",
    description:
      "You value clear direction, structured progression, and the life of the mind. Great books, logical thinking, and measurable milestones define your approach. Your strength is creating a dependable learning environment with high academic expectations.",
    typicalPairings: "Classical + Charlotte Mason, Classical + Eclectic",
    philosophyProfile: {
      montessori: 0.05,
      waldorf: 0.05,
      project_based: 0.05,
      place_nature: 0.0,
      classical: 0.5,
      charlotte_mason: 0.15,
      unschooling: 0.0,
      eclectic_flexible: 0.2,
    },
    dimensionTendencies: { structure: 20, direction: 25, modality: 65 },
  },
  {
    id: "the-explorer",
    name: "The Explorer",
    icon: "\uD83C\uDF0D",
    description:
      "You follow the child's curiosity wherever it leads, blending Montessori-style self-direction with unschooling's trust in the child. Hands-on discovery and real-world experiences are your foundation. Your strength is turning everyday moments into deep learning.",
    typicalPairings: "Montessori + Unschooling, Unschooling + Project-Based",
    philosophyProfile: {
      montessori: 0.25,
      waldorf: 0.05,
      project_based: 0.1,
      place_nature: 0.1,
      classical: 0.0,
      charlotte_mason: 0.05,
      unschooling: 0.35,
      eclectic_flexible: 0.1,
    },
    dimensionTendencies: { direction: 75, modality: 30, structure: 70 },
  },
  {
    id: "the-cultivator",
    name: "The Cultivator",
    icon: "\uD83C\uDF31",
    description:
      "You blend structure with hands-on learning, providing a clear Montessori-inspired framework while making sure learning is tactile and experiential. Your strength is balancing rigor with engagement — children learn by doing within a thoughtful plan.",
    typicalPairings: "Montessori + Classical, Montessori + Eclectic",
    philosophyProfile: {
      montessori: 0.5,
      waldorf: 0.1,
      project_based: 0.1,
      place_nature: 0.05,
      classical: 0.1,
      charlotte_mason: 0.05,
      unschooling: 0.0,
      eclectic_flexible: 0.1,
    },
    dimensionTendencies: { structure: 35, modality: 25, direction: 40 },
  },
  {
    id: "the-naturalist",
    name: "The Naturalist",
    icon: "\uD83C\uDF3F",
    description:
      "The natural world is your classroom. You believe children learn best through direct experience with their environment, seasons, and living things. Your strength is grounding education in place, wonder, and observation.",
    typicalPairings: "Place/Nature + Charlotte Mason, Place/Nature + Waldorf",
    philosophyProfile: {
      montessori: 0.05,
      waldorf: 0.15,
      project_based: 0.05,
      place_nature: 0.5,
      classical: 0.0,
      charlotte_mason: 0.15,
      unschooling: 0.05,
      eclectic_flexible: 0.05,
    },
    dimensionTendencies: { modality: 20, direction: 60 },
  },
  {
    id: "the-storyteller",
    name: "The Storyteller",
    icon: "\uD83D\uDCD6",
    description:
      "You bring learning to life through living books, narration, and rich narratives. You value beauty in education and believe that great stories and careful observation cultivate both mind and character. Nature study, copywork, and short lessons define your rhythm.",
    typicalPairings: "Charlotte Mason + Place/Nature, Charlotte Mason + Waldorf",
    philosophyProfile: {
      montessori: 0.05,
      waldorf: 0.1,
      project_based: 0.05,
      place_nature: 0.1,
      classical: 0.1,
      charlotte_mason: 0.45,
      unschooling: 0.05,
      eclectic_flexible: 0.1,
    },
    dimensionTendencies: { modality: 65, structure: 45 },
  },
  {
    id: "the-architect",
    name: "The Architect",
    icon: "\uD83D\uDD27",
    description:
      "You love building — projects, experiments, models, and real-world solutions. Education for you is about creating something tangible while learning the skills and knowledge needed to make it happen. Collaborative work and community learning are natural extensions.",
    typicalPairings: "Project-Based + Place/Nature, Project-Based + Eclectic",
    philosophyProfile: {
      montessori: 0.1,
      waldorf: 0.05,
      project_based: 0.45,
      place_nature: 0.1,
      classical: 0.05,
      charlotte_mason: 0.05,
      unschooling: 0.1,
      eclectic_flexible: 0.1,
    },
    dimensionTendencies: { modality: 25, subjectApproach: 30, social: 30 },
  },
  {
    id: "the-free-spirit",
    name: "The Free Spirit",
    icon: "\uD83E\uDD8B",
    description:
      "You trust that children are natural learners. Given freedom, time, and a rich environment, they'll pursue what matters to them and learn deeply. Your strength is creating space for authentic, self-directed discovery.",
    typicalPairings: "Unschooling + Montessori, Unschooling + Eclectic",
    philosophyProfile: {
      montessori: 0.1,
      waldorf: 0.05,
      project_based: 0.1,
      place_nature: 0.05,
      classical: 0.0,
      charlotte_mason: 0.05,
      unschooling: 0.5,
      eclectic_flexible: 0.15,
    },
    dimensionTendencies: { structure: 80, direction: 80 },
  },
  {
    id: "the-weaver",
    name: "The Weaver",
    icon: "\uD83E\uDDF6",
    description:
      "You draw from many traditions, adapting your approach to each child, each subject, and each season of life. Your strength is flexibility — you're not committed to one method but to what works. You pick and choose the best from every philosophy.",
    typicalPairings: "Eclectic + any combination, balanced across philosophies",
    philosophyProfile: {
      montessori: 0.1,
      waldorf: 0.05,
      project_based: 0.1,
      place_nature: 0.05,
      classical: 0.1,
      charlotte_mason: 0.1,
      unschooling: 0.1,
      eclectic_flexible: 0.4,
    },
    dimensionTendencies: { structure: 50, direction: 50 },
  },
];
