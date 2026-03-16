/**
 * Tests that every archetype is reachable through quiz answers.
 * 8 archetypes, each driven by a primary philosophy signal.
 */
import { scoreCompass } from "../scoring";
import { ARCHETYPES } from "../archetypes";
import { PART1_QUESTIONS } from "../questions";

function findBestChoice(
  questionId: string,
  targetPhilosophies: string[],
  dimensionBias?: Record<string, number>,
): number {
  const q = PART1_QUESTIONS.find((q) => q.id === questionId)!;
  let bestIdx = 0;
  let bestScore = -Infinity;

  for (let i = 0; i < q.choices.length; i++) {
    let score = 0;
    for (const phil of targetPhilosophies) {
      score += (q.choices[i].philosophies as Record<string, number>)[phil] || 0;
    }
    if (dimensionBias) {
      for (const [dim, targetDir] of Object.entries(dimensionBias)) {
        const choiceDim = (q.choices[i].dimensions as Record<string, number>)[dim] || 0;
        score += choiceDim * targetDir * 0.5;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return bestIdx;
}

function buildAnswers(
  targetPhilosophies: string[],
  dimensionBias?: Record<string, number>,
): Record<string, number> {
  const answers: Record<string, number> = {};
  for (const q of PART1_QUESTIONS) {
    answers[q.id] = findBestChoice(q.id, targetPhilosophies, dimensionBias);
  }
  return answers;
}

describe("Archetype reachability (8 archetypes)", () => {
  test("The Guide is reachable via classical answers", () => {
    const answers = buildAnswers(["classical"]);
    const result = scoreCompass(answers);
    expect(result.archetype.id).toBe("the-guide");
  });

  test("The Explorer is reachable via place/nature + unschooling answers", () => {
    const answers = buildAnswers(["place_nature", "unschooling"], { direction: 1 });
    const result = scoreCompass(answers);
    expect(result.archetype.id).toBe("the-explorer");
  });

  test("The Cultivator is reachable via montessori answers", () => {
    const answers = buildAnswers(["montessori"]);
    const result = scoreCompass(answers);
    expect(result.archetype.id).toBe("the-cultivator");
  });

  test("The Naturalist is reachable via place/nature answers", () => {
    const answers = buildAnswers(["place_nature", "waldorf"], { modality: -1 });
    const result = scoreCompass(answers);
    expect(result.archetype.id).toBe("the-naturalist");
  });

  test("The Storyteller is reachable via charlotte mason answers", () => {
    const answers = buildAnswers(["charlotte_mason"]);
    const result = scoreCompass(answers);
    expect(result.archetype.id).toBe("the-storyteller");
  });

  test("The Architect is reachable via project-based answers", () => {
    const answers = buildAnswers(["project_based"]);
    const result = scoreCompass(answers);
    expect(result.archetype.id).toBe("the-architect");
  });

  test("The Free Spirit is reachable via unschooling answers", () => {
    const answers = buildAnswers(["unschooling"]);
    const result = scoreCompass(answers);
    expect(result.archetype.id).toBe("the-free-spirit");
  });

  test("The Weaver is reachable via eclectic answers", () => {
    const answers = buildAnswers(["eclectic_flexible"]);
    const result = scoreCompass(answers);
    expect(result.archetype.id).toBe("the-weaver");
  });
});

describe("Archetype distribution", () => {
  test("not all answer patterns produce The Weaver", () => {
    const patterns = [
      ["classical"],
      ["montessori"],
      ["waldorf"],
      ["charlotte_mason"],
      ["project_based"],
      ["place_nature"],
      ["unschooling"],
      ["eclectic_flexible"],
      ["montessori", "unschooling"],
      ["classical", "charlotte_mason"],
    ];

    const results = patterns.map((phils) => scoreCompass(buildAnswers(phils)).archetype.id);
    const unique = new Set(results);

    // At least 6 different archetypes from 10 patterns
    expect(unique.size).toBeGreaterThanOrEqual(6);

    // Weaver should NOT dominate
    const weaverCount = results.filter((id) => id === "the-weaver").length;
    expect(weaverCount).toBeLessThanOrEqual(2);
  });

  test("every archetype appears in at least one scenario", () => {
    const reached = new Set<string>();
    const combos: Array<{ phils: string[]; dimBias?: Record<string, number> }> = [
      { phils: ["classical"] },
      { phils: ["montessori"] },
      { phils: ["charlotte_mason"] },
      { phils: ["project_based"] },
      { phils: ["unschooling"] },
      { phils: ["eclectic_flexible"] },
      { phils: ["montessori", "unschooling"] },
      { phils: ["place_nature", "waldorf"], dimBias: { modality: -1 } },
      { phils: ["classical", "charlotte_mason"] },
      { phils: ["waldorf", "place_nature"] },
      { phils: ["charlotte_mason", "place_nature"] },
      { phils: ["unschooling", "project_based"] },
    ];

    for (const { phils, dimBias } of combos) {
      const result = scoreCompass(buildAnswers(phils, dimBias));
      reached.add(result.archetype.id);
    }

    for (const a of ARCHETYPES) {
      expect(reached).toContain(a.id);
    }
  });
});
