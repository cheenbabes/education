"use client";

import { useMemo } from "react";
import { Line } from "@react-three/drei";
import { useExploreState } from "./useExploreState";
import { CurriculumNode } from "./types";

const PHILOSOPHY_DIMENSIONS: Record<
  string,
  { structure: number; modality: number }
> = {
  classical: { structure: 85, modality: 80 },
  "charlotte-mason": { structure: 60, modality: 55 },
  "waldorf-adjacent": { structure: 45, modality: 25 },
  "montessori-inspired": { structure: 35, modality: 30 },
  "project-based-learning": { structure: 40, modality: 35 },
  "place-nature-based": { structure: 30, modality: 15 },
  unschooling: { structure: 10, modality: 20 },
  flexible: { structure: 50, modality: 50 },
};

const ALL_DIMENSIONS: Record<
  string,
  { structure: number; modality: number }
> = {
  ...PHILOSOPHY_DIMENSIONS,
  charlotte_mason: { structure: 60, modality: 55 },
  waldorf: { structure: 45, modality: 25 },
  montessori: { structure: 35, modality: 30 },
  project_based: { structure: 40, modality: 35 },
  place_nature: { structure: 30, modality: 15 },
  eclectic_flexible: { structure: 50, modality: 50 },
};

/** Normalize philosophy key variants to canonical form */
function normalizePhilKey(key: string): string {
  const map: Record<string, string> = {
    charlotte_mason: "charlotte-mason",
    waldorf: "waldorf-adjacent",
    montessori: "montessori-inspired",
    project_based: "project-based-learning",
    place_nature: "place-nature-based",
    eclectic_flexible: "flexible",
  };
  return map[key] || key;
}

/** Compute curriculum position (same formula as CurriculumMoon) */
function getCurriculumPosition(
  curriculum: CurriculumNode,
): [number, number, number] {
  let weightedStructure = 0;
  let weightedModality = 0;
  let totalWeight = 0;

  for (const [phil, score] of Object.entries(curriculum.philosophyScores)) {
    const dims = ALL_DIMENSIONS[phil];
    if (!dims || score <= 0) continue;
    weightedStructure += score * dims.structure;
    weightedModality += score * dims.modality;
    totalWeight += score;
  }

  if (totalWeight === 0) return [0, 0, 0];

  const avgStructure = weightedStructure / totalWeight;
  const avgModality = weightedModality / totalWeight;

  const x = (avgStructure / 100) * 12 - 6;
  const y = (avgModality / 100) * -8 + 4;
  return [x, y, 0];
}

export default function ConnectionLines() {
  const { focusedNode, graphData } = useExploreState();

  const lines = useMemo(() => {
    if (!focusedNode || focusedNode.type !== "philosophy") return [];

    const philosophy = graphData.philosophies.find(
      (p) => p.name === focusedNode.id,
    );
    if (!philosophy) return [];

    // Philosophy position (same formula as PhilosophyStar)
    const px = (philosophy.dimensions.structure / 100) * 12 - 6;
    const py = (philosophy.dimensions.modality / 100) * -8 + 4;
    const philPos: [number, number, number] = [px, py, 0];

    // Find all curricula connected to this philosophy
    const result: {
      key: string;
      points: [number, number, number][];
      color: string;
    }[] = [];

    for (const c of graphData.curricula) {
      let isConnected = false;
      for (const [key, score] of Object.entries(c.philosophyScores)) {
        if (normalizePhilKey(key) === focusedNode.id && score > 0) {
          isConnected = true;
          break;
        }
      }

      if (isConnected) {
        const cPos = getCurriculumPosition(c);
        result.push({
          key: c.id,
          points: [philPos, cPos],
          color: philosophy.color,
        });
      }
    }

    return result;
  }, [focusedNode, graphData]);

  if (lines.length === 0) return null;

  return (
    <group>
      {lines.map((line) => (
        <Line
          key={line.key}
          points={line.points}
          color={line.color}
          lineWidth={1}
          transparent
          opacity={0.3}
        />
      ))}
    </group>
  );
}
