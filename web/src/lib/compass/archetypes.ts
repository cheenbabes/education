// Archetype definitions — each maps to a combination of dimension scores

export interface Archetype {
  id: string;
  name: string;
  icon: string;
  description: string;
  /** Dimension thresholds: key is dimension, value is [min, max] range (0-100) */
  match: {
    structure?: [number, number];
    modality?: [number, number];
    subjectApproach?: [number, number];
    direction?: [number, number];
    social?: [number, number];
  };
}

export const ARCHETYPES: Archetype[] = [
  {
    id: "the-guide",
    name: "The Guide",
    icon: "\uD83E\uDDED",
    description:
      "You value clear direction and structured progression. You believe children thrive with a well-planned path and measurable milestones. Your strength is creating a dependable learning environment where expectations are clear.",
    match: {
      structure: [0, 35],
      direction: [0, 40],
    },
  },
  {
    id: "the-explorer",
    name: "The Explorer",
    icon: "\uD83C\uDF0D",
    description:
      "You follow the child's curiosity wherever it leads, using hands-on experiences and real-world discovery as the foundation for learning. Your strength is turning everyday moments into deep, meaningful education.",
    match: {
      direction: [60, 100],
      modality: [0, 45],
    },
  },
  {
    id: "the-cultivator",
    name: "The Cultivator",
    icon: "\uD83C\uDF31",
    description:
      "You blend structure with hands-on learning, providing a clear framework while making sure learning is tactile and experiential. Your strength is balancing rigor with engagement — children learn by doing within a thoughtful plan.",
    match: {
      structure: [0, 45],
      modality: [0, 40],
    },
  },
  {
    id: "the-naturalist",
    name: "The Naturalist",
    icon: "\uD83C\uDF3F",
    description:
      "The natural world is your classroom. You believe children learn best through direct experience with their environment, seasons, and living things. Your strength is grounding education in place, wonder, and observation.",
    match: {
      modality: [0, 35],
      direction: [50, 100],
      social: [0, 55],
    },
  },
  {
    id: "the-storyteller",
    name: "The Storyteller",
    icon: "\uD83D\uDCD6",
    description:
      "You bring learning to life through living books, narration, and rich narratives. You value beauty in education and believe that great stories and careful observation cultivate both mind and character.",
    match: {
      modality: [45, 100],
      structure: [30, 65],
    },
  },
  {
    id: "the-architect",
    name: "The Architect",
    icon: "\uD83D\uDD27",
    description:
      "You love building — projects, experiments, models, and real-world solutions. Education for you is about creating something tangible while learning the skills and knowledge needed to make it happen.",
    match: {
      modality: [0, 40],
      subjectApproach: [0, 45],
      social: [0, 55],
    },
  },
  {
    id: "the-philosopher",
    name: "The Philosopher",
    icon: "\uD83C\uDFDB\uFE0F",
    description:
      "You believe in the life of the mind — great books, deep discussions, logical thinking, and the pursuit of truth. Your strength is cultivating critical thinkers who can engage with complex ideas across disciplines.",
    match: {
      structure: [0, 40],
      modality: [55, 100],
      subjectApproach: [55, 100],
    },
  },
  {
    id: "the-free-spirit",
    name: "The Free Spirit",
    icon: "\uD83E\uDD8B",
    description:
      "You trust that children are natural learners. Given freedom, time, and a rich environment, they'll pursue what matters to them and learn deeply. Your strength is creating space for authentic, self-directed discovery.",
    match: {
      structure: [65, 100],
      direction: [65, 100],
    },
  },
  {
    id: "the-weaver",
    name: "The Weaver",
    icon: "\uD83E\uDDF6",
    description:
      "You draw from many traditions, adapting your approach to each child, each subject, and each season of life. Your strength is flexibility — you're not committed to one method but to what works.",
    match: {
      structure: [35, 65],
      direction: [35, 65],
    },
  },
  {
    id: "the-connector",
    name: "The Connector",
    icon: "\uD83E\uDD1D",
    description:
      "You believe education is a communal endeavor. Learning happens best when children work together, share ideas, and engage with mentors and peers. Your strength is building collaborative learning experiences.",
    match: {
      social: [0, 30],
    },
  },
];
