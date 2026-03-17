/**
 * Shareable text for every primary + secondary archetype combination.
 * 56 combos total (8 × 7).
 *
 * IMPORTANT: Descriptions use plain language about what the parent DOES,
 * not framework names (no "Montessori," "Charlotte Mason," "Classical," etc.)
 * because many parents won't know those terms.
 */

export interface ComboText {
  title: string;
  shareText: string;
}

const COMBO_MAP: Record<string, Record<string, string>> = {
  "the-guide": {
    "the-explorer": "You bring structure and high expectations to a curiosity-driven approach. You plan the path but leave room for real-world detours when your child's interest sparks.",
    "the-cultivator": "You pair clear academic goals with hands-on, tactile learning. Your child works within a structured plan but uses real materials and moves at their own pace.",
    "the-naturalist": "You value a structured academic foundation with strong nature connections. Organized mornings and outdoor afternoons — the best of both worlds.",
    "the-storyteller": "You love structure and you love great books. Your days have a clear plan, but the heart of your teaching is rich stories, discussion, and beautiful literature.",
    "the-architect": "You build a structured academic plan and bring it to life through projects. Your child learns the concepts, then proves they understand by creating something real.",
    "the-free-spirit": "You value structure for core skills but trust your child to lead their own deeper explorations. A planned foundation with freedom at the edges.",
    "the-weaver": "You like an organized day but you're not married to one method. You borrow what works from many approaches — structured but never rigid.",
  },
  "the-explorer": {
    "the-guide": "You follow your child's curiosity first, but you value knowing the learning goals are being met. Freedom with an academic safety net.",
    "the-cultivator": "You blend child-led exploration with a carefully prepared environment. Your child discovers the world, and you make sure the right tools and materials are always within reach.",
    "the-naturalist": "The world is your classroom and the outdoors is your curriculum. You follow your child into the woods, the garden, the creek — and learning happens everywhere you go.",
    "the-storyteller": "You follow your child's interests and weave them into rich stories and books. Every curiosity becomes a reading adventure and a chance to go deeper.",
    "the-architect": "You let your child's curiosity lead, then turn their interests into hands-on projects. Discovery first, then building something meaningful from what they've found.",
    "the-free-spirit": "You're deeply child-led with a strong trust in your child's ability to learn through life. You follow interests wherever they go, with almost no predetermined structure.",
    "the-weaver": "You follow your child's curiosity but pull from many approaches to support their learning. Whatever method works for today's fascination, that's what you use.",
  },
  "the-cultivator": {
    "the-guide": "You create a hands-on, self-directed environment with clear academic expectations. Your child chooses what to work on, but the materials and goals are carefully planned.",
    "the-explorer": "You set up the learning space with intention, but you're also happy following your child outside that space when curiosity calls. Prepared, but flexible.",
    "the-naturalist": "You extend your hands-on learning environment outdoors. Natural materials become learning tools, and your child engages with them at their own pace.",
    "the-storyteller": "You value self-directed, tactile work and beautiful books equally. Your child chooses what to do, and quality literature is always one of the options.",
    "the-architect": "You combine self-directed hands-on learning with project-based work. Your space is organized, materials are accessible, and your child builds independently.",
    "the-free-spirit": "You prepare the environment thoughtfully, but you also deeply trust your child to direct their own learning. More freedom than structure, but always with purpose.",
    "the-weaver": "Your approach is rooted in hands-on, self-paced learning, but you freely incorporate other methods when they serve your child's needs.",
  },
  "the-naturalist": {
    "the-guide": "Nature is your primary classroom, but you maintain structure and track what your child is learning. Outdoor learning with clear academic goals.",
    "the-explorer": "You're nature-first and child-led. Your child explores their environment freely, and you turn their outdoor discoveries into deep learning moments.",
    "the-cultivator": "You bring a prepared, hands-on learning environment outdoors. Nature provides the materials, and your child engages with them at their own pace and interest.",
    "the-storyteller": "You combine outdoor learning with beautiful books and storytelling. Nature journaling, field guides, and reading about the natural world define your days.",
    "the-architect": "Your child learns through place-based projects — building gardens, mapping trails, studying local ecosystems. Nature is both the classroom and the building material.",
    "the-free-spirit": "You trust that nature and freedom are enough. Your child learns by being immersed in the outdoors, without prescribed lessons or structured activities.",
    "the-weaver": "Nature is your foundation, but you pull from many methods to enrich outdoor learning. Some days it's journaling, others it's building, others it's just being present.",
  },
  "the-storyteller": {
    "the-guide": "You lead with great books and storytelling but maintain clear structure underneath. Beautiful literature meets organized, goal-oriented teaching.",
    "the-explorer": "You start with stories and living books, then follow wherever they lead. A love of reading and narration combined with an adventurous, curiosity-driven spirit.",
    "the-cultivator": "You blend rich literature with hands-on, self-directed work. Your child listens to great stories and then works independently with real materials.",
    "the-naturalist": "Books and nature are your twin pillars. You read about the world, then go outside to experience it firsthand. Beauty in education, always.",
    "the-architect": "You use stories as launchpads for projects. Read about bridges, then build one. Learn about ecosystems from a book, then create a terrarium.",
    "the-free-spirit": "You value short, rich lessons built around great books — but you also trust your child to choose what interests them most and go at their own pace.",
    "the-weaver": "Stories and narration are your core, but you borrow freely from other approaches. Great books show up in everything you do, no matter the method.",
  },
  "the-architect": {
    "the-guide": "You design projects within a clear academic framework. Every project has real learning goals and your child can show what they've mastered.",
    "the-explorer": "You build projects from your child's interests. They get curious about something, and you help them turn that curiosity into something they can create.",
    "the-cultivator": "You combine project-based learning with a well-organized, hands-on environment. Your workspace is set up, materials are ready, and your child builds independently.",
    "the-naturalist": "Your projects are rooted in the natural world — building rain gauges, creating habitat maps, designing gardens. Real-world, place-based projects are your specialty.",
    "the-storyteller": "You use stories and books as project inspiration. Every great project starts with a great story, and every project ends with your child telling theirs.",
    "the-free-spirit": "You love projects but you let your child choose them. You provide tools, materials, and support — they decide what to build and how to build it.",
    "the-weaver": "You're project-based at heart but flexible in approach. Some projects are structured challenges; others are free-form creative explorations. You adapt to what fits.",
  },
  "the-free-spirit": {
    "the-guide": "You deeply trust child-led learning but keep one eye on academic milestones. Freedom first, with a light structure underneath to make sure nothing important is missed.",
    "the-explorer": "Your child leads and the world is the classroom. You trust that deep learning happens through life itself — exploring, questioning, and following their interests.",
    "the-cultivator": "You trust your child to lead their learning, and when they're ready to go deeper, you offer well-chosen materials and a thoughtfully prepared space to support them.",
    "the-naturalist": "Freedom meets the natural world. Your child learns through direct experience outdoors, on their own terms, without prescribed lessons or timelines.",
    "the-storyteller": "You surround your child with great books and trust them to pick them up when they're ready. No assigned reading — just the right books always within reach.",
    "the-architect": "Your child leads, and when an interest takes hold, you help them turn it into a real project. No forced assignments — just supported creation when inspiration strikes.",
    "the-weaver": "You're primarily child-led but you'll pull in a resource or method when the moment is right. Flexible, relaxed, and responsive to whatever your child needs.",
  },
  "the-weaver": {
    "the-guide": "You pick and choose from many approaches, but structure and clear goals are your anchor. Flexible methods within an organized framework.",
    "the-explorer": "You draw from many traditions with a child-led heart. Today might be hands-on math, tomorrow might be a nature walk, and that's exactly how you like it.",
    "the-cultivator": "You mix methods freely but always come back to hands-on, self-directed work as your home base. Your child has choices within a thoughtfully set-up space.",
    "the-naturalist": "You pull from every approach and weave nature throughout. Whatever method you're using today, there's always time to go outside and learn from the world.",
    "the-storyteller": "You mix and match approaches with a love of great books running through everything. Stories make every method better, and you use them all.",
    "the-architect": "You're flexible with a project-based lean. You try different approaches but always come back to building, creating, and making things real.",
    "the-free-spirit": "You're flexible and relaxed. You have a full toolbox of methods and you pull from it lightly — never too structured, never too much of any one thing.",
  },
};

export function getComboText(primaryId: string, secondaryId: string): ComboText {
  const primaryName = primaryId.replace("the-", "The ").replace(/(^|\s)\w/g, (c) => c.toUpperCase());
  const secondaryName = secondaryId.replace("the-", "The ").replace(/(^|\s)\w/g, (c) => c.toUpperCase());

  const shareText = COMBO_MAP[primaryId]?.[secondaryId]
    || `You're primarily ${primaryName} with ${secondaryName} influences in your teaching approach.`;

  return {
    title: `${primaryName} with ${secondaryName} tendencies`,
    shareText,
  };
}

/** Get all 56 combos for debug/audit */
export function getAllCombos(): Array<{ primaryId: string; secondaryId: string; text: ComboText }> {
  const archetypeIds = Object.keys(COMBO_MAP);
  const combos: Array<{ primaryId: string; secondaryId: string; text: ComboText }> = [];

  for (const primary of archetypeIds) {
    for (const secondary of archetypeIds) {
      if (primary !== secondary) {
        combos.push({
          primaryId: primary,
          secondaryId: secondary,
          text: getComboText(primary, secondary),
        });
      }
    }
  }

  return combos;
}
