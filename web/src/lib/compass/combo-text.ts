/**
 * Shareable text for every primary + secondary archetype combination.
 * 56 combos total (8 × 7).
 */

export interface ComboText {
  title: string;      // e.g., "The Explorer with Naturalist tendencies"
  shareText: string;  // 2-3 sentence shareable description
}

const COMBO_MAP: Record<string, Record<string, string>> = {
  "the-guide": {
    "the-explorer": "You bring structure and high expectations to a curiosity-driven approach. You plan the path but leave room for real-world detours when your child's interest sparks.",
    "the-cultivator": "You combine classical rigor with Montessori-style hands-on learning. Your child works within a clear framework but uses tactile materials and self-paced progression.",
    "the-naturalist": "You value a structured academic foundation with strong nature connections. Think classical mornings and nature study afternoons — the best of both worlds.",
    "the-storyteller": "You're a classical educator with a Charlotte Mason heart. Great books, narration, and structured lessons blend into a rich, literature-centered education.",
    "the-architect": "You build a structured academic plan and bring it to life through projects. Your child learns the theory, then proves they understand it by creating something real.",
    "the-free-spirit": "You value structure for core academics but trust your child to lead their own deeper explorations. A planned foundation with freedom at the edges.",
    "the-weaver": "You anchor your day in classical structure but freely borrow methods from other philosophies. You're organized but never rigid.",
  },
  "the-explorer": {
    "the-guide": "You follow your child's curiosity first, but you value knowing the standards are being met. Freedom with an academic safety net.",
    "the-cultivator": "You blend child-led exploration with Montessori's prepared environment. Your child discovers the world, and you make sure the right materials are always within reach.",
    "the-naturalist": "The world is your classroom and nature is your curriculum. You follow your child into the woods, the garden, the creek — and learning happens everywhere you go.",
    "the-storyteller": "You follow your child's interests and weave them into rich stories and living books. Every curiosity becomes a narrative journey.",
    "the-architect": "You let your child's curiosity lead, then turn their interests into hands-on projects. Discovery first, then building something meaningful from what they've found.",
    "the-free-spirit": "You're deeply child-led with a trust in unschooling principles. You follow interests wherever they go, with almost no predetermined structure.",
    "the-weaver": "You follow the child's curiosity but pull from many traditions to support their learning. Whatever method works for today's fascination, that's what you use.",
  },
  "the-cultivator": {
    "the-guide": "You create a Montessori-inspired environment with classical academic expectations. Structured progression through hands-on, self-directed work.",
    "the-explorer": "You prepare the environment like Montessori, but you're also happy following your child outside the prepared space when curiosity calls.",
    "the-naturalist": "You blend Montessori's hands-on materials with nature-based learning. Your prepared environment extends outdoors, where natural materials become learning tools.",
    "the-storyteller": "You value Montessori's self-directed approach and Charlotte Mason's living books equally. Your child chooses their work, and beautiful literature is always an option.",
    "the-architect": "You combine Montessori's hands-on independence with project-based learning. Your child chooses what to build, and the prepared environment provides the tools.",
    "the-free-spirit": "You prepare the environment, but you also deeply trust your child to direct their own learning. More Montessori freedom than Montessori structure.",
    "the-weaver": "You root your approach in Montessori principles but freely incorporate methods from other traditions when they serve your child's needs.",
  },
  "the-naturalist": {
    "the-guide": "Nature is your primary classroom, but you maintain academic structure and standards tracking. Outdoor learning with measurable outcomes.",
    "the-explorer": "You're nature-first and child-led. Your child explores their environment freely, and you turn their outdoor discoveries into deep learning moments.",
    "the-cultivator": "You bring Montessori's prepared environment outdoors. Nature provides the materials, and your child engages with them at their own pace and direction.",
    "the-storyteller": "You combine nature-based learning with Charlotte Mason's living books and narration. Nature journaling, field guides, and stories about the natural world define your days.",
    "the-architect": "Your child learns through place-based projects — building gardens, mapping trails, studying local ecosystems. Nature is both the classroom and the project material.",
    "the-free-spirit": "You trust that nature and freedom are enough. Your child learns by being immersed in the natural world, without prescribed lessons or structured activities.",
    "the-weaver": "Nature is your foundation, but you pull from many methods to enrich outdoor learning. Some days it's nature journaling, others it's building, others it's just observing.",
  },
  "the-storyteller": {
    "the-guide": "You lead with living books and narration but maintain classical structure underneath. Beautiful literature meets rigorous academic expectations.",
    "the-explorer": "You start with living books and narration, then follow wherever the story leads. A Charlotte Mason foundation with an adventurous spirit.",
    "the-cultivator": "You blend Charlotte Mason's living books with Montessori's hands-on independence. Your child narrates stories and then works with materials at their own pace.",
    "the-naturalist": "Living books and nature study are your twin pillars. You read about the natural world, then go outside to observe it firsthand. Beauty in education, always.",
    "the-architect": "You use stories and living books as launchpads for projects. Read about bridges, then build one. Learn about ecosystems through a book, then create a terrarium.",
    "the-free-spirit": "You value Charlotte Mason's gentle approach — short lessons, living books, narration — but you also trust your child to choose what interests them most.",
    "the-weaver": "Living books and narration are your core, but you borrow freely from other methods. You're a Charlotte Mason educator who isn't afraid to try something different.",
  },
  "the-architect": {
    "the-guide": "You design projects within a structured academic framework. Every project has clear learning objectives and meets real standards.",
    "the-explorer": "You build projects from your child's interests. They get curious about something, and you help them turn that curiosity into something they can create with their hands.",
    "the-cultivator": "You combine project-based learning with Montessori's prepared environment. Your workshop is organized, materials are accessible, and your child builds independently.",
    "the-naturalist": "Your projects are rooted in the natural world — building rain gauges, creating habitat maps, designing garden plans. Place-based projects are your specialty.",
    "the-storyteller": "You use stories and books as project inspiration. Every great project starts with a great story, and every project ends with your child telling theirs.",
    "the-free-spirit": "You love projects but you let your child choose them. You provide tools, materials, and support — they decide what to build and how.",
    "the-weaver": "You're project-based at heart but flexible in method. Some projects are structured engineering challenges; others are free-form creative explorations.",
  },
  "the-free-spirit": {
    "the-guide": "You deeply trust child-led learning but keep one eye on academic milestones. Freedom first, with a light structure underneath to catch the gaps.",
    "the-explorer": "You're unschooling with a nature twist. Your child leads, the world is the classroom, and you trust that deep learning happens through life itself.",
    "the-cultivator": "You trust your child to lead their learning, and when they're ready, you offer Montessori-inspired materials and a prepared environment to support them.",
    "the-naturalist": "Pure freedom meets the natural world. Your child learns through direct experience with nature, on their own terms, without imposed curriculum.",
    "the-storyteller": "You're an unschooler who strews beautiful books everywhere. You don't assign reading — you just make sure the right books are always within reach.",
    "the-architect": "Your child leads, and when an interest takes hold, you help them turn it into a project. No forced assignments — just supported creation.",
    "the-weaver": "You're primarily unschooling but you'll pull in a structured resource when it fits. Eclectic freedom — whatever your child needs, you find it.",
  },
  "the-weaver": {
    "the-guide": "You pick and choose from every philosophy, but classical structure is your anchor. An eclectic educator with an organized backbone.",
    "the-explorer": "You draw from many traditions with a child-led heart. Today might be Montessori math, tomorrow might be a nature walk, and that's exactly how you like it.",
    "the-cultivator": "You're eclectic with a Montessori lean. You mix methods freely but always return to hands-on, self-directed work as your home base.",
    "the-naturalist": "You pull from every philosophy and weave nature throughout. Whatever method you're using today, there's always time to go outside.",
    "the-storyteller": "You mix and match methods with a Charlotte Mason undercurrent. Living books appear in every approach you try, because stories make everything better.",
    "the-architect": "You're eclectic with a project-based lean. You try different approaches but always come back to building, creating, and making things real.",
    "the-free-spirit": "You're eclectic and relaxed. You have a toolbox of methods and you pull from it lightly — never too much structure, never too much of any one thing.",
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
