/**
 * Homeschool parent/teacher personas for quiz simulation.
 *
 * Each persona has:
 * - A name and description for context
 * - Philosophy weights: how strongly they resonate with each philosophy (0-1)
 * - Dimension biases: which end of each dimension they lean toward (-1 to 1)
 * - Expected archetype: what we expect them to get (for validation)
 *
 * The simulation picks the answer choice that best matches the persona's
 * philosophy weights + dimension biases for each question.
 */

export interface Persona {
  name: string;
  description: string;
  expectedArchetype: string;
  /** How strongly this persona resonates with each philosophy (0 = not at all, 1 = strongly) */
  philosophyWeights: Record<string, number>;
  /** Which direction they lean on each dimension (-1 = left pole, 0 = neutral, 1 = right pole) */
  dimensionBiases: Record<string, number>;
}

export const PERSONAS: Persona[] = [
  {
    name: "Classical Carla",
    description: "Structured, academic, loves great books and Latin. Uses a set curriculum with clear benchmarks. Values measurable progress and sequential learning.",
    expectedArchetype: "the-guide",
    philosophyWeights: { classical: 1.0, charlotte_mason: 0.3, eclectic_flexible: 0.2 },
    dimensionBiases: { structure: -0.8, direction: -0.7, modality: 0.6, subjectApproach: 0.5 },
  },
  {
    name: "Montessori Maria",
    description: "Prepared environment, child-led within structure. Uses Montessori materials, lets children choose work. Values independence and hands-on learning.",
    expectedArchetype: "the-cultivator",
    philosophyWeights: { montessori: 1.0, project_based: 0.3, waldorf: 0.2 },
    dimensionBiases: { structure: -0.3, direction: 0.4, modality: -0.7, subjectApproach: -0.2 },
  },
  {
    name: "Unschooling Uma",
    description: "Fully child-led, no curriculum. Trusts children to learn through life. Reads Sandra Dodd and John Holt. No tests, no grades, no schedule.",
    expectedArchetype: "the-free-spirit",
    philosophyWeights: { unschooling: 1.0, eclectic_flexible: 0.2, montessori: 0.1 },
    dimensionBiases: { structure: 0.9, direction: 0.9, modality: -0.2, social: 0.3 },
  },
  {
    name: "Charlotte Mason Claire",
    description: "Living books, narration, nature study, short lessons. Values beauty in education. Does copywork, keeps a Book of Centuries. Afternoon handicrafts.",
    expectedArchetype: "the-storyteller",
    philosophyWeights: { charlotte_mason: 1.0, place_nature: 0.3, classical: 0.2, waldorf: 0.2 },
    dimensionBiases: { modality: 0.4, structure: -0.3, direction: -0.2 },
  },
  {
    name: "Project-Based Pete",
    description: "Everything is a project. Kids build robots, run a small business, design experiments. Learning happens through creating tangible things.",
    expectedArchetype: "the-architect",
    philosophyWeights: { project_based: 1.0, montessori: 0.2, place_nature: 0.2, eclectic_flexible: 0.2 },
    dimensionBiases: { modality: -0.8, subjectApproach: -0.5, social: -0.3 },
  },
  {
    name: "Nature-Based Nora",
    description: "Forest school family. Most learning happens outdoors. Nature journaling, seasonal rhythms, place-based curriculum. Rain or shine, they're outside.",
    expectedArchetype: "the-naturalist",
    philosophyWeights: { place_nature: 1.0, charlotte_mason: 0.3, waldorf: 0.3, unschooling: 0.1 },
    dimensionBiases: { modality: -0.8, direction: 0.3, social: -0.2 },
  },
  {
    name: "Eclectic Elena",
    description: "Uses Math-U-See for math, Brave Writer for writing, nature study on Fridays, and whatever YouTube video sparks interest. Picks the best from everything.",
    expectedArchetype: "the-weaver",
    philosophyWeights: { eclectic_flexible: 1.0, charlotte_mason: 0.2, montessori: 0.2, project_based: 0.2 },
    dimensionBiases: { structure: 0.0, direction: 0.0, modality: -0.2 },
  },
  {
    name: "Waldorf Wendy",
    description: "Rhythm-based, arts-integrated. Morning circle, main lesson blocks, watercolor painting, beeswax, handwork. Delays academics, values imagination.",
    expectedArchetype: "the-storyteller",
    philosophyWeights: { waldorf: 1.0, charlotte_mason: 0.4, classical: 0.1 },
    dimensionBiases: { modality: -0.3, structure: -0.4, subjectApproach: -0.6, direction: -0.2 },
  },
  {
    name: "Outdoor Explorer Owen",
    description: "Unschool-ish but with a nature focus. Kids learn by exploring the creek, the woods, the farmer's market. Minimal indoor academics.",
    expectedArchetype: "the-explorer",
    philosophyWeights: { unschooling: 0.7, place_nature: 0.8, montessori: 0.2 },
    dimensionBiases: { direction: 0.6, modality: -0.7, structure: 0.5 },
  },
  {
    name: "Structured-but-Hands-On Sarah",
    description: "Follows a curriculum but makes it tactile. Uses manipulatives, does experiments, builds models. Wants rigor but not worksheets.",
    expectedArchetype: "the-cultivator",
    philosophyWeights: { montessori: 0.6, classical: 0.3, project_based: 0.4, eclectic_flexible: 0.3 },
    dimensionBiases: { structure: -0.4, modality: -0.8, direction: -0.1 },
  },
  {
    name: "Co-op Community Cora",
    description: "Homeschools through a co-op 3 days a week. Group projects, collaborative learning, shared teaching. Values community and social learning.",
    expectedArchetype: "the-architect",
    philosophyWeights: { project_based: 0.6, classical: 0.3, place_nature: 0.3, eclectic_flexible: 0.3 },
    dimensionBiases: { social: -0.9, modality: -0.3, direction: -0.2 },
  },
  {
    name: "Relaxed Homeschooler Rae",
    description: "Does math and reading in the morning, then the kids play and explore. No stress, no testing. Trusts the process but wants core skills covered.",
    expectedArchetype: "the-explorer",
    philosophyWeights: { unschooling: 0.4, place_nature: 0.5, eclectic_flexible: 0.3, charlotte_mason: 0.2 },
    dimensionBiases: { structure: 0.3, direction: 0.4, modality: -0.3 },
  },
  {
    name: "Micro-School Mike",
    description: "Runs a micro-school with 8 kids. Structured schedule, mixed ages, project-based with classical core. Needs things that work in group settings.",
    expectedArchetype: "the-guide",
    philosophyWeights: { classical: 0.5, project_based: 0.4, eclectic_flexible: 0.3, montessori: 0.2 },
    dimensionBiases: { structure: -0.5, social: -0.8, direction: -0.4 },
  },
  {
    name: "New Homeschooler Nina",
    description: "Just pulled kids from school. Nervous, wants something open-and-go. Doesn't know what philosophy she is yet. Picks whatever seems easiest and most engaging.",
    expectedArchetype: "the-weaver",
    philosophyWeights: { eclectic_flexible: 0.6, montessori: 0.2, charlotte_mason: 0.2, classical: 0.2 },
    dimensionBiases: { structure: -0.2, direction: 0.1, modality: -0.1 },
  },
  {
    name: "STEM-Focused Sanjay",
    description: "Engineer parent. Loves science experiments, coding, math games. Project-based with a STEM emphasis. Uses Beast Academy and Mystery Science.",
    expectedArchetype: "the-architect",
    philosophyWeights: { project_based: 0.8, montessori: 0.3, classical: 0.2, eclectic_flexible: 0.3 },
    dimensionBiases: { modality: -0.6, subjectApproach: -0.3, structure: -0.2, social: -0.2 },
  },
];
