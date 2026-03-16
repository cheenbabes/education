/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
/**
 * Persona simulation — run with: npx tsx src/lib/compass/simulate-personas.ts
 *
 * Shows how each persona answers each question, their resulting philosophy
 * blend, archetype, and whether it matches expectations.
 */
import { PART1_QUESTIONS } from "./questions";
import { scoreCompass, PHILOSOPHY_LABELS, DIMENSION_LABELS, PhilosophyKey } from "./scoring";
import { PERSONAS, Persona } from "./personas";
import { ARCHETYPES } from "./archetypes";

const verbose = process.argv.includes("--verbose") || process.argv.includes("-v");
const personaFilter = process.argv.find(a => a.startsWith("--persona="))?.split("=")[1];

function scoreChoice(
  persona: Persona,
  choice: { text: string; philosophies: Record<string, number>; dimensions: Record<string, number> },
): number {
  let score = 0;

  // Philosophy match (primary signal)
  for (const [phil, weight] of Object.entries(persona.philosophyWeights)) {
    const choicePts = (choice.philosophies as Record<string, number>)[phil] || 0;
    score += choicePts * weight;
  }

  // Dimension match (secondary signal, 30% weight)
  for (const [dim, bias] of Object.entries(persona.dimensionBiases)) {
    const choiceDim = (choice.dimensions as Record<string, number>)[dim] || 0;
    score += choiceDim * bias * 0.3;
  }

  return score;
}

function pickChoice(persona: Persona, questionId: string): { idx: number; score: number; allScores: number[] } {
  const q = PART1_QUESTIONS.find(q => q.id === questionId)!;
  let bestIdx = 0;
  let bestScore = -Infinity;
  const allScores: number[] = [];

  for (let i = 0; i < q.choices.length; i++) {
    const s = scoreChoice(persona, q.choices[i] as any);
    allScores.push(Math.round(s * 100) / 100);
    if (s > bestScore) {
      bestScore = s;
      bestIdx = i;
    }
  }

  return { idx: bestIdx, score: bestScore, allScores };
}

// --- Run simulation ---

console.log("=".repeat(80));
console.log("EDUCATION COMPASS — PERSONA SIMULATION");
console.log("=".repeat(80));
console.log(`${PERSONAS.length} personas × ${PART1_QUESTIONS.length} questions\n`);

const results: Array<{
  persona: string;
  expected: string;
  got: string;
  gotSecondary: string;
  match: boolean;
  topPhils: string;
}> = [];

for (const persona of PERSONAS) {
  if (personaFilter && !persona.name.toLowerCase().includes(personaFilter.toLowerCase())) continue;

  const answers: Record<string, number> = {};

  if (verbose) {
    console.log("\n" + "─".repeat(80));
    console.log(`👤 ${persona.name}`);
    console.log(`   ${persona.description}`);
    console.log(`   Expected: ${persona.expectedArchetype}`);
    console.log("─".repeat(80));
  }

  for (const q of PART1_QUESTIONS) {
    const { idx, score, allScores } = pickChoice(persona, q.id);
    answers[q.id] = idx;

    if (verbose) {
      const choice = q.choices[idx];
      const philTags = Object.entries(choice.philosophies)
        .filter(([, v]) => (v as number) > 0)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .map(([k, v]) => `${(PHILOSOPHY_LABELS as any)[k]?.split(/[\s/]/)[0] || k}+${v}`)
        .join(", ");

      console.log(`\n  ${q.id}: ${q.scenario.slice(0, 70)}...`);
      console.log(`  Scores: [${allScores.map((s, i) => i === idx ? `*${s}*` : `${s}`).join(", ")}]`);
      console.log(`  → Choice ${idx + 1}: "${choice.text.slice(0, 80)}..."`);
      console.log(`    Tags: ${philTags}`);
    }
  }

  const result = scoreCompass(answers);
  const topPhils = Object.entries(result.philosophies)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([k, v]) => `${(PHILOSOPHY_LABELS as any)[k]?.split(/[\s/]/)[0] || k} ${v}%`)
    .join(", ");

  const match = result.archetype.id === persona.expectedArchetype;
  const secondary = result.secondaryArchetype?.name || "none";

  if (verbose) {
    console.log(`\n  📊 Philosophy blend: ${topPhils}`);
    console.log(`  🎯 Result: ${result.archetype.name} with ${secondary} tendencies`);
    console.log(`  ${match ? "✅" : "❌"} Expected: ${persona.expectedArchetype} → Got: ${result.archetype.id}`);

    // Show all archetype scores
    console.log(`\n  Archetype scores:`);
    for (const s of result.archetypeScores) {
      const bar = "█".repeat(Math.round(s.score * 30));
      const marker = s.id === result.archetype.id ? " ◄ PRIMARY" : s.id === result.secondaryArchetype?.id ? " ◄ secondary" : "";
      console.log(`    ${s.name.padEnd(18)} ${s.score.toFixed(3)} ${bar}${marker}`);
    }
  }

  results.push({
    persona: persona.name,
    expected: persona.expectedArchetype,
    got: result.archetype.id,
    gotSecondary: secondary,
    match,
    topPhils,
  });
}

// --- Summary table ---
console.log("\n" + "=".repeat(80));
console.log("SUMMARY");
console.log("=".repeat(80));
console.log(
  "Persona".padEnd(28) +
  "Expected".padEnd(18) +
  "Got".padEnd(18) +
  "Secondary".padEnd(18) +
  "Match"
);
console.log("-".repeat(100));

for (const r of results) {
  const expectedName = ARCHETYPES.find(a => a.id === r.expected)?.name || r.expected;
  const gotName = ARCHETYPES.find(a => a.id === r.got)?.name || r.got;
  console.log(
    r.persona.padEnd(28) +
    expectedName.padEnd(18) +
    gotName.padEnd(18) +
    r.gotSecondary.padEnd(18) +
    (r.match ? "✅" : "❌")
  );
}

const matchCount = results.filter(r => r.match).length;
console.log(`\n${matchCount}/${results.length} personas matched expected archetype (${Math.round(matchCount / results.length * 100)}%)`);

// Archetype coverage
const gotArchetypes = new Set(results.map(r => r.got));
const missingArchetypes = ARCHETYPES.filter(a => !gotArchetypes.has(a.id));
if (missingArchetypes.length > 0) {
  console.log(`\n⚠️  Archetypes not reached by any persona: ${missingArchetypes.map(a => a.name).join(", ")}`);
} else {
  console.log(`\n✅ All ${ARCHETYPES.length} archetypes reached by at least one persona`);
}

// Uniqueness check
const archetypeCombos = results.map(r => `${r.got}+${r.gotSecondary}`);
const uniqueCombos = new Set(archetypeCombos);
console.log(`\n📊 ${uniqueCombos.size} unique primary+secondary combos from ${results.length} personas`);

console.log("\nUsage:");
console.log("  npx tsx src/lib/compass/simulate-personas.ts           # summary only");
console.log("  npx tsx src/lib/compass/simulate-personas.ts -v        # verbose (all questions)");
console.log("  npx tsx src/lib/compass/simulate-personas.ts --persona=carla -v  # single persona");
