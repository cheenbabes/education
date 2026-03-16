// Compass quiz question definitions
// Part 1: Scenario-based questions that score dimensions + philosophies
// Part 2: Practical preference questions for curriculum matching

export type DimensionKey = "structure" | "modality" | "subjectApproach" | "direction" | "social";
export type PhilosophyKey =
  | "montessori"
  | "waldorf"
  | "project_based"
  | "place_nature"
  | "classical"
  | "charlotte_mason"
  | "unschooling"
  | "eclectic_flexible";

export interface DimensionWeights {
  structure?: number;       // negative = prescriptive, positive = adaptive
  modality?: number;        // negative = hands-on, positive = books-first
  subjectApproach?: number; // negative = integrated, positive = subject-focused
  direction?: number;       // negative = teacher-directed, positive = child-directed
  social?: number;          // negative = community, positive = individual
}

export interface PhilosophyWeights {
  montessori?: number;
  waldorf?: number;
  project_based?: number;
  place_nature?: number;
  classical?: number;
  charlotte_mason?: number;
  unschooling?: number;
  eclectic_flexible?: number;
}

export interface AnswerChoice {
  text: string;
  dimensions: DimensionWeights;
  philosophies: PhilosophyWeights;
  /** Tags for detecting structure/flow split: "foundational" or "exploratory" subject context */
  subjectContext?: "foundational" | "exploratory";
}

export interface Part1Question {
  id: string;
  theme: string;
  scenario: string;
  choices: AnswerChoice[];
}

export interface Part2Choice {
  value: string;
  label: string;
}

export interface Part2Question {
  id: string;
  question: string;
  type: "single" | "multi" | "range";
  choices: Part2Choice[];
  /** If set, this question only shows when the given condition is met */
  showWhen?: { questionId: string; values: string[] };
}

export const PART1_QUESTIONS: Part1Question[] = [
  {
    id: "q1",
    theme: "Responding to a child's spontaneous interest",
    scenario: "Your child becomes fascinated with birds after seeing a hawk in the yard. How would you ideally respond?",
    choices: [
      {
        text: "Set up a bird observation journal and field guide, letting them classify and sketch what they find",
        dimensions: { structure: 1, direction: 2, modality: -2 },
        philosophies: { montessori: 3, place_nature: 2 },
      },
      {
        text: "Read living books about birds together, then go on a nature walk to observe",
        dimensions: { structure: 0, direction: 0, modality: 1 },
        philosophies: { charlotte_mason: 3, place_nature: 2 },
      },
      {
        text: "Help them research hawks and build a bird feeder, turning it into a week-long project",
        dimensions: { structure: 1, direction: 1, modality: -2 },
        philosophies: { project_based: 3, unschooling: 1 },
      },
      {
        text: "Use it as a jumping-off point for a zoology block with stories, watercolor painting, and songs",
        dimensions: { structure: -1, modality: -1, subjectApproach: -2 },
        philosophies: { waldorf: 3 },
      },
      {
        text: "Pull out the field guide and go outside together to look for more birds — let the backyard become the classroom",
        dimensions: { modality: -2, direction: 1, social: -1 },
        philosophies: { place_nature: 3, charlotte_mason: 1, unschooling: 1 },
      },
    ],
  },
  {
    id: "q2",
    theme: "What a typical morning looks like",
    scenario: "Imagine your ideal teaching morning. Which sounds closest to what you'd want?",
    choices: [
      {
        text: "A clear schedule: math lesson at 9, reading at 10, with specific curriculum pages to cover",
        dimensions: { structure: -3, modality: 2, direction: -2 },
        philosophies: { classical: 3, eclectic_flexible: 1 },
        subjectContext: "foundational",
      },
      {
        text: "The child chooses from prepared work stations — math manipulatives, reading corner, science shelf",
        dimensions: { structure: 1, direction: 2, modality: -1 },
        philosophies: { montessori: 3 },
      },
      {
        text: "We start with a story or song circle, then move into a hands-on main lesson block",
        dimensions: { structure: -1, modality: -2, social: -1 },
        philosophies: { waldorf: 3, charlotte_mason: 1 },
      },
      {
        text: "No fixed plan — we follow whatever the child is excited about and weave learning into it",
        dimensions: { structure: 3, direction: 3 },
        philosophies: { unschooling: 3, eclectic_flexible: 1 },
      },
      {
        text: "We cover core material like math and reading in the morning, then the rest of the day is for projects and interests the child chooses",
        dimensions: { structure: -1, direction: 1, subjectApproach: 1 },
        philosophies: { eclectic_flexible: 3, montessori: 1, project_based: 1 },
        subjectContext: "foundational",
      },
    ],
  },
  {
    id: "q3",
    theme: "How a child should learn to read",
    scenario: "Your 6-year-old is ready to start reading. Which approach feels right?",
    choices: [
      {
        text: "A structured phonics program with daily practice and clear progression through skills",
        dimensions: { structure: -3, modality: 2, direction: -2 },
        philosophies: { classical: 2, eclectic_flexible: 2 },
        subjectContext: "foundational",
      },
      {
        text: "Surround them with beautiful books, read aloud daily, and let reading emerge naturally",
        dimensions: { structure: 2, direction: 2, modality: 1 },
        philosophies: { waldorf: 2, charlotte_mason: 2, unschooling: 1 },
      },
      {
        text: "Use sandpaper letters and movable alphabets — let them physically build words",
        dimensions: { structure: 0, modality: -3, direction: 1 },
        philosophies: { montessori: 3 },
      },
      {
        text: "Incorporate reading into projects — labels for their fort, recipes for cooking, signs for a lemonade stand",
        dimensions: { structure: 1, direction: 1, modality: -1 },
        philosophies: { project_based: 2, unschooling: 2 },
        subjectContext: "foundational",
      },
      {
        text: "A mix of a structured phonics program and games, stories, and exploration of books — balance the systematic with the joyful",
        dimensions: { structure: -1, modality: 0, direction: 0 },
        philosophies: { eclectic_flexible: 2, charlotte_mason: 2, montessori: 1 },
        subjectContext: "foundational",
      },
    ],
  },
  {
    id: "q4",
    theme: "Approach when a child struggles with a concept",
    scenario: "Your child is frustrated with multiplication and says they hate math. What's your instinct?",
    choices: [
      {
        text: "Switch to manipulatives — use beads, blocks, or arrays they can touch and count",
        dimensions: { modality: -3, direction: -1 },
        philosophies: { montessori: 3, eclectic_flexible: 1 },
        subjectContext: "foundational",
      },
      {
        text: "Take a break from formal math and find multiplication in real life — baking, building, shopping",
        dimensions: { structure: 2, direction: 1, modality: -2 },
        philosophies: { unschooling: 2, project_based: 2 },
        subjectContext: "foundational",
      },
      {
        text: "Try a different curriculum or approach — maybe they need a different sequence or method",
        dimensions: { structure: -1, direction: -1 },
        philosophies: { eclectic_flexible: 3, classical: 1 },
        subjectContext: "foundational",
      },
      {
        text: "Use stories and rhythm — times tables as songs, skip counting through movement",
        dimensions: { modality: -2, social: -1 },
        philosophies: { waldorf: 3, charlotte_mason: 1 },
        subjectContext: "foundational",
      },
      {
        text: "Go back to basics and fill the gaps — sometimes frustration means a foundation piece was missed",
        dimensions: { structure: -2, direction: -2, modality: 1 },
        philosophies: { classical: 2, eclectic_flexible: 2 },
        subjectContext: "foundational",
      },
    ],
  },
  {
    id: "q5",
    theme: "Role of outdoor time and the physical world",
    scenario: "How does outdoor time fit into your vision of education?",
    choices: [
      {
        text: "It's the foundation — most real learning happens through direct experience with nature and place",
        dimensions: { modality: -3, social: -1, subjectApproach: -2 },
        philosophies: { place_nature: 3, unschooling: 1 },
      },
      {
        text: "Nature study is a regular subject — we do nature journaling, identify plants, and observe seasons",
        dimensions: { modality: -1, structure: -1 },
        philosophies: { charlotte_mason: 3, place_nature: 2 },
      },
      {
        text: "Outdoor time is for play and free exploration — separate from academic learning",
        dimensions: { modality: 2, structure: -1, social: 1 },
        philosophies: { classical: 2, eclectic_flexible: 2 },
      },
      {
        text: "We do projects outdoors when relevant — building a garden, measuring trees, mapping the neighborhood",
        dimensions: { modality: -2, subjectApproach: -1 },
        philosophies: { project_based: 3, place_nature: 1 },
      },
      {
        text: "Outdoor time is woven throughout — we take lessons outside, walk and discuss, and use the environment as a teaching tool",
        dimensions: { modality: -1, structure: 0, subjectApproach: -1 },
        philosophies: { charlotte_mason: 2, place_nature: 2, eclectic_flexible: 1 },
      },
    ],
  },
  {
    id: "q6",
    theme: "How subjects should relate to each other",
    scenario: "Your child is studying ancient Egypt. How do you approach the other subjects that week?",
    choices: [
      {
        text: "Everything connects: math through pyramid geometry, science through mummification, art through hieroglyphics",
        dimensions: { subjectApproach: -3, structure: 0 },
        philosophies: { waldorf: 2, project_based: 2, charlotte_mason: 1 },
      },
      {
        text: "Social studies covers Egypt, but math and reading follow their own separate sequences",
        dimensions: { subjectApproach: 3, structure: -2 },
        philosophies: { classical: 3, eclectic_flexible: 1 },
        subjectContext: "foundational",
      },
      {
        text: "Let the child's interest guide how far the connections go — maybe they'll want to build a model pyramid, maybe not",
        dimensions: { subjectApproach: -1, direction: 3 },
        philosophies: { unschooling: 2, montessori: 2 },
      },
      {
        text: "Use it as a project anchor — the child researches, creates a presentation, and teaches the family what they learned",
        dimensions: { subjectApproach: -2, direction: 1, social: -2 },
        philosophies: { project_based: 3 },
      },
      {
        text: "Math and reading stay on track with their own curriculum, but I'd weave Egypt into science, art, and geography where it fits naturally",
        dimensions: { subjectApproach: 1, structure: -1 },
        philosophies: { eclectic_flexible: 3, charlotte_mason: 1 },
        subjectContext: "foundational",
      },
    ],
  },
  {
    id: "q7",
    theme: "Feelings about testing and assessment",
    scenario: "How do you feel about formal assessments and tracking progress?",
    choices: [
      {
        text: "Regular assessments help me know what to focus on — I like seeing measurable progress",
        dimensions: { structure: -3, direction: -2 },
        philosophies: { classical: 3, eclectic_flexible: 1 },
      },
      {
        text: "I observe carefully and keep notes. Narrative assessments and observations tell me what I need to know.",
        dimensions: { structure: 0, direction: 0 },
        philosophies: { montessori: 2, charlotte_mason: 2 },
      },
      {
        text: "The child's portfolio of work and projects tells me everything I need to know",
        dimensions: { structure: 1, direction: 1 },
        philosophies: { project_based: 2, waldorf: 1, eclectic_flexible: 1 },
      },
      {
        text: "I trust the process — if they're engaged and curious, they're learning",
        dimensions: { structure: 3, direction: 3 },
        philosophies: { unschooling: 3, place_nature: 1 },
      },
      {
        text: "A mix — periodic check-ins for core skills like reading and math, but informal observation for everything else",
        dimensions: { structure: -1, direction: 0, subjectApproach: 1 },
        philosophies: { eclectic_flexible: 3, charlotte_mason: 1 },
        subjectContext: "foundational",
      },
    ],
  },
  {
    id: "q8",
    theme: "What a good day of learning looks like",
    scenario: "At the end of the day, what makes you feel like it was a great day of learning?",
    choices: [
      {
        text: "We completed the planned lessons and my child demonstrated understanding of new concepts",
        dimensions: { structure: -3, direction: -2, modality: 1, subjectApproach: 2 },
        philosophies: { classical: 3 },
      },
      {
        text: "My child was deeply absorbed in something for hours — they lost track of time exploring",
        dimensions: { structure: 3, direction: 3, modality: -1 },
        philosophies: { unschooling: 2, montessori: 2 },
      },
      {
        text: "We created something together — a project, a meal, an experiment — and talked about what we learned",
        dimensions: { modality: -3, social: -2, direction: 0 },
        philosophies: { project_based: 2, place_nature: 1, waldorf: 1 },
      },
      {
        text: "We had a mix of structured lessons and free exploration, with plenty of time outdoors",
        dimensions: { structure: 0, modality: -1, social: 0 },
        philosophies: { charlotte_mason: 2, eclectic_flexible: 2, place_nature: 1 },
      },
      {
        text: "My child learned something new alongside other kids — group work, discussion, and shared discovery",
        dimensions: { social: -3, direction: 0, modality: -1 },
        philosophies: { project_based: 2, classical: 1, place_nature: 1 },
      },
    ],
  },
  {
    id: "q9",
    theme: "Working with other families or independently",
    scenario: "A local homeschool co-op invites you to join. What's your reaction?",
    choices: [
      {
        text: "I'd love it — learning is better with a community, and kids need social interaction around academics",
        dimensions: { social: -3, structure: -1 },
        philosophies: { project_based: 1, classical: 2, place_nature: 1 },
      },
      {
        text: "I'd join for specific subjects like science labs or art, but keep core academics at home",
        dimensions: { social: -1, subjectApproach: 1 },
        philosophies: { eclectic_flexible: 3 },
      },
      {
        text: "I prefer our own rhythm — we'd do social activities separately from academics",
        dimensions: { social: 2, direction: 1 },
        philosophies: { montessori: 1, unschooling: 2, charlotte_mason: 1 },
      },
      {
        text: "I'd want to help organize it — collaborative projects and group field trips are valuable",
        dimensions: { social: -3, modality: -1 },
        philosophies: { project_based: 2, place_nature: 2 },
      },
      {
        text: "I'd try it out and see — take what works, leave what doesn't, and supplement at home as needed",
        dimensions: { social: -1, structure: 0, direction: 0 },
        philosophies: { eclectic_flexible: 3, charlotte_mason: 1 },
      },
    ],
  },
  {
    id: "q10",
    theme: "Handling a topic the child has no interest in",
    scenario: "Your child needs to learn about fractions but has zero interest. What do you do?",
    choices: [
      {
        text: "Teach it anyway with a solid curriculum — some things just need to be learned whether they're fun or not",
        dimensions: { structure: -3, direction: -3 },
        philosophies: { classical: 3, eclectic_flexible: 1 },
        subjectContext: "foundational",
      },
      {
        text: "Find a way to connect fractions to their interests — if they love cooking, use recipes",
        dimensions: { structure: 0, direction: 1, subjectApproach: -1 },
        philosophies: { montessori: 1, eclectic_flexible: 2, project_based: 1 },
        subjectContext: "foundational",
      },
      {
        text: "Wait until they encounter fractions naturally and are ready — it'll stick better then",
        dimensions: { structure: 3, direction: 3 },
        philosophies: { unschooling: 3 },
        subjectContext: "foundational",
      },
      {
        text: "Use hands-on materials — fraction tiles, pizza cutting, measuring cups — make it concrete",
        dimensions: { modality: -3, direction: -1 },
        philosophies: { montessori: 2, waldorf: 1, charlotte_mason: 1 },
        subjectContext: "foundational",
      },
      {
        text: "Set it aside for now and come back in a few weeks with a different angle — sometimes they just need time to mature into a concept",
        dimensions: { structure: 1, direction: 1 },
        philosophies: { waldorf: 2, charlotte_mason: 2, eclectic_flexible: 1 },
        subjectContext: "foundational",
      },
    ],
  },
];

export const PART2_QUESTIONS: Part2Question[] = [
  {
    id: "p2_subjects",
    question: "Which subjects are you looking for curriculum for?",
    type: "multi",
    choices: [
      { value: "literacy", label: "Literacy / Language Arts" },
      { value: "math", label: "Math" },
      { value: "science", label: "Science" },
      { value: "social_studies", label: "Social Studies" },
    ],
  },
  {
    id: "p2_organization",
    question: "How do you prefer to organize your curriculum?",
    type: "single",
    choices: [
      { value: "integrated", label: "One program covering everything" },
      { value: "separate", label: "Pick the best for each subject separately" },
      { value: "open", label: "Open to either" },
    ],
  },
  {
    id: "p2_prep_time",
    question: "Think about a typical week. After everything else — work, meals, errands, life — how much time do you realistically have to prepare for teaching?",
    type: "single",
    choices: [
      { value: "none", label: "Almost none — I need to open it and go" },
      { value: "light", label: "About 15-30 minutes per week" },
      { value: "moderate", label: "About 1-2 hours per week" },
      { value: "heavy", label: "I enjoy planning and will make the time — 3+ hours is fine" },
    ],
  },
  {
    id: "p2_religious",
    question: "Do you have a preference for faith-based or secular materials?",
    type: "single",
    choices: [
      { value: "secular", label: "Secular only" },
      { value: "christian", label: "Faith-based (Christian)" },
      { value: "other_faith", label: "Faith-based (other)" },
      { value: "no_preference", label: "No preference" },
    ],
  },
  {
    id: "p2_faith_depth",
    question: "How integrated should faith be in the curriculum?",
    type: "single",
    showWhen: { questionId: "p2_religious", values: ["christian", "other_faith"] },
    choices: [
      { value: "fully_integrated", label: "Woven into every subject and lesson" },
      { value: "worldview", label: "Christian worldview but subjects taught straightforwardly" },
      { value: "light", label: "Light integration — prayers or devotionals alongside standard content" },
    ],
  },
  {
    id: "p2_budget",
    question: "What's your budget range per subject per year?",
    type: "single",
    choices: [
      { value: "under_50", label: "Under $50" },
      { value: "50_150", label: "$50 - $150" },
      { value: "150_300", label: "$150 - $300" },
      { value: "over_300", label: "Over $300" },
      { value: "not_a_factor", label: "Not a factor" },
    ],
  },
  {
    id: "p2_grades",
    question: "What grade level(s) are you teaching?",
    type: "multi",
    choices: [
      { value: "K", label: "Kindergarten" },
      { value: "1", label: "1st" },
      { value: "2", label: "2nd" },
      { value: "3", label: "3rd" },
      { value: "4", label: "4th" },
      { value: "5", label: "5th" },
      { value: "6", label: "6th" },
      { value: "7", label: "7th" },
      { value: "8", label: "8th" },
      { value: "9", label: "9th" },
      { value: "10", label: "10th" },
      { value: "11", label: "11th" },
      { value: "12", label: "12th" },
    ],
  },
  {
    id: "p2_screen_time",
    question: "How do you feel about screen-based lessons and video instruction in your curriculum?",
    type: "single",
    choices: [
      { value: "avoid", label: "I want to avoid screens entirely — books, hands-on, and conversation only" },
      { value: "minimal", label: "Minimal screens — occasional educational videos are fine, but not the core method" },
      { value: "some", label: "Some screen time is fine — video lessons can be a helpful teaching tool" },
      { value: "welcome", label: "I welcome it — video instruction and apps help my child learn independently" },
    ],
  },
  {
    id: "p2_learning_needs",
    question: "Does your child have any of the following learning needs? (Select all that apply)",
    type: "multi",
    choices: [
      { value: "dyslexia", label: "Dyslexia or reading difficulty" },
      { value: "adhd", label: "ADHD or attention challenges" },
      { value: "gifted", label: "Gifted / needs more challenge" },
      { value: "none", label: "None of the above" },
    ],
  },
  {
    id: "p2_setting",
    question: "What best describes your setting?",
    type: "single",
    choices: [
      { value: "home", label: "Home-based family" },
      { value: "coop", label: "Co-op or learning group" },
      { value: "micro_school", label: "Micro school" },
      { value: "private_school", label: "Small private school" },
      { value: "other", label: "Other" },
    ],
  },
];
