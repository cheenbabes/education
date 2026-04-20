/**
 * Static sample lessons, one per teaching philosophy.
 *
 * Rendered at /compass/sample/[philosophy] as a pre-generated "proof" of what
 * a lesson in that philosophy looks like. No AI generation, no wait, no auth.
 *
 * Content was authored in-product by the founder, then copied here so the
 * sample pages are fully static. sourceLessonId preserves the origin in the
 * Lesson table for reference. To refresh: re-generate via /create, then pull
 * the latest by philosophy and re-run tmp/sample-lessons/transform.mjs.
 */
import type { PhilosophyId } from "@/lib/types";

export interface SampleLessonSection {
  type: string;
  title: string;
  instructions: string;
  durationMinutes?: number;
  tips?: string[];
  philosophyConnection?: string;
}

export interface SampleLesson {
  /** Live Lesson.id this was copied from — for traceability only */
  sourceLessonId: string;
  philosophyId: PhilosophyId;
  philosophyLabel: string;
  title: string;
  theme?: string;
  /** First child's grade from the generation — displayed as "Grade N" */
  grade: string;
  /** Primary subject label for the subtitle pill */
  subject: string;
  subjects?: string[];
  sections: SampleLessonSection[];
  standards?: string[];
  cleanupNotes?: string;
}

export const SAMPLE_LESSONS: Record<PhilosophyId, SampleLesson> = {
  "classical": {
    "sourceLessonId": "cmo7qxau6002eccgsthscdr5c",
    "philosophyId": "classical",
    "philosophyLabel": "Classical",
    "title": "A Bouquet of Words: Reading, Reciting, and Writing Flower Poetry",
    "theme": "Poetry, flowers",
    "grade": "4",
    "subject": "Language Arts",
    "subjects": [
      "Language Arts"
    ],
    "sections": [
      {
        "type": "introduction",
        "title": "Opening Recitation & Purpose (Grammar Stage Warm-Up)",
        "instructions": "Tell Clementine: “Today we’ll read a flower poem like a classical student—first we gather the words (grammar), then we think about what they mean (logic), and finally we make our own poem (rhetoric).”\n\nChoose 2–4 lines from your selected flower poem (or a short, memorable couplet). Read them aloud with clear expression. Have Clementine echo you line-by-line. Read the same lines a second time together.\n\nAsk: “Which word or phrase sounds most beautiful to you? Why?” Write her chosen phrase at the top of the page as today’s ‘treasured line.’",
        "durationMinutes": 8,
        "tips": [
          "Keep the first recitation light and confident; you can carry the rhythm and let her join in gradually.",
          "If she stumbles, simply reread the line and have her repeat—no need to correct every small error yet."
        ],
        "philosophyConnection": "This sets an orderly Trivium pathway and begins with memorization/recitation—foundational classical tools for language mastery."
      },
      {
        "type": "exploration",
        "title": "Shared Reading: Flower Poem Close Read (Main Idea/Theme + Evidence)",
        "instructions": "Read the full poem aloud once while Clementine follows along. Then have her read one stanza (or 6–10 lines) aloud. Reread that same portion a second time.\n\nNow guide a short, structured discussion. Ask and jot quick notes in her notebook:\n1) “What is the poem mostly about—what do you think the poet wants us to notice?” (topic)\n2) “What is the message or theme?” (e.g., joy, fleeting beauty, hope, gratitude)\n3) “Which two lines best support your idea?” Have her point to the lines; you copy them exactly as ‘text evidence.’\n\nFinish with a 2–3 sentence oral summary: “In this poem, the poet describes… The main message seems to be… I know because…”",
        "durationMinutes": 15,
        "tips": [
          "If theme feels abstract, offer two theme choices and ask her to defend one with a line from the poem.",
          "Model how to quote exactly by using quotation marks when you copy a line."
        ],
        "philosophyConnection": "Classical learning is word-centered and discussion-based; Clementine practices attentive reading, narration, and citing the author’s words (a primary text) as evidence."
      },
      {
        "type": "practice",
        "title": "Vocabulary & Word Relationships: Synonyms, Antonyms, and Context Clues",
        "instructions": "Pick 4–6 key words from the poem (choose ones that are vivid or slightly unfamiliar). For each word:\n- Ask Clementine to reread the line and guess the meaning from context.\n- Then ask for one synonym and one antonym.\n- If needed, check a dictionary together and refine the synonym/antonym.\n\nWrite each word in a simple three-column chart:\nWord | Synonym | Antonym\n\nClose by asking her to choose one of the words and use it in a clear, complete sentence of her own (not poetic yet—just correct and straightforward).",
        "durationMinutes": 12,
        "tips": [
          "If she struggles with antonyms, offer two choices and let her select the best opposite.",
          "Prefer fewer words done well over many words rushed."
        ],
        "philosophyConnection": "This is classical ‘grammar’ work: building precise vocabulary through definition, relationships among words, and repeated practice for mastery."
      },
      {
        "type": "exploration",
        "title": "Outdoor Flower Observation: Gather Sensory Details (Poet’s Notebooking)",
        "instructions": "Go outside with the notebook (or bring a flower to the porch/yard). Choose one flower to study closely.\n\nHave Clementine do a quiet ‘minute of looking.’ Then prompt her to collect details under headings:\n- Sight: colors, shapes, patterns, size comparisons\n- Smell: strong/faint/sweet/earthy (or “no smell”)\n- Touch (if safe): smooth/velvety/waxy/prickly\n- Movement: still/nodding/swaying\n\nAsk her to sketch the flower quickly (30–60 seconds) and label 3 parts with words (petal, stem, bud, leaf). End by choosing 3 “best words” she wants to use later in her poem.",
        "durationMinutes": 10,
        "tips": [
          "If allergies or weather make outdoors hard, observe a flower in a vase by a window and keep the same notebook headings.",
          "Keep the sketch simple—this is for noticing, not art perfection."
        ],
        "philosophyConnection": "Classical education values careful observation and precise language; this section supplies concrete ‘matter’ for later rhetoric (composition) and strengthens vocabulary with real-world referents."
      },
      {
        "type": "practice",
        "title": "Rhetoric Practice: Write a Flower Poem (Draft + Quick Edit + Recite)",
        "instructions": "Return indoors. Tell Clementine: “Now you’ll use your gathered words to make something beautiful and true.”\n\nStep 1: Plan (2 minutes). Choose one structure:\nA) 8–12 lines free verse, or\nB) Two quatrains (2 stanzas of 4 lines).\nWrite her choice at the top.\n\nStep 2: Draft (8 minutes). Encourage her to:\n- Use at least 6 sensory words from the outdoor list.\n- Include one comparison (a simile using ‘like’ or ‘as’).\n- Include one strong verb (sway, unfurl, tremble, glow).\n\nStep 3: Quick classical edit (3 minutes). Read it aloud together and check:\n- Are there capitals and end punctuation where she wants full sentences?\n- Are any lines meant to be fragments for effect (and is that choice intentional)?\n- Replace one ordinary word with a more precise one (using her synonym list).\n\nStep 4: Recitation (2 minutes). Have her read her poem aloud with clear voice and pacing. If appropriate, practice a slightly more formal ‘presentation voice’ for the recitation than for casual conversation.",
        "durationMinutes": 15,
        "tips": [
          "If she freezes, let her dictate lines to you first; then she copies them as her final poem (copywork supports spelling and style).",
          "Praise specific craft choices (“That verb is exact,” “That image helps me see it”) rather than general praise."
        ],
        "philosophyConnection": "This culminates in rhetoric: expressing ideas beautifully and clearly, built on earlier grammar work (vocabulary) and logic work (theme/evidence). Reading aloud and revising reflect classical composition habits."
      }
    ],
    "standards": [],
    "cleanupNotes": "Bring the notebook and any collected specimen/petal back inside. If you used index cards, keep them clipped together in the poetry notebook for quick review next time. Shake out any outdoor debris and return pencils to a consistent ‘writing basket’ to support orderly routines."
  },
  "montessori-inspired": {
    "sourceLessonId": "cmo7quuty0026ccgsgtogejn3",
    "philosophyId": "montessori-inspired",
    "philosophyLabel": "Montessori-Inspired",
    "title": "Ecosystem Detectives: Building a Backyard Food Web",
    "theme": "Ecosystems",
    "grade": "1",
    "subject": "Science",
    "subjects": [
      "Science"
    ],
    "sections": [
      {
        "type": "introduction",
        "title": "Prepare the Environment: Set Up the Nature Detective Kit",
        "instructions": "Invite Mary to help you prepare a calm workspace. Place the tray/basket on a table with paper, pencil, colors, and cards. Tell her: “Today you’re an Ecosystem Detective. You get to choose what living things and nonliving things you’ll look for.”\n\nShow her the three categories you’ll use today: Living (plants/animals), Nonliving (sunlight, water, rocks, soil, air), and ‘Evidence’ (tracks, holes in leaves, feathers, chewed acorns). Keep it brief and concrete. Ask her to choose a spot to observe outside (give 2–3 choices).",
        "durationMinutes": 10,
        "tips": [
          "Keep adult talk minimal—name the categories once, then let her begin.",
          "If she wants to add an item to the kit (binoculars, bug box), allow it as long as it supports careful observation."
        ],
        "philosophyConnection": "You create a prepared environment with orderly, accessible materials, then offer freedom within structure by letting Mary choose the observation site and recording method."
      },
      {
        "type": "exploration",
        "title": "Outdoor Exploration: Observe and Collect Data (Without Taking Living Things)",
        "instructions": "Go to Mary’s chosen spot. Set a gentle boundary: “We look with our eyes and hands, and we leave living things where they are.”\n\nAsk her to do a slow ‘detective scan’ for 5 minutes: first look low (ground), then middle (bushes), then high (trees/sky). Each time she notices something, she can record it in one of three ways (her choice):\n1) Draw it quickly, \n2) Write a word (you can scribe if needed), or \n3) Use a token system—one token per thing observed.\n\nPrompt with quiet questions only when needed: “Is that living or nonliving?” “What evidence shows an animal was here?” Encourage her to notice relationships: “What might eat that?” “Where might it get water?”\n\nAim for at least: 3 living things (e.g., grass, ant, bird), 2 nonliving things (sun, soil), and 1 piece of evidence (hole in leaf, web, nest).",
        "durationMinutes": 20,
        "tips": [
          "If Mary is unsure whether something is living, invite her to look for growth, movement, or needs (water/light/food) rather than correcting quickly.",
          "Take a photo of anything she wants to remember instead of collecting it."
        ],
        "philosophyConnection": "This is reality-based, sensory learning in nature (Cosmic Education), with the adult as observer. Mary gathers real evidence and classifies it from concrete experience."
      },
      {
        "type": "practice",
        "title": "Classification Work: Living, Nonliving, Evidence (Three-Part Card Style)",
        "instructions": "Back inside, invite Mary to lay out her findings neatly. Give her 12–20 small cards. Ask her to make cards for what she observed (one item per card). She can draw or write (or you write the label under her drawing).\n\nPlace three heading cards at the top: LIVING, NONLIVING, EVIDENCE. Ask her to sort her cards under the headings. Let the materials provide control of error: if a card doesn’t seem to fit, encourage her to move it and decide again.\n\nWhen she finishes, ask her to choose two cards and tell you one sentence about each: “This is living because…” or “This is nonliving but it helps living things by…”",
        "durationMinutes": 10,
        "tips": [
          "If she resists writing, accept drawings and add labels lightly in small print.",
          "Keep the number of cards manageable; stop while she’s still enjoying it."
        ],
        "philosophyConnection": "Montessori-style classification builds mental order from concrete experience, isolates the difficulty (sorting by one attribute), and supports independence through self-correction."
      },
      {
        "type": "practice",
        "title": "Make a Food Web Model: Who Needs What?",
        "instructions": "Tell Mary she will build a simple model of her ecosystem connections. Choose 5–8 of her cards (let her pick). Include at least one plant.\n\nOn the floor or table, spread the chosen cards out. Introduce three simple roles (keep it concrete):\n- Plants (make their own food with sunlight)\n- Animals that eat plants\n- Animals that eat other animals\n\nNow add connections using yarn/string (or drawn arrows). Use language like: “The arrow shows energy/food goes from ___ to ___.” For example: plant → caterpillar → bird.\n\nLet Mary experiment. If she makes a connection that seems unlikely, ask: “What evidence do we have?” and offer a choice: keep it as a ‘maybe’ connection or swap a card.\n\nFinish by having her ‘read’ her web aloud: “The bird needs the tree because…”",
        "durationMinutes": 15,
        "tips": [
          "Use only a few cards so she can succeed and repeat the work later with more complexity.",
          "If yarn feels fiddly, draw arrows with a marker—same concept, less frustration."
        ],
        "philosophyConnection": "This moves from concrete observation to an abstract idea (interdependence) through hands-on modeling, supporting Cosmic Education and child-led discovery."
      },
      {
        "type": "exploration",
        "title": "Design to Help: Build Two Mini Solutions and Compare",
        "instructions": "Ask Mary: “Is there a helper we could make for this ecosystem?” Offer two simple problem choices:\n1) “Small animals/insects need shelter,” or\n2) “Pollinators need a place to rest and drink water.”\n\nHelp her choose one problem. Then invite her to make TWO quick designs (very small, 2–3 minutes each) using cardboard/tube/tape and natural materials:\n- Design A and Design B should have one clear difference (shape, entrance size, or where it will sit).\n\nDo a tiny ‘test’ by placing them where they would go (outside if possible) and using a simple checklist: stable/not stable, dry/not dry, easy to enter/hard to enter. Ask her which is better and why.",
        "durationMinutes": 5,
        "tips": [
          "Keep it truly quick—today is about the idea and comparison, not a perfect build.",
          "If outdoors isn’t possible, ‘test’ with a gentle fan breath for wind and a few drops of water for rain."
        ],
        "philosophyConnection": "This is practical, purposeful work (Preparation for Life) grounded in real needs of living things, and it includes simple engineering comparison with minimal adult intervention."
      }
    ],
    "standards": [],
    "cleanupNotes": "Invite Mary to return cards to a labeled envelope and wind yarn onto a small piece of cardboard. Let her choose one item to display (food web or classification chart). If you used natural materials, return any living items outdoors and compost/recycle scraps when possible."
  },
  "place-nature-based": {
    "sourceLessonId": "cmo7qrcuy001vccgs7qlofjkt",
    "philosophyId": "place-nature-based",
    "philosophyLabel": "Place/Nature-Based",
    "title": "Backyard Foraging & Food Systems: Mapping Who Uses What (and Why)",
    "theme": "Food foraging around our house",
    "grade": "6",
    "subject": "Social Studies",
    "subjects": [
      "Social Studies"
    ],
    "sections": [
      {
        "type": "introduction",
        "title": "Set the Purpose + Safety & Ethics for Foraging",
        "instructions": "Tell Natalie today is a social studies investigation: you’re using your home place to study how people, rules, and the environment shape food access. Together, make a quick 'foraging ethics' agreement on paper. Include: (1) We do not eat anything we cannot identify with high confidence. (2) We ask permission on private property. (3) We harvest only if it’s allowed and only a small amount (or we just observe). (4) We avoid areas that may be contaminated (road edges, sprayed lawns, pet-walking zones) unless we’re only mapping and discussing. Then ask Natalie to choose one compelling question and 2–3 supporting questions, such as: 'Where around our house could edible plants grow?' 'How do human choices (mowing, planting) change what’s here?' 'Who is allowed to harvest, and how do we know?' Write the questions at the top of her page.",
        "durationMinutes": 10,
        "tips": [
          "Keep the ethics list short and practical; you can add nuance later.",
          "If Natalie wants to eat what she finds, treat that as a future extension after careful ID and permission—not the goal today."
        ],
        "philosophyConnection": "You’re grounding learning in direct local experience and building stewardship values (care, restraint, safety) before going outside—classic place-based learning with a balance of safety and freedom."
      },
      {
        "type": "exploration",
        "title": "Outdoor Forage Walk: Observe, Photograph/Sketch, and Note Human Impacts",
        "instructions": "Take a slow walk around your yard edges, fence lines, garden beds, driveway margins, and any nearby sidewalk strip you can legally access. Ask Natalie to look for 'food clues' (berries, nuts, herbs, edible weeds, fruit trees) and also 'human system clues' (mowed lines, planted ornamentals, compost area, irrigation, mulch, signs, fences). For each potential forage item, have her record a quick entry: location description (e.g., 'north fence corner'), what she thinks it is (or 'unknown'), abundance (few/some/many), and an access note (public/private/unclear). Also have her add a 'human impact' note: mowed? planted? likely sprayed? near traffic? Encourage her to take 3–5 photos or make quick sketches of key finds and the surrounding context.",
        "durationMinutes": 20,
        "tips": [
          "If you’re unsure about boundaries, treat the walk as observation-only and stay clearly within your property or public right-of-way.",
          "Use 'unknown' confidently—uncertainty is part of fieldwork."
        ],
        "philosophyConnection": "This is direct nature experience and sensory-rich observation rooted in your immediate place. It treats the neighborhood as the classroom and centers inquiry through doing."
      },
      {
        "type": "practice",
        "title": "Make a Foraging Geography Map + Data Table",
        "instructions": "Back inside (or at an outdoor table), help Natalie turn observations into a simple sketch map. Start with a rough outline: your house shape, driveway, fence lines, major trees, garden beds, sidewalk/road. Then create a legend with 3–5 symbols, for example: edible plant candidate, unknown plant, 'likely planted', 'access unclear', 'avoid for contamination'. Have Natalie plot each find on the map using symbols and short labels. Next, make a small table with columns: Item, Location, Evidence (photo/leaf/feature), Access (public/private/permission needed), Safety notes (spray/traffic/pets), and Human influence (planted/mowed/irrigated). Ask her to choose one pattern she notices and write it as a claim (e.g., 'Most edible candidates are along edges where mowing is less frequent').",
        "durationMinutes": 15,
        "tips": [
          "If mapping feels hard, let her start with a photo map (a phone screenshot of the block) and place dots/labels on top.",
          "Aim for clarity over artistry; this is a working field map."
        ],
        "philosophyConnection": "Place-based learning becomes visible through mapping—connecting lived experience to geographic representation and analysis. It also supports learner agency as Natalie chooses symbols, categories, and patterns."
      },
      {
        "type": "reflection",
        "title": "Social Studies Lens: Rules, Fairness, and Resource Allocation",
        "instructions": "Use Natalie’s map to have a short discussion that connects foraging to community systems. Ask: (1) 'Which spots are easy to access, and which are blocked by fences, signs, or social expectations?' (2) 'What counts as a resource here—plants, land, water, knowledge, time?' (3) 'How do people in our area “allocate” food—gardens, stores, farmers markets, foraging, food banks?' Then have Natalie write a brief paragraph answering her compelling question using evidence from her table/map. Finish by having her propose one small action that supports the public good, such as: create a “look-don’t-pick” neighborhood edible plant guide, ask a neighbor about a fruit tree and offer to help harvest, start a small native edible plant pot, or research local park rules about foraging and share them with family.",
        "durationMinutes": 10,
        "tips": [
          "Keep the tone curious rather than rule-heavy: 'What do you think the rule is trying to protect?'",
          "If Natalie has strong opinions, ask her to name a counterargument and respond respectfully using evidence."
        ],
        "philosophyConnection": "This connects human-environment relationships to civic life and stewardship, building from local observation to values, community norms, and possible participation—core to place-nature-based education."
      },
      {
        "type": "transition",
        "title": "Transition: Seasonal Check-In + Plan the Next Walk",
        "instructions": "Step outside for one minute and notice the season: buds, flowers, fruit, leaf drop, temperature. Ask Natalie: 'What might be different in two weeks?' Choose one date for a follow-up 'same route' walk and write it on the map. Have her circle one spot she’s most curious about and write one new supporting question to investigate next time.",
        "durationMinutes": 5,
        "tips": [
          "If weather is bad, do the seasonal check-in from a window and still schedule the next walk."
        ],
        "philosophyConnection": "Honors seasonal rhythms and sustained inquiry over time—learning through repeated relationship with the same place."
      }
    ],
    "standards": [],
    "cleanupNotes": "Bring in any gear, wash hands, and put journals/maps in a safe place for the next walk. If you collected any natural objects for observation, return them outside unless you’re keeping a small, clearly labeled sample for ID reference."
  },
  "project-based-learning": {
    "sourceLessonId": "cmo7qne5g001lccgsgf1ilmpw",
    "philosophyId": "project-based-learning",
    "philosophyLabel": "Project-Based Learning",
    "title": "Mythical Creature Field Guide: Mapping Legends to Place and Power",
    "theme": "Mythical creatures",
    "grade": "5",
    "subject": "Social Studies",
    "subjects": [
      "Social Studies"
    ],
    "sections": [
      {
        "type": "introduction",
        "title": "Project Launch: The “Museum Request” Entry Event",
        "instructions": "Tell Penny: “A local museum is planning a new exhibit called Mythical Creatures: Legends, Geography, and Society. They need a one-page field guide entry (or 3-slide mini-presentation) that helps visitors understand what a creature reveals about the people who told the story.”\n\nShow her the product options: (A) one-page field guide, (B) mini-slideshow (3 slides), or (C) poster. Let her choose.\n\nTogether, craft a driving question on paper. Offer stems and let her pick one:\n- “What does the legend of the ______ reveal about the values and fears of ______?”\n- “How did the geography of ______ shape stories about the ______?”\n- “How do different versions of the ______ myth show changes in society over time?”\n\nHave her choose a creature and culture/region (examples she might pick: dragon—China/Europe; kitsune—Japan; anansi—West Africa; selkie—Scotland/Ireland; quetzalcoatl—Mesoamerica; roc—Middle East; bunyip—Australia; thunderbird—Indigenous North America).",
        "durationMinutes": 10,
        "tips": [
          "If Penny has trouble choosing, limit to 3 options and let her pick the most interesting one.",
          "Write the driving question in a visible place; refer back to it during research to keep the project focused."
        ],
        "philosophyConnection": "You launch an authentic project with a clear audience and product, then co-create a compelling driving question to guide sustained inquiry."
      },
      {
        "type": "exploration",
        "title": "Outdoor Fieldwork: “Where Would This Creature Live?” Geography Walk",
        "instructions": "Go outside for a short walk (yard, neighborhood, or park). Ask Penny to imagine the creature’s habitat and needs.\n\nAs you walk, prompt her to collect quick observations in her journal:\n- Landforms: flat, hilly, rocky, forested, watery?\n- Weather clues: wind, temperature, cloud cover (today and what the region might be like seasonally)\n- Resources: places to hide, hunt, nest, or guard\n\nThen connect the walk back to the creature’s origin region. Ask: “If the legend began near mountains/coasts/rivers/deserts, what parts of that environment might have influenced the story?”\n\nEnd by having her write 2 supporting questions she can research next, such as:\n- “What landforms/climate are common in the creature’s origin region?”\n- “Were there real animals or natural hazards that could have inspired the legend?”",
        "durationMinutes": 15,
        "tips": [
          "Keep it brisk and purposeful: 10 minutes walking + 5 minutes sitting to write questions works well.",
          "If outdoor time isn’t possible, do ‘fieldwork’ from a window and pair it with photos of the creature’s region."
        ],
        "philosophyConnection": "Fieldwork makes the inquiry experiential and place-based, helping Penny construct knowledge from observation and then translate it into research questions."
      },
      {
        "type": "exploration",
        "title": "Research Sprint: Primary vs. Secondary Sources + Evidence Notes",
        "instructions": "Set a 20-minute timer and run a focused research sprint.\n\nStep 1 (2 minutes): Create a simple note-catcher with four boxes:\n1) Place/Region, 2) People/Culture, 3) Creature Description & Story, 4) What It Symbolizes (values/fears/power/nature).\n\nStep 2 (15 minutes): Help Penny find at least two sources, aiming for:\n- One “primary-ish” source: an excerpt/translation of the myth, a historical illustration, a museum artifact page, or an ancient text excerpt.\n- One secondary source: an encyclopedia entry, history site, book chapter summary, or educational video transcript.\n\nAs she takes notes, require two habits:\n- After each key fact, she writes the source name/URL or book title + page.\n- She labels each source P (primary) or S (secondary) and writes one sentence explaining her label.\n\nStep 3 (3 minutes): Ask her to pick her strongest piece of evidence and star it—something she can use to answer the driving question.",
        "durationMinutes": 20,
        "tips": [
          "If she’s overwhelmed by search results, give her two pre-selected starting points (library database, museum site, Britannica/Khan Academy-style resource) and let her branch from there.",
          "Encourage paraphrasing instead of copying. If she quotes, have her use quotation marks and cite it."
        ],
        "philosophyConnection": "This is sustained inquiry with scaffolding: you provide a structure (note-catcher, source labels) but Penny does the investigating and evidence selection for an authentic product."
      },
      {
        "type": "practice",
        "title": "Build the Product: Map + Claim + Field Guide Draft",
        "instructions": "Have Penny create a draft of her museum-ready product.\n\nMinimum required elements (keep it tight for today):\n1) A map marker: locate the origin region on a world map and label it.\n2) A 2–3 sentence claim answering the driving question.\n3) Two evidence bullets with citations (from her sources).\n4) One geography connection sentence (how landforms/climate/resources connect to the legend).\n5) A ‘Primary vs Secondary’ line: list her sources and label each P or S.\n\nLet her choose the format:\n- One-page field guide: title, image (drawn or printed), map box, short paragraphs.\n- 3-slide deck: Slide 1 creature + map, Slide 2 story + evidence, Slide 3 meaning + geography connection.\n\nAs she drafts, act as a coach: ask, “Which detail best proves your claim?” and “Where on the map should a visitor look first?”",
        "durationMinutes": 10,
        "tips": [
          "If time is tight, prioritize the claim + two evidence bullets + map marker; polish can come later.",
          "Encourage clear, museum-style writing: short sentences, defined terms, and captions."
        ],
        "philosophyConnection": "The project remains central: Penny produces an authentic artifact that demonstrates learning, integrating research, geography tools, and argumentation."
      },
      {
        "type": "reflection",
        "title": "Critique, Revision, and Reflection: “Glow & Grow” Mini-Conference",
        "instructions": "Do a fast feedback cycle.\n\nYou give one Glow (what’s strong) and one Grow (one next step). Use prompts:\n- Glow: “Your claim is clear because…” or “Your map choice helps me understand…”\n- Grow: “Add one more piece of evidence about…” or “Clarify whether this source is primary or secondary by…”\n\nThen have Penny write a 3-sentence reflection in her journal:\n1) “Today I learned…”\n2) “One question I still have…”\n3) “My next step is…”\n\nIf possible, decide on a public audience for later: a short presentation to family, sharing with a co-op group, emailing a librarian, or posting a private slideshow for relatives.",
        "durationMinutes": 5,
        "tips": [
          "Keep feedback specific and kind; focus on one high-leverage revision she can actually do next time.",
          "If Penny resists reflection writing, let her voice-record the three sentences instead."
        ],
        "philosophyConnection": "Reflection and revision are built into PBL, and naming an authentic audience increases purpose and accountability."
      }
    ],
    "standards": [],
    "cleanupNotes": "Have Penny save links in a single document or bookmark folder titled with the creature’s name. Put paper notes and the draft product into a labeled folder so she can revise and present later without re-finding sources."
  },
  "unschooling": {
    "sourceLessonId": "cmo7qjk0m001dccgsry9jtzhp",
    "philosophyId": "unschooling",
    "philosophyLabel": "Unschooling",
    "title": "Sourdough Science: Meet the Tiny Helpers!",
    "theme": "Science in sourdough",
    "grade": "K",
    "subject": "Science",
    "subjects": [
      "Science"
    ],
    "sections": [
      {
        "type": "introduction",
        "title": "Invitation: “Do you want to check on the starter?”",
        "instructions": "Set the starter on the counter and invite Uma to explore it in her own way: looking, smelling (from a little distance first), and noticing bubbles. Ask open questions only if she seems interested, like: “What do you notice?” “Does it smell sweet, sour, or like nothing?” “Do you see tiny holes?” If she wants, let her gently stir once and listen together (sometimes you can hear faint fizzing). If she’s not into it, you can simply narrate what you’re doing while you feed your starter as usual and let her drift in and out.",
        "durationMinutes": 10,
        "tips": [
          "If smell is intense, let Uma choose: smell from farther away, waft with a hand, or skip smelling entirely."
        ],
        "philosophyConnection": "You’re offering a real-life, meaningful activity (bread-making) and trusting Uma to choose her level of participation, with you facilitating rather than directing."
      },
      {
        "type": "exploration",
        "title": "Hands-on Experiment: Two mini-starters (Uma chooses the “test”)",
        "instructions": "Tell Uma you can do a “bubble test” with two tiny jars and let her choose what to compare. Offer two simple options and let her pick (or invent her own): (A) Warm spot vs cool spot, or (B) Stirred vs not stirred. In each jar, add a small spoon of starter, a spoon of flour, and a spoon of water (exact amounts don’t matter—this is play-science). Let Uma pour, scoop, and stir as she likes. Mark the starting level with a rubber band/marker if she’s interested. Decide together where each jar will live for the next 30–60 minutes: one in a warmer place (sunny window or outside in shade/sun depending on your climate), one in a cooler place (counter away from sun).",
        "durationMinutes": 20,
        "tips": [
          "Keep the jars small so results show faster and the mess stays manageable.",
          "If you go outdoors, choose a safe, stable spot where jars won’t tip and won’t be overheated in direct hot sun."
        ],
        "philosophyConnection": "Uma’s curiosity sets the experiment. You’re supporting self-directed inquiry using everyday materials, with natural consequences (more/less bubbles) providing feedback."
      },
      {
        "type": "practice",
        "title": "Free Play + Observation Loop: “Check, notice, wait, check again”",
        "instructions": "While the jars sit, invite Uma into a sourdough-adjacent play choice: pretend ‘bakery’ with bowls and spoons, making ‘dough’ with a little flour and water, or drawing what she thinks is happening inside the jar. Every 5 minutes or so (only if she’s still engaged), wander back to the jars and ask: “Any new bubbles?” “Did the level move?” “What changed?” If nothing changes yet, treat that as real science: “Sometimes it takes time.”",
        "durationMinutes": 15,
        "tips": [
          "If Uma loses interest, let the jars keep working without calling it a ‘lesson’—you can revisit later today or tomorrow."
        ],
        "philosophyConnection": "This keeps learning playful and voluntary, integrating science with imaginative play and real kitchen work rather than a forced worksheet sequence."
      },
      {
        "type": "reflection",
        "title": "Compare + Model: “Which jar looks more alive right now?”",
        "instructions": "Bring both jars together and invite Uma to compare them. Keep it simple and sensory: bubbles, smell, thickness, and level. Ask her which one she thinks had a better ‘home’ and why. Then offer a choice for making a model: (1) Draw the jar with bubbles pushing up, (2) Use your fingers to poke ‘bubble holes’ in a little piece of dough, or (3) Build a bubble model with crumpled paper balls under a towel to show ‘air’ lifting it. If she wants words, you can introduce: “The tiny helpers eat and make gas. The gas makes bubbles. Bubbles can make dough rise.”",
        "durationMinutes": 10,
        "tips": [
          "Use Uma’s language first (“holes,” “puffs,” “fizz”) and only add new vocabulary if she seems curious."
        ],
        "philosophyConnection": "Reflection is conversational and child-owned. The model is a creative, hands-on way to represent what she observed, without demanding a single ‘right’ answer."
      },
      {
        "type": "transition",
        "title": "Gentle Wrap-Up: Decide what happens to the jars",
        "instructions": "Offer Uma control over the ending: “Do you want to keep them to watch longer, feed them again, or compost/throw them away?” If you keep them, label them together with simple names (Uma can choose): “Sunny” and “Shady,” “Warm” and “Cool,” or even silly names. Put them somewhere safe and agree on when you might check again (after lunch, before bed, tomorrow morning).",
        "durationMinutes": 5,
        "tips": [
          "If you compost, narrate it as part of the life cycle: “Back to the earth to help other living things.”"
        ],
        "philosophyConnection": "You’re respecting autonomy and using natural consequences and real household rhythms to continue the learning without forcing closure."
      }
    ],
    "standards": [],
    "cleanupNotes": "Wipe surfaces with a damp cloth, and have Uma help in a real way if she wants (carry spoons to sink, toss paper towel, rinse jars). Flour can get sticky—soaking jars briefly makes cleanup easier. If you keep jars for later observation, place them on a tray to catch drips."
  },
  "adaptive": {
    "sourceLessonId": "cmo7qgr7x0013ccgspr3hb56h",
    "philosophyId": "adaptive",
    "philosophyLabel": "Adaptive",
    "title": "Math as Art: Designing a Circle-Mosaic Poster",
    "theme": "Art of math",
    "grade": "7",
    "subject": "Math",
    "subjects": [
      "Math"
    ],
    "sections": [
      {
        "type": "introduction",
        "title": "Warm-Up Gallery: Where Do You See Circles in Art?",
        "instructions": "Show your child 3–5 quick images of circle-based art (you can use a book, printed images, or a quick search for: mandalas, rose windows, Op Art circles, or Islamic geometric patterns). Ask: (1) What repeats? (2) What looks symmetrical? (3) If you had to describe this with math words, what would you say (radius, diameter, angle, ring, sector, proportion)?\n\nThen set today’s goal together: 'We’ll create one circle-mosaic artwork and use circle measurements and scaling math to plan it.' Let Adam choose one style direction: mandala, target/rings, spiral illusion, or stained-glass wedges.",
        "durationMinutes": 10,
        "tips": [
          "Keep the images quick—this is inspiration, not a lecture.",
          "If Adam already has a favorite aesthetic (minimalist, bold, anime-inspired, etc.), invite him to adapt the circle-mosaic to that style."
        ],
        "philosophyConnection": "Adaptive: you offer multiple ways to engage (visual art examples + discussion) and optimize autonomy by letting Adam choose an art style and math focus."
      },
      {
        "type": "exploration",
        "title": "Design Plan: Choose Dimensions and Build the Circle Framework",
        "instructions": "On a fresh page, help Adam set a clear constraint: the artwork must fit on the paper with a margin. Have him measure the usable width of the page and choose a circle radius r that fits (for example, r = 8 cm on a standard sheet).\n\nNext, build the framework:\n1) Draw the main circle (compass or string method).\n2) Pick either (A) rings, (B) wedges, or (C) rings + wedges.\n- Rings option: choose 2–4 ring boundaries (e.g., radii 3 cm, 5 cm, 8 cm).\n- Wedges option: choose a number of equal wedges n (8, 10, 12, 16). Lightly mark the wedges by approximating equal angles (you can fold paper lightly, use a protractor if you have one, or do careful visual partitioning).\n\nHave Adam label his chosen measurements on the page (r values, and n if using wedges).",
        "durationMinutes": 15,
        "tips": [
          "If you don’t have a protractor, equal wedges can be approximated by folding the paper in half, then quarters, then eighths, and refining.",
          "Encourage light pencil lines for the framework so the final art can be bold."
        ],
        "philosophyConnection": "Adaptive: multiple means of representation (visual framework + labeled measurements) and action/expression (hand tools or alternative methods). You scaffold by turning an open-ended art task into manageable design constraints."
      },
      {
        "type": "practice",
        "title": "Math-as-Artist: Compute, Predict, and Scale",
        "instructions": "Now treat the drawing like a design blueprint.\n\nA) Circle calculations (choose at least one circle radius from the design):\n- Compute circumference C = 2πr.\n- Compute area A = πr².\nHave Adam round to a reasonable precision (e.g., nearest tenth) and write the results next to the drawing.\n\nB) Scaling choice (pick one):\nOption 1 (simple scale): Choose a scale factor k (like 1.5 or 2). Predict the new circumference and area without recomputing from scratch:\n- C scales by k\n- A scales by k²\nThen check by recalculating with the new radius.\n\nOption 2 (ring planning): If Adam drew rings, compute the area of at least one ring (annulus) by subtracting areas: A_ring = π(R² − r²). Connect it to art: 'This ring is the biggest visual weight—should it be darker or lighter?'\n\nC) Quick reasonableness check:\nAsk Adam to estimate before calculating (e.g., '2πr is a bit more than 6r'). Then compare estimate vs. calculator result.",
        "durationMinutes": 20,
        "tips": [
          "If π feels abstract, let Adam choose π ≈ 3.14 or 22/7 and compare how much answers change.",
          "Treat mistakes as design revisions: 'We’re debugging the blueprint.'"
        ],
        "philosophyConnection": "Adaptive: mastery-oriented feedback and gradual release—Adam uses formulas, then uses structure (scaling rules) to work smarter. Multiple means of engagement: he picks the math pathway that best matches his interest (scaling vs. ring areas)."
      },
      {
        "type": "exploration",
        "title": "Outdoor Math Art: Chalk Circle Scaling (Quick Field Test)",
        "instructions": "Take chalk (or a string and stick) outside. Have Adam recreate the main circle at a larger scale.\n\n1) Choose a real-world radius (for example, r = 1 meter or r = 2 feet) and draw the circle.\n2) Ask him to predict the circumference using C = 2πr.\n3) Walk the circumference with small steps or use a measuring tape if you have one to get a rough check.\n\nFinish by asking: 'What changed when we scaled up—what stayed the same about the design?'",
        "durationMinutes": 10,
        "tips": [
          "Accuracy doesn’t need to be perfect; the goal is connecting formula to a real circle you can stand inside.",
          "If outdoor space is limited, do a smaller circle and focus on prediction rather than measuring."
        ],
        "philosophyConnection": "Adaptive: authentic, experiential learning and transfer—Adam generalizes from paper math to a real, physical circle and uses tools strategically."
      },
      {
        "type": "reflection",
        "title": "Finish & Reflect: Artist Statement + Math Caption",
        "instructions": "Have Adam finalize the artwork with color/pattern choices (even just one ring or wedge pattern is fine). Then ask him to write a 3–5 sentence 'artist statement' that includes:\n- One math fact from today (a circumference, an area, a scale factor result, or a ring area).\n- One design choice explained with math language (symmetry, proportion, repetition, contrast by area).\n- One 'next time' improvement.\n\nIf he prefers speaking, let him record a 30–60 second audio note instead.",
        "durationMinutes": 5,
        "tips": [
          "If Adam resists writing, offer a sentence frame: 'I used a radius of __. The circumference is about __. I chose __ wedges because __.'"
        ],
        "philosophyConnection": "Adaptive: multiple means of expression (writing or audio) and self-regulation through reflection and goal-setting for next time."
      }
    ],
    "standards": [],
    "cleanupNotes": "Put finished artwork in a folder to keep it flat. Collect tools (ruler, compass/string, calculator). If you used chalk, take a quick photo of the outdoor circle before it fades so Adam can compare indoor vs. outdoor scale later."
  },
  "charlotte-mason": {
    "sourceLessonId": "cmo7qdisv000tccgsumplpxdk",
    "philosophyId": "charlotte-mason",
    "philosophyLabel": "Charlotte Mason",
    "title": "A World Gallery: Reading Art Like a Historian",
    "theme": "Art in different cultures",
    "grade": "5",
    "subject": "Social Studies",
    "subjects": [
      "Social Studies"
    ],
    "sections": [
      {
        "type": "introduction",
        "title": "Invitation: What Can a Picture Tell Us?",
        "instructions": "Tell Charlie: \"Today we’re going to treat artworks like clues from the past.\" Place one artwork image in front of him (choose something rich in detail). Give him 60–90 seconds of quiet looking time. Then ask for a brief oral narration: \"Tell me everything you noticed, in any order.\" After he narrates, ask only 2 gentle follow-ups: (1) \"What do you think is happening here?\" (2) \"What makes you think that?\" Keep it light—no correcting, just listening.",
        "durationMinutes": 8,
        "tips": [
          "Resist the urge to explain symbols right away; let Charlie’s first impressions stand.",
          "If Charlie is hesitant, invite him to start with colors/shapes, then people/objects, then mood."
        ],
        "philosophyConnection": "Charlotte Mason picture study begins with attentive looking and personal relationship to the work, followed by narration for assimilation rather than interrogation."
      },
      {
        "type": "exploration",
        "title": "Picture Study Trio: Three Cultures, Three Ways of Seeing",
        "instructions": "Choose three artworks from clearly different cultural contexts (for example: a Japanese ukiyo-e print, a West African mask, and a Renaissance painting; or an Islamic geometric tile design, a Chinese landscape scroll detail, and a Mexican mural). For each artwork, do a single round:\n1) Quiet look (about 1 minute).\n2) Charlie narrates what he sees (1–2 minutes).\n3) You ask one supporting question that keeps attention outward: \"What materials do you think this might be made from?\" or \"What might this artwork be used for—decoration, storytelling, worship, celebration, remembering?\"\nAfter all three, ask Charlie to choose ONE that he wants to know more about and tell you why (one sentence is enough).",
        "durationMinutes": 18,
        "tips": [
          "Pick artworks with different purposes (portrait, ritual object, pattern, landscape) so the contrast is natural.",
          "Keep the pace brisk; short focused lessons protect attention."
        ],
        "philosophyConnection": "This uses 'living ideas' through direct contact with great art and respects the child as a person by giving choice and space to form relationships with ideas."
      },
      {
        "type": "practice",
        "title": "Map Work: Pin the Art to the World",
        "instructions": "Open the map/atlas. For each artwork, help Charlie locate the country/region of origin. Have him place a small dot or sticky note (or simply point) and say one spatial sentence aloud, such as: \"Japan is an island nation off the east coast of Asia\" or \"Mali is in West Africa, south of the Sahara.\" Then ask him to choose one artwork and add a simple map-note in his notebook: a tiny outline of the continent with a dot, plus the artwork title or a short label (e.g., \"Ukiyo-e print, Japan\").",
        "durationMinutes": 10,
        "tips": [
          "If you don’t know the exact origin, model honest sourcing: \"Let’s check the museum label to be sure.\"",
          "Use precise but simple terms: continent, region, coast, river valley, desert, mountains."
        ],
        "philosophyConnection": "Charlotte Mason geography builds relationships with real places through map work—connecting ideas (art) to the world rather than memorizing isolated facts."
      },
      {
        "type": "exploration",
        "title": "Primary vs. Secondary Sources: The Artwork and the 'Label'",
        "instructions": "Take the ONE artwork Charlie chose to learn more about. Explain briefly: \"This artwork itself is a primary source—something made in that time and place. A book or museum description is a secondary source—someone explaining it later.\" Read aloud (or have Charlie read) a short, well-written excerpt about the piece/culture (about 1–2 pages). Then close the text and ask for a single-reading narration: \"Tell me what the reading said that you wouldn’t know just by looking.\" Finish by asking Charlie to name one thing the artwork shows better than the reading, and one thing the reading explains better than the artwork.",
        "durationMinutes": 12,
        "tips": [
          "Keep the excerpt short and idea-rich; stop while interest is strong.",
          "If the excerpt includes unfamiliar terms, let them pass unless they block understanding; you can look up one key term afterward."
        ],
        "philosophyConnection": "Living books and single-reading narration cultivate attention and self-education; comparing sources trains historical thinking without turning it into a worksheet."
      },
      {
        "type": "transition",
        "title": "Outdoors: Pattern Hunt and Nature Color Palette",
        "instructions": "Step outside with Charlie for a quick observation walk. Tell him you’re going to look for patterns and textures that artists everywhere use: spirals, symmetry, repeating shapes, borders, and contrasting light/dark. Give him 3 minutes to silently find two patterns in nature or the built environment (tree bark, leaf veins, bricks, fence shapes). Then have him describe them aloud with careful language. Back inside (or on a porch), have him choose one pattern and sketch it quickly in his notebook as a border for his 'World Gallery' page.",
        "durationMinutes": 8,
        "tips": [
          "Keep it short and fresh; this is a palate cleanser that strengthens attention for the final reflection.",
          "If weather is poor, do an indoor 'pattern hunt' (textiles, tiles, baskets, book covers)."
        ],
        "philosophyConnection": "Nature study and observation walks train attention and connect 'books and things'—helping Charlie see that art grows from close noticing of the real world."
      },
      {
        "type": "reflection",
        "title": "Reflection: Make a Museum Label (and One Good Question)",
        "instructions": "Ask Charlie to create a tiny museum label for the artwork he chose (3–5 sentences). He should include: (1) where it’s from (place on the map), (2) what he notices most, (3) one idea from the reading, and (4) one question he still has. Let him read it aloud to you as a final narration.",
        "durationMinutes": 4,
        "tips": [
          "If writing feels heavy today, let Charlie dictate while you write, then have him copy just one best sentence as optional copywork.",
          "Praise effort indirectly by noticing specifics: \"That question is interesting,\" or \"You chose a precise detail.\""
        ],
        "philosophyConnection": "Narration and concise written composition help ideas become the child’s own, while keeping the tone respectful and non-competitive."
      }
    ],
    "standards": [],
    "cleanupNotes": "Have Charlie place the artwork prints back into a folder or book, put pencils away, and keep the 'World Gallery' page in a dedicated social studies or nature notebook. A 2-minute reset helps preserve the Charlotte Mason habit of neatness without turning cleanup into a battle."
  },
  "waldorf-adjacent": {
    "sourceLessonId": "cmo7qa6lr000jccgsblxaya8i",
    "philosophyId": "waldorf-adjacent",
    "philosophyLabel": "Waldorf-Inspired",
    "title": "Wally’s Woven Number Garden: Patterns, Arrays, and Area",
    "theme": "Math in weaving",
    "grade": "3",
    "subject": "Math",
    "subjects": [
      "Math"
    ],
    "sections": [
      {
        "type": "introduction",
        "title": "Rhythm Opening: The Weaver’s Counting Verse (Movement Warm-Up)",
        "instructions": "Stand with Wally and tell him you’re going to “wake up the hands and the numbers” like a weaver preparing the loom. Clap a steady beat and speak a simple call-and-response verse while stepping side to side:\n\nYou: “Over… under…” (step right, step left)\nWally: repeats “Over… under…”\n\nThen add counting in a rhythmic way:\n- Round 1: Count by 2s to 20 while stepping (2, 4, 6…)\n- Round 2: Count by 4s to 40 while clapping (4, 8, 12…)\n\nFinish by asking: “Which counting felt like a stronger stride—by 2s or by 4s?” Let him answer in his own words.",
        "durationMinutes": 8,
        "tips": [
          "Keep it light and musical—aim for flow, not perfection.",
          "If he stumbles, you keep the beat and simply restart at a comfortable number."
        ],
        "philosophyConnection": "Uses rhythm, movement, and spoken verse to bring math through the body (thinking-feeling-willing) before any paper work, in a Waldorf-adjacent way."
      },
      {
        "type": "introduction",
        "title": "Story Picture: The Little Loom and the Secret of Alternation",
        "instructions": "Tell a short imaginative story while you sketch a quick picture (simple is fine) of a tiny loom on paper: a rectangle with vertical “warp” lines.\n\nStory prompt you can use: “In a quiet cottage, a little loom learned a secret: if every thread did the same thing, the cloth would fall apart. So the threads made a promise—one would go over, the next would go under—again and again. That promise made strength and beauty.”\n\nAs you speak, draw 6–8 vertical lines (warp). Then draw one horizontal line (weft) weaving over-under across. Don’t explain too much yet—just let him see the picture and feel the idea of alternation.",
        "durationMinutes": 7,
        "tips": [
          "Use warm, confident ‘teacher voice’—Wally can relax into your lead.",
          "If he wants to talk a lot, gently say: “Let’s try it with our hands, then we’ll tell what we notice.”"
        ],
        "philosophyConnection": "Introduces structure through vivid imagery and whole-to-part experience (a complete woven ‘picture’ first), rather than abstract explanation."
      },
      {
        "type": "exploration",
        "title": "Handwork Math: Make a Paper Weave (From Whole to Parts)",
        "instructions": "Make a simple paper loom together.\n\n1) Create the warp (the base): Fold one sheet in half (hamburger style). Starting about 1 inch from the folded edge, draw lines for cuts about 1 cm to 1.5 cm apart. Cut along the lines, stopping before the open edge so it stays connected.\n\n2) Create the weft strips: From the second sheet, cut 6–10 strips of the same width as the warp spacing.\n\n3) Weave: Help Wally slide the first strip through: over one slit, under the next, repeating. Push it up to the top. For the second strip, switch the pattern (under where the first went over).\n\n4) Pause to notice: Ask, “What do you see happening row to row?” Let him point out the alternation.\n\n5) Optional color pattern: If you have two colors of paper (or you color some strips), invite him to choose a repeating color pattern such as ABAB or AAB AAB.",
        "durationMinutes": 18,
        "tips": [
          "Aim for ‘good enough’ craftsmanship—paper weaving can be fiddly; your calm presence matters more than perfect strips.",
          "If the strips buckle, gently flatten and keep going; real handwork includes small imperfections."
        ],
        "philosophyConnection": "Hands-on making (will activity) is the heart of the lesson; mathematical structure is experienced through doing and artistic beauty, not through worksheets."
      },
      {
        "type": "exploration",
        "title": "Outdoor Array Walk: Build the Weave as Rows × Columns",
        "instructions": "Go outside with sidewalk chalk (or use sticks in dirt) and make a large rectangle grid.\n\n1) Draw a rectangle and divide it into a grid, for example 4 rows by 6 columns (choose a size that feels friendly).\n\n2) Tell Wally: “This is a giant piece of cloth, but made of squares.”\n\n3) Place a small stone (or other counter) in each square as you count together. First count by ones to get the total.\n\n4) Then count by rows: “Each row has 6 squares. If we have 4 rows, that’s 6 + 6 + 6 + 6.”\n\n5) Finally, name the multiplication: “That’s also 4 × 6.” Ask him to say what 4 × 6 means in this picture (4 rows of 6, or 6 columns of 4).\n\nIf he’s ready, switch the rectangle to 3 × 8 or 5 × 4 and repeat quickly.",
        "durationMinutes": 12,
        "tips": [
          "Let Wally choose the next rectangle dimensions—choice increases will engagement.",
          "If he’s unsure of a product, return to repeated addition with the counters."
        ],
        "philosophyConnection": "Connects math to bodily movement and the outdoor world; Wally experiences number relationships as spatial forms (arrays) before abstract computation."
      },
      {
        "type": "practice",
        "title": "Main Lesson Book Page: Woven Pattern Record (Math + Art)",
        "instructions": "Have Wally create a simple, beautiful record page.\n\n1) At the top, he writes a title: “My Woven Number Pattern.”\n\n2) He draws a neat rectangle grid (suggest 4×6 or match what you did outside). He can use a ruler or draw freehand.\n\n3) He shades the grid in an over-under feeling: a checkerboard (alternating) pattern works well.\n\n4) Under the picture, guide him to write two number sentences that match his grid:\n- Repeated addition (example): 6 + 6 + 6 + 6 = 24\n- Multiplication (example): 4 × 6 = 24\n\n5) Ask him to circle what repeats (the 6s, or the equal rows) and tell you what pattern he sees.",
        "durationMinutes": 10,
        "tips": [
          "If handwriting stamina is low, you can write the equations lightly in pencil and let him trace.",
          "Praise effort and clarity: “I can really see the order in your rows.”"
        ],
        "philosophyConnection": "Main lesson book style integrates artistry and academic content; the child makes a personal, beautiful ‘whole’ page that holds the math meaningfully."
      },
      {
        "type": "reflection",
        "title": "Closing Reflection: The Weaver Explains the Pattern",
        "instructions": "Sit with Wally and hold the woven paper (or look at his lesson book page). Ask him to “teach back” as the master weaver for one minute:\n\nPrompts:\n- “What does over-under do for the cloth?”\n- “What pattern did you use?”\n- “How did you find how many squares were in your cloth?”\n\nEnd with a simple closing line you say each time: “Order makes strength; beauty makes joy.” Then transition to cleanup together.",
        "durationMinutes": 5,
        "tips": [
          "If he gives short answers, accept them and ask for one more detail: “Show me with your finger.”",
          "Keep the tone appreciative, not evaluative."
        ],
        "philosophyConnection": "Retelling and oral explanation strengthen memory and understanding without over-intellectualizing; it also honors relationship and gentle authority through your calm guiding questions."
      }
    ],
    "standards": [],
    "cleanupNotes": "Save the paper weave to display (a fridge ‘textile gallery’ helps motivation). Collect paper scraps into a small bag for future collage or weaving. If you used outdoor counters, make a quick game of ‘find and return’ to gather all stones/acorns before coming inside."
  }
};

/**
 * Resolve the user's CompassResult.philosophyBlend (keyed by PhilosophyKey —
 * the underscore form: "charlotte_mason") to a sample-lesson PhilosophyId
 * (hyphen form: "charlotte-mason"). Returns the lesson for their top match,
 * or a safe fallback if the blend is empty.
 */
export function resolveSampleLessonForBlend(
  blend: Record<string, number> | null | undefined,
): SampleLesson {
  const topBlendKey = blend
    ? Object.entries(blend).sort(([, a], [, b]) => b - a)[0]?.[0]
    : undefined;

  const blendToId: Record<string, PhilosophyId> = {
    montessori: "montessori-inspired",
    waldorf: "waldorf-adjacent",
    project_based: "project-based-learning",
    place_nature: "place-nature-based",
    classical: "classical",
    charlotte_mason: "charlotte-mason",
    unschooling: "unschooling",
    adaptive: "adaptive",
  };

  const philosophyId = (topBlendKey && blendToId[topBlendKey]) || "charlotte-mason";
  return SAMPLE_LESSONS[philosophyId];
}
