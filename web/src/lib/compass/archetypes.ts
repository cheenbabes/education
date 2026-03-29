// Archetype definitions — each maps to a philosophy profile + dimension tendencies
// 8 archetypes, each with a distinct primary philosophy driver

import type { PhilosophyKey } from "./questions";

export interface Archetype {
  id: string;
  name: string;
  icon: string;
  /** Watercolor character illustration path */
  imagePath: string;
  /** Watercolor tool/object illustration path */
  toolPath: string;
  /** CSS hex color for this archetype */
  color: string;
  description: string;
  /** Which philosophy pairings lead here */
  typicalPairings: string;
  /** Personalized EduApp pitch for this archetype */
  appPitch: { headline: string; body: string; cta: string };
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
    icon: "🔭",
    imagePath: "/archetypes/guide.png",
    toolPath: "/archetypes/tools/spyglass.png",
    color: "#5B5E8A",
    description:
      "You value clear direction, structured progression, and the life of the mind. Great books, logical thinking, and measurable milestones define your approach. Your strength is creating a dependable learning environment with high academic expectations.",
    typicalPairings: "Classical + Charlotte Mason, Classical + Adaptive",
    appPitch: {
      headline: "Structured Foundation, Creative Extension",
      body: "You value a solid curriculum for core skills — and that's smart. Pick your literacy and math foundations from the recommendations below, then use EduApp to generate rigorous, standards-aligned lessons for science, history, and the subjects where you want to connect academics to your child's interests without losing the structure you value.",
      cta: "Build Structured Lessons",
    },
    philosophyProfile: {
      montessori: 0.05,
      waldorf: 0.05,
      project_based: 0.05,
      place_nature: 0.0,
      classical: 0.5,
      charlotte_mason: 0.2,
      unschooling: 0.0,
      adaptive: 0.15,
    },
    dimensionTendencies: { structure: 20, direction: 25, modality: 65 },
  },
  {
    id: "the-explorer",
    name: "The Explorer",
    icon: "\uD83C\uDF0D",
    imagePath: "/archetypes/explorer.png",
    toolPath: "/archetypes/tools/map.png",
    color: "#5A947A",
    description:
      "You follow your child's curiosity into the world around them. You trust that real learning happens through real experiences in real places. Your classroom is everywhere — the backyard, the creek, the farmer's market. Your strength is turning the world itself into the curriculum.",
    typicalPairings: "Unschooling + Place/Nature, Unschooling + Montessori",
    appPitch: {
      headline: "Your Classroom Is Everywhere",
      body: "As an Explorer, your teaching style is inherently responsive and child-led. Boxed curricula can anchor literacy and math, but for the subjects where you follow your child's curiosity — science, social studies, the world around you — EduApp was built for exactly this. Tell us what your child is fascinated by today, and we'll create a standards-aligned lesson that matches your Explorer approach.",
      cta: "Create Interest-Driven Lessons",
    },
    philosophyProfile: {
      montessori: 0.1,
      waldorf: 0.05,
      project_based: 0.05,
      place_nature: 0.3,
      classical: 0.0,
      charlotte_mason: 0.05,
      unschooling: 0.4,
      adaptive: 0.05,
    },
    dimensionTendencies: { direction: 70, modality: 25, structure: 65 },
  },
  {
    id: "the-cultivator",
    name: "The Cultivator",
    icon: "\uD83C\uDF31",
    imagePath: "/archetypes/cultivator.png",
    toolPath: "/archetypes/tools/watering-can.png",
    color: "#7D6B9E",
    description:
      "You carefully prepare the learning environment and curate the materials, but your child chooses what to work on and at what pace. Your strength is balancing structure with independence — children learn by doing within a thoughtfully designed space.",
    typicalPairings: "Montessori + Structured, Montessori + Project-Based",
    appPitch: {
      headline: "Prepare the Environment, Follow the Child",
      body: "Your approach means you curate the environment and your child chooses what to explore. EduApp works the same way — you select the subject and your child's current interest, and we prepare a complete, hands-on lesson ready for them to work through. Use a structured curriculum for foundational literacy and math, and let EduApp create the rest.",
      cta: "Prepare Lessons for Your Child",
    },
    philosophyProfile: {
      montessori: 0.5,
      waldorf: 0.1,
      project_based: 0.15,
      place_nature: 0.05,
      classical: 0.05,
      charlotte_mason: 0.05,
      unschooling: 0.0,
      adaptive: 0.1,
    },
    dimensionTendencies: { structure: 35, modality: 25, direction: 50 },
  },
  {
    id: "the-naturalist",
    name: "The Naturalist",
    icon: "\uD83C\uDF3F",
    imagePath: "/archetypes/naturalist.png",
    toolPath: "/archetypes/tools/fern.png",
    color: "#6BA07A",
    description:
      "The natural world is your classroom. You believe children learn best through direct experience with their environment, seasons, and living things. Your strength is grounding education in place, wonder, and observation.",
    typicalPairings: "Place/Nature + Charlotte Mason, Place/Nature + Waldorf",
    appPitch: {
      headline: "Bring the Outdoors Into Every Lesson",
      body: "You believe the natural world is the best teacher. EduApp generates place-based, nature-connected lessons tied to your child's environment and interests — seasonal science, local ecology, outdoor math, nature journaling prompts. Pick a foundational curriculum for reading and math basics, then let EduApp design the rest around the world right outside your door.",
      cta: "Create Nature-Based Lessons",
    },
    philosophyProfile: {
      montessori: 0.05,
      waldorf: 0.15,
      project_based: 0.05,
      place_nature: 0.5,
      classical: 0.0,
      charlotte_mason: 0.15,
      unschooling: 0.05,
      adaptive: 0.05,
    },
    dimensionTendencies: { modality: 20, direction: 60 },
  },
  {
    id: "the-storyteller",
    name: "The Storyteller",
    icon: "\uD83D\uDCD6",
    imagePath: "/archetypes/storyteller.png",
    toolPath: "/archetypes/tools/book.png",
    color: "#B07A8A",
    description:
      "You bring learning to life through living books, narration, and rich narratives. You value beauty in education and believe that great stories and careful observation cultivate both mind and character. Nature study, copywork, and short lessons define your rhythm.",
    typicalPairings: "Charlotte Mason + Place/Nature, Charlotte Mason + Waldorf",
    appPitch: {
      headline: "Living Lessons for Living Books Families",
      body: "Your approach values short, rich lessons built around great books and real-world observation. EduApp generates lessons in exactly this spirit — discussion-friendly, connected to nature and literature, and designed to be completed in focused, age-appropriate time blocks. Choose your core reading and math curriculum, then use EduApp to create lessons for science, history, and nature study.",
      cta: "Create Living Lessons",
    },
    philosophyProfile: {
      montessori: 0.05,
      waldorf: 0.1,
      project_based: 0.05,
      place_nature: 0.1,
      classical: 0.1,
      charlotte_mason: 0.45,
      unschooling: 0.05,
      adaptive: 0.1,
    },
    dimensionTendencies: { modality: 65, structure: 45 },
  },
  {
    id: "the-architect",
    name: "The Architect",
    icon: "🔨",
    imagePath: "/archetypes/architect.png",
    toolPath: "/archetypes/tools/hammer.png",
    color: "#5A7FA0",
    description:
      "You love building — projects, experiments, models, and real-world solutions. Education for you is about creating something tangible while learning the skills and knowledge needed to make it happen. Place-based projects and collaborative work are natural extensions of your approach.",
    typicalPairings: "Project-Based + Place/Nature, Project-Based + Collaborative",
    appPitch: {
      headline: "Projects That Teach Themselves",
      body: "You believe children learn best by building, creating, and solving real problems. EduApp generates project-based lessons around your child's interests — complete with materials lists, step-by-step instructions, and the academic standards being covered behind the scenes. Use a solid curriculum for literacy and math foundations, then let EduApp design the projects for everything else.",
      cta: "Generate Project-Based Lessons",
    },
    philosophyProfile: {
      montessori: 0.1,
      waldorf: 0.05,
      project_based: 0.45,
      place_nature: 0.1,
      classical: 0.05,
      charlotte_mason: 0.05,
      unschooling: 0.1,
      adaptive: 0.1,
    },
    dimensionTendencies: { modality: 25, subjectApproach: 30, social: 30 },
  },
  {
    id: "the-free-spirit",
    name: "The Free Spirit",
    icon: "\uD83E\uDD8B",
    imagePath: "/archetypes/free-spirit.png",
    toolPath: "/archetypes/tools/butterfly.png",
    color: "#C07A42",
    description:
      "You trust that children are natural learners. Given freedom, time, and a rich environment, they'll pursue what matters to them and learn with real purpose. Your strength is creating space for authentic, self-directed discovery.",
    typicalPairings: "Unschooling + Montessori, Unschooling + Adaptive",
    appPitch: {
      headline: "Structure When You Want It, Freedom Always",
      body: "You trust your child to lead their own learning — and that works. But sometimes an interest sparks and you want to go deeper without spending hours planning. EduApp turns your child's latest fascination into a complete, thoughtful lesson in seconds. No boxed curriculum required. Just tell us what they're curious about, and we'll handle the rest — standards-aligned, age-appropriate, and designed for your child-led approach.",
      cta: "Turn Curiosity Into Lessons",
    },
    philosophyProfile: {
      montessori: 0.15,
      waldorf: 0.05,
      project_based: 0.1,
      place_nature: 0.0,
      classical: 0.0,
      charlotte_mason: 0.05,
      unschooling: 0.5,
      adaptive: 0.15,
    },
    dimensionTendencies: { structure: 80, direction: 80 },
  },
  {
    id: "the-weaver",
    name: "The Weaver",
    icon: "\uD83E\uDDF6",
    imagePath: "/archetypes/weaver.png",
    toolPath: "/archetypes/tools/yarn.png",
    color: "#8A8A7E",
    description:
      "You draw from many traditions, adapting your approach to each child, each subject, and each season of life. Your strength is flexibility — you're not committed to one method but to what works. You pick and choose the best from every philosophy.",
    typicalPairings: "Adaptive + any combination, balanced across philosophies",
    appPitch: {
      headline: "The Perfect Tool for Pick-and-Choose Educators",
      body: "You pull from everywhere — hands-on materials for math, great books for reading, projects for science, nature in the afternoon. EduApp matches your flexibility. Select any approach, any subject, any interest, and get a tailored lesson that adapts to however you're teaching that day. Use your chosen curricula for the core, and let EduApp fill in the rest — differently every time, just like you.",
      cta: "Create Adaptive Lessons",
    },
    philosophyProfile: {
      montessori: 0.1,
      waldorf: 0.05,
      project_based: 0.1,
      place_nature: 0.05,
      classical: 0.1,
      charlotte_mason: 0.1,
      unschooling: 0.1,
      adaptive: 0.4,
    },
    dimensionTendencies: { structure: 50, direction: 50 },
  },
];
