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
        philosophies: { place_nature: 3, unschooling: 1 },
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
        text: "Try contextualizing math into their environment — how many tiles on the floor? How far is it to the park? Let them see how the problem applies to life around them",
        dimensions: { modality: -2, direction: 0, subjectApproach: -1 },
        philosophies: { place_nature: 3, project_based: 1 },
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
        text: "The outdoor environment is a prepared space — sensory bins with natural materials, a garden to tend, practical life skills like composting",
        dimensions: { modality: -2, direction: 1, structure: -1 },
        philosophies: { montessori: 3, place_nature: 1 },
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
        text: "Connect it to our place — what ancient civilizations lived near us? What can we learn from local archaeology, geography, and the land we're standing on?",
        dimensions: { subjectApproach: -2, modality: -1, social: -1 },
        philosophies: { place_nature: 3, project_based: 1 },
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
  {
    id: "q11",
    theme: "How the learning environment should look",
    scenario: "If you could design your ideal learning space, what would it look like?",
    choices: [
      {
        text: "Organized shelves with materials at the child's height — everything in its place, ready for the child to choose",
        dimensions: { structure: -1, direction: 1, modality: -2 },
        philosophies: { montessori: 3, eclectic_flexible: 1 },
      },
      {
        text: "A cozy reading nook, a nature table with seasonal treasures, and art supplies always within reach",
        dimensions: { modality: 0, structure: 0 },
        philosophies: { charlotte_mason: 2, waldorf: 2, place_nature: 1 },
      },
      {
        text: "A workshop — tools, building materials, a whiteboard for planning, and space to spread out big projects",
        dimensions: { modality: -3, subjectApproach: -1, social: -1 },
        philosophies: { project_based: 3, place_nature: 1 },
      },
      {
        text: "Honestly, the whole house is the classroom — the kitchen, the yard, wherever we happen to be",
        dimensions: { structure: 2, direction: 2 },
        philosophies: { unschooling: 3, place_nature: 1 },
      },
      {
        text: "A proper desk and bookshelf area — quiet, organized, with a schedule posted on the wall",
        dimensions: { structure: -3, modality: 2, direction: -2 },
        philosophies: { classical: 3, eclectic_flexible: 1 },
      },
    ],
  },
  {
    id: "q12",
    theme: "Role of art and creativity",
    scenario: "How important is art and creative expression in your approach to education?",
    choices: [
      {
        text: "Art is woven into everything — watercolor painting, beeswax modeling, handwork, and music are daily practices",
        dimensions: { modality: -2, subjectApproach: -2 },
        philosophies: { waldorf: 3, charlotte_mason: 1 },
      },
      {
        text: "Creative expression happens naturally through projects — building, designing, presenting, and problem-solving",
        dimensions: { modality: -2, direction: 1 },
        philosophies: { project_based: 3, eclectic_flexible: 1 },
      },
      {
        text: "Art is a separate subject we enjoy, but it doesn't need to be in every lesson",
        dimensions: { subjectApproach: 2, structure: -1 },
        philosophies: { classical: 2, eclectic_flexible: 2 },
      },
      {
        text: "I follow the child's lead — if they want to draw for three hours, that IS the lesson",
        dimensions: { direction: 3, structure: 2 },
        philosophies: { unschooling: 3, montessori: 1 },
      },
      {
        text: "Nature itself is the art — sketching what we observe, pressing flowers, creating with found materials",
        dimensions: { modality: -2, direction: 1, social: 0 },
        philosophies: { place_nature: 3, charlotte_mason: 2 },
      },
    ],
  },
  {
    id: "q13",
    theme: "Approach to social learning and collaboration",
    scenario: "How do you think about the social side of learning?",
    choices: [
      {
        text: "Group projects and collaborative work are essential — children learn by working together toward shared goals",
        dimensions: { social: -3, direction: 0 },
        philosophies: { project_based: 2, place_nature: 1, classical: 1 },
      },
      {
        text: "Mixed-age interaction is valuable — older children mentoring younger ones is how real communities work",
        dimensions: { social: -2, direction: 1 },
        philosophies: { montessori: 2, waldorf: 1, place_nature: 1 },
      },
      {
        text: "Social learning happens through real life — errands, community service, play dates — not structured academics",
        dimensions: { social: 1, direction: 2, structure: 1 },
        philosophies: { unschooling: 3, eclectic_flexible: 1 },
      },
      {
        text: "Socratic discussion and narration — the child tells back what they've learned, and we discuss ideas together",
        dimensions: { social: 0, modality: 1, direction: -1 },
        philosophies: { charlotte_mason: 2, classical: 2 },
      },
      {
        text: "I value one-on-one time — individualized attention is why we chose this path in the first place",
        dimensions: { social: 3, direction: -1 },
        philosophies: { montessori: 1, eclectic_flexible: 2, classical: 1 },
      },
    ],
  },
  {
    id: "q14",
    theme: "How you'd teach a unit on weather",
    scenario: "You want to teach your child about weather and seasons. How do you approach it?",
    choices: [
      {
        text: "We go outside every day and observe — temperature, clouds, wind. We keep a weather journal and track patterns over weeks",
        dimensions: { modality: -2, direction: 0 },
        philosophies: { place_nature: 3, charlotte_mason: 2 },
      },
      {
        text: "We build a weather station, make a barometer from a jar, and run experiments with evaporation and condensation",
        dimensions: { modality: -3, subjectApproach: -1 },
        philosophies: { project_based: 3, montessori: 1 },
      },
      {
        text: "We read a textbook chapter on weather systems, do the worksheet, and take a quiz at the end of the unit",
        dimensions: { structure: -3, modality: 2, direction: -2 },
        philosophies: { classical: 3 },
      },
      {
        text: "We don't plan a weather unit — but when a big storm comes, we follow the curiosity and learn about it then",
        dimensions: { structure: 3, direction: 3 },
        philosophies: { unschooling: 3, eclectic_flexible: 1 },
      },
      {
        text: "We learn about weather through stories, songs, and painting — a rainy day watercolor, a poem about autumn, a story about the wind",
        dimensions: { modality: -1, subjectApproach: -2 },
        philosophies: { waldorf: 3, charlotte_mason: 1 },
      },
    ],
  },
  {
    id: "q15",
    theme: "Following a scope and sequence",
    scenario: "How do you feel about following a set scope and sequence for your child's education?",
    choices: [
      {
        text: "A clear scope and sequence keeps us on track — I want to know we're covering everything",
        dimensions: { structure: -3, direction: -2 },
        philosophies: { classical: 3 },
      },
      {
        text: "I like having a general guide but adapt the pace and order to my child",
        dimensions: { structure: -1, direction: 0 },
        philosophies: { eclectic_flexible: 3, charlotte_mason: 1 },
      },
      {
        text: "The child's developmental stage determines what we study, not a predetermined sequence",
        dimensions: { structure: 0, direction: 1 },
        philosophies: { waldorf: 3, montessori: 1 },
      },
      {
        text: "I set up the environment with materials at different levels and let the child progress naturally through them",
        dimensions: { structure: -1, direction: 2, modality: -1 },
        philosophies: { montessori: 3 },
      },
      {
        text: "We don't follow a sequence — interests and seasons guide what we explore",
        dimensions: { structure: 2, direction: 2 },
        philosophies: { place_nature: 2, unschooling: 2 },
      },
    ],
  },
  {
    id: "q16",
    theme: "Starting a new topic",
    scenario: "Your child wants to learn about the ocean. How do you start?",
    choices: [
      {
        text: "Visit the beach or aquarium — direct experience with the real thing comes first",
        dimensions: { modality: -3, direction: 0 },
        philosophies: { place_nature: 3, charlotte_mason: 1 },
      },
      {
        text: "Gather beautiful ocean books, poems, and artwork — immerse in the wonder through stories",
        dimensions: { modality: 1, direction: -1 },
        philosophies: { charlotte_mason: 3, waldorf: 1 },
      },
      {
        text: "Paint an ocean scene, learn sea shanties, and model clay sea creatures before any textbook work",
        dimensions: { modality: -2, subjectApproach: -2 },
        philosophies: { waldorf: 3 },
      },
      {
        text: "Research together and plan a project — maybe build a model ecosystem or start a saltwater observation jar",
        dimensions: { modality: -2, direction: 0, subjectApproach: -1 },
        philosophies: { project_based: 3, montessori: 1 },
      },
      {
        text: "Let them lead — they might want to draw fish, or read about sharks, or watch a documentary. Follow the thread",
        dimensions: { direction: 3, structure: 1 },
        philosophies: { unschooling: 2, eclectic_flexible: 1 },
      },
    ],
  },
  {
    id: "q17",
    theme: "Rhythm and routine",
    scenario: "What role should rhythm and routine play in your learning day?",
    choices: [
      {
        text: "A strong daily rhythm — morning circle, main lesson block, creative time, outdoor time — gives children security",
        dimensions: { structure: -2, direction: -1 },
        philosophies: { waldorf: 3 },
      },
      {
        text: "Short lessons in the morning with defined subjects, then free time for nature study and handicrafts",
        dimensions: { structure: -1, modality: 0 },
        philosophies: { charlotte_mason: 3 },
      },
      {
        text: "A consistent work period where the child chooses from prepared activities at their own pace",
        dimensions: { structure: -1, direction: 2, modality: -1 },
        philosophies: { montessori: 3 },
      },
      {
        text: "Routine matters for core skills, but the rest of the day should flex based on what comes up",
        dimensions: { structure: 0, direction: 0 },
        philosophies: { eclectic_flexible: 2, place_nature: 1 },
        subjectContext: "foundational",
      },
      {
        text: "We have rhythms but not rigid routines — some days we're at the table, some days we're outside all day",
        dimensions: { structure: 1, direction: 1 },
        philosophies: { place_nature: 2, unschooling: 1 },
      },
    ],
  },
  {
    id: "q18",
    theme: "Teaching history or social studies",
    scenario: "How do you approach teaching history or social studies?",
    choices: [
      {
        text: "Start with our own community — local history, neighborhood walks, interviewing elders",
        dimensions: { modality: -2, social: -1, subjectApproach: -1 },
        philosophies: { place_nature: 3, project_based: 1 },
      },
      {
        text: "Living books and biographies — let the child hear the stories of real people and narrate them back",
        dimensions: { modality: 1, direction: 0 },
        philosophies: { charlotte_mason: 3 },
        subjectContext: "exploratory",
      },
      {
        text: "Through story, art, and drama — the child experiences each era, not just reads about it",
        dimensions: { modality: -1, subjectApproach: -2 },
        philosophies: { waldorf: 3 },
      },
      {
        text: "Chronological, systematic study — timeline, key events, primary sources, and discussion",
        dimensions: { structure: -3, modality: 2, subjectApproach: 2 },
        philosophies: { classical: 3 },
      },
      {
        text: "It comes up naturally — a museum trip, a news event, a question about why things are the way they are",
        dimensions: { structure: 2, direction: 2 },
        philosophies: { unschooling: 2, eclectic_flexible: 1 },
        subjectContext: "exploratory",
      },
    ],
  },
  {
    id: "q19",
    theme: "Workbooks and worksheets",
    scenario: "How do you feel about workbooks and worksheets?",
    choices: [
      {
        text: "They have their place — good for math practice and spelling reinforcement",
        dimensions: { structure: -1, modality: 2 },
        philosophies: { classical: 2, eclectic_flexible: 2 },
        subjectContext: "foundational",
      },
      {
        text: "I prefer hands-on materials — real objects to manipulate, not paper exercises",
        dimensions: { modality: -3, direction: 1 },
        philosophies: { montessori: 3, place_nature: 1 },
      },
      {
        text: "Narration and copywork are better than worksheets — children learn by telling back and writing beautifully",
        dimensions: { modality: 0, direction: -1 },
        philosophies: { charlotte_mason: 3 },
      },
      {
        text: "I avoid them entirely — real-world experience teaches more than any worksheet",
        dimensions: { modality: -2, structure: 2, direction: 1 },
        philosophies: { place_nature: 2, unschooling: 2 },
      },
      {
        text: "They're fine occasionally but shouldn't be the main method — variety keeps things engaging",
        dimensions: { structure: 0, modality: 0 },
        philosophies: { eclectic_flexible: 2, waldorf: 1 },
      },
    ],
  },
  {
    id: "q20",
    theme: "What success looks like",
    scenario: "What does 'success' look like at the end of a school year?",
    choices: [
      {
        text: "My child can demonstrate mastery of grade-level skills through assessments or portfolio review",
        dimensions: { structure: -3, direction: -2 },
        philosophies: { classical: 3 },
      },
      {
        text: "My child has developed a deep connection to the natural world and their community",
        dimensions: { modality: -1, social: -1 },
        philosophies: { place_nature: 3 },
      },
      {
        text: "My child is more independent — choosing their own work and pursuing deeper understanding",
        dimensions: { direction: 3, structure: 0 },
        philosophies: { montessori: 3 },
      },
      {
        text: "My child has grown as a whole person — artistically, emotionally, physically, not just academically",
        dimensions: { modality: -1, subjectApproach: -2 },
        philosophies: { waldorf: 3 },
      },
      {
        text: "My child is still curious and loves learning — that's the only metric that matters",
        dimensions: { direction: 2, structure: 2 },
        philosophies: { unschooling: 2, eclectic_flexible: 1 },
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
