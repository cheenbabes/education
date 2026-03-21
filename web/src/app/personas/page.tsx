"use client";

import { useState, useMemo } from "react";
import { Shell } from "@/components/shell";
import { PART1_QUESTIONS, AnswerChoice } from "@/lib/compass/questions";
import {
  scoreCompass,
  PHILOSOPHY_LABELS,
  PHILOSOPHY_COLORS,
  DIMENSION_LABELS,
  PhilosophyKey,
} from "@/lib/compass/scoring";
import { PERSONAS, Persona } from "@/lib/compass/personas";
import { ARCHETYPES } from "@/lib/compass/archetypes";

const ALL_PHILS: PhilosophyKey[] = [
  "montessori", "waldorf", "project_based", "place_nature",
  "classical", "charlotte_mason", "unschooling", "adaptive",
];
const ALL_DIMS = ["structure", "modality", "subjectApproach", "direction", "social"] as const;

function scoreChoice(
  persona: Persona,
  choice: AnswerChoice,
): number {
  let score = 0;
  for (const [phil, weight] of Object.entries(persona.philosophyWeights)) {
    score += ((choice.philosophies as Record<string, number>)[phil] || 0) * weight;
  }
  for (const [dim, bias] of Object.entries(persona.dimensionBiases)) {
    score += ((choice.dimensions as Record<string, number>)[dim] || 0) * bias * 0.3;
  }
  return score;
}

function simulatePersona(persona: Persona) {
  const answers: Record<string, number> = {};
  const questionDetails: Array<{
    id: string;
    scenario: string;
    chosenIdx: number;
    chosenText: string;
    chosenPhils: Record<string, number>;
    allScores: number[];
  }> = [];

  for (const q of PART1_QUESTIONS) {
    let bestIdx = 0;
    let bestScore = -Infinity;
    const allScores: number[] = [];

    for (let i = 0; i < q.choices.length; i++) {
      const s = scoreChoice(persona, q.choices[i]);
      allScores.push(Math.round(s * 100) / 100);
      if (s > bestScore) { bestScore = s; bestIdx = i; }
    }

    answers[q.id] = bestIdx;
    questionDetails.push({
      id: q.id,
      scenario: q.scenario,
      chosenIdx: bestIdx,
      chosenText: q.choices[bestIdx].text,
      chosenPhils: q.choices[bestIdx].philosophies as Record<string, number>,
      allScores,
    });
  }

  const result = scoreCompass(answers);
  return { result, questionDetails };
}

export default function PersonasPage() {
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [customPersona, setCustomPersona] = useState<Persona>({
    name: "Custom Persona",
    description: "Adjust the sliders to model a specific parent/teacher type",
    expectedArchetype: "",
    philosophyWeights: { montessori: 0.5, waldorf: 0.5, project_based: 0.5, place_nature: 0.5, classical: 0.5, charlotte_mason: 0.5, unschooling: 0.5, adaptive: 0.5 },
    dimensionBiases: { structure: 0, modality: 0, subjectApproach: 0, direction: 0, social: 0 },
  });

  // Summary simulation for all personas
  const allResults = useMemo(() => {
    return PERSONAS.map((p) => {
      const { result } = simulatePersona(p);
      return {
        persona: p,
        archetype: result.archetype,
        secondary: result.secondaryArchetype,
        match: result.archetype.id === p.expectedArchetype,
        topPhils: Object.entries(result.philosophies)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3),
      };
    });
  }, []);

  // Detailed simulation for selected persona
  const detailedResult = useMemo(() => {
    if (selectedPersona === "__custom__") return simulatePersona(customPersona);
    const persona = PERSONAS.find((p) => p.name === selectedPersona);
    if (!persona) return null;
    return simulatePersona(persona);
  }, [selectedPersona, customPersona]);

  const activePersona = selectedPersona === "__custom__"
    ? customPersona
    : PERSONAS.find((p) => p.name === selectedPersona) || null;

  const matchCount = allResults.filter((r) => r.match).length;
  const archetypesReached = new Set(allResults.map((r) => r.archetype.id));

  return (
    <Shell>
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Persona Simulator</h1>
          <span className="text-sm text-gray-500">
            {matchCount}/{PERSONAS.length} match &middot; {archetypesReached.size}/8 archetypes
          </span>
        </div>

        {/* Summary table */}
        <div className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-left">
                <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Persona</th>
                <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Expected</th>
                <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Got</th>
                <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Secondary</th>
                <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Top Philosophies</th>
                <th className="p-3 font-medium text-gray-700 dark:text-gray-300 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {allResults.map((r) => {
                const expectedName = ARCHETYPES.find((a) => a.id === r.persona.expectedArchetype)?.name || "?";
                return (
                  <tr
                    key={r.persona.name}
                    className={`border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      selectedPersona === r.persona.name ? "bg-blue-50 dark:bg-blue-950" : ""
                    }`}
                    onClick={() => { setSelectedPersona(r.persona.name); setEditMode(false); }}
                  >
                    <td className="p-3">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{r.persona.name}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[200px]">{r.persona.description}</div>
                    </td>
                    <td className="p-3 text-gray-600 dark:text-gray-400">{expectedName}</td>
                    <td className="p-3">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {r.archetype.icon} {r.archetype.name}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500 dark:text-gray-400 text-xs">{r.secondary?.name || "—"}</td>
                    <td className="p-3">
                      <div className="flex gap-1 flex-wrap">
                        {r.topPhils.map(([k, v]) => (
                          <span
                            key={k}
                            className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: `${PHILOSOPHY_COLORS[k as PhilosophyKey]}20`,
                              color: PHILOSOPHY_COLORS[k as PhilosophyKey],
                            }}
                          >
                            {PHILOSOPHY_LABELS[k as PhilosophyKey]?.split(/[\s/]/)[0]} {v}%
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-center">{r.match ? "✅" : "❌"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Custom persona button */}
        <button
          onClick={() => { setSelectedPersona("__custom__"); setEditMode(true); }}
          className={`w-full py-2 rounded border text-sm ${
            selectedPersona === "__custom__"
              ? "bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
              : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
        >
          + Create Custom Persona
        </button>

        {/* Custom persona editor */}
        {selectedPersona === "__custom__" && editMode && (
          <div className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800 p-4 space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Custom Persona Editor</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Name</label>
                <input
                  type="text"
                  value={customPersona.name}
                  onChange={(e) => setCustomPersona({ ...customPersona, name: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Description</label>
                <input
                  type="text"
                  value={customPersona.description}
                  onChange={(e) => setCustomPersona({ ...customPersona, description: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Philosophy Weights (0 = not at all, 1 = strongly)</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {ALL_PHILS.map((phil) => (
                  <div key={phil}>
                    <label className="text-[11px] text-gray-500 dark:text-gray-400 block mb-0.5">
                      {PHILOSOPHY_LABELS[phil]?.split(/[\s/]/)[0]}: {(customPersona.philosophyWeights[phil] || 0).toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={customPersona.philosophyWeights[phil] || 0}
                      onChange={(e) => setCustomPersona({
                        ...customPersona,
                        philosophyWeights: { ...customPersona.philosophyWeights, [phil]: parseFloat(e.target.value) },
                      })}
                      className="w-full h-1.5 accent-gray-900 dark:accent-gray-100"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Dimension Biases (-1 = left pole, 0 = neutral, 1 = right pole)</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {ALL_DIMS.map((dim) => (
                  <div key={dim}>
                    <label className="text-[11px] text-gray-500 dark:text-gray-400 block mb-0.5">
                      {DIMENSION_LABELS[dim].left} ← {DIMENSION_LABELS[dim].name}: {(customPersona.dimensionBiases[dim] || 0).toFixed(1)} → {DIMENSION_LABELS[dim].right}
                    </label>
                    <input
                      type="range"
                      min="-1"
                      max="1"
                      step="0.1"
                      value={customPersona.dimensionBiases[dim] || 0}
                      onChange={(e) => setCustomPersona({
                        ...customPersona,
                        dimensionBiases: { ...customPersona.dimensionBiases, [dim]: parseFloat(e.target.value) },
                      })}
                      className="w-full h-1.5 accent-gray-900 dark:accent-gray-100"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Detailed view for selected persona */}
        {detailedResult && activePersona && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  {detailedResult.result.archetype.icon} {activePersona.name} → {detailedResult.result.archetype.name}
                  {detailedResult.result.secondaryArchetype && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                      {" "}with {detailedResult.result.secondaryArchetype.name} tendencies
                    </span>
                  )}
                </h3>
                {activePersona.expectedArchetype && (
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    detailedResult.result.archetype.id === activePersona.expectedArchetype
                      ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                      : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                  }`}>
                    {detailedResult.result.archetype.id === activePersona.expectedArchetype ? "✅ Match" : "❌ Mismatch"}
                  </span>
                )}
              </div>

              {/* Archetype scores */}
              <div className="space-y-1 mt-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Archetype Scores</p>
                {detailedResult.result.archetypeScores.map((s, idx) => {
                  const maxScore = detailedResult.result.archetypeScores[0].score;
                  const pct = maxScore > 0 ? (s.score / maxScore) * 100 : 0;
                  return (
                    <div key={s.id} className="flex items-center gap-2">
                      <span className={`text-xs w-24 text-right ${idx === 0 ? "font-bold text-gray-900 dark:text-gray-100" : idx === 1 ? "font-medium text-gray-700 dark:text-gray-300" : "text-gray-500 dark:text-gray-400"}`}>
                        {s.name}
                      </span>
                      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${idx === 0 ? "bg-gray-900 dark:bg-gray-100" : idx === 1 ? "bg-gray-400 dark:bg-gray-500" : "bg-gray-200 dark:bg-gray-700"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 w-12 text-right font-mono">{s.score.toFixed(3)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Question-by-question breakdown */}
            <div className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800 p-4 space-y-3">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Question-by-Question Answers</h3>
              {detailedResult.questionDetails.map((qd) => (
                <div key={qd.id} className="border-b border-gray-100 dark:border-gray-800 pb-2 last:border-0">
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{qd.id}: {qd.scenario.slice(0, 80)}...</p>
                  <div className="flex items-start gap-2">
                    <span className="text-xs bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      {qd.chosenIdx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300">{qd.chosenText.slice(0, 100)}{qd.chosenText.length > 100 ? "..." : ""}</p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {Object.entries(qd.chosenPhils)
                          .filter(([, v]) => (v as number) > 0)
                          .sort(([, a], [, b]) => (b as number) - (a as number))
                          .map(([k, v]) => (
                            <span
                              key={k}
                              className="text-[10px] px-1.5 py-0.5 rounded"
                              style={{
                                backgroundColor: `${PHILOSOPHY_COLORS[k as PhilosophyKey]}20`,
                                color: PHILOSOPHY_COLORS[k as PhilosophyKey],
                              }}
                            >
                              {PHILOSOPHY_LABELS[k as PhilosophyKey]?.split(/[\s/]/)[0]}+{v as number}
                            </span>
                          ))}
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">
                          scores: [{qd.allScores.map((s, i) => i === qd.chosenIdx ? `*${s}*` : s).join(", ")}]
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
