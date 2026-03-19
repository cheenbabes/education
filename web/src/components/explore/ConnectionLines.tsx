"use client";

import { useMemo } from "react";
import { Line } from "@react-three/drei";
import { useExploreState } from "./useExploreState";
import { CurriculumNode } from "./types";
import { PHILOSOPHY_POSITIONS } from "./positions";

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
  index: number,
): [number, number, number] {
  let weightedX = 0;
  let weightedY = 0;
  let totalWeight = 0;

  for (const [phil, score] of Object.entries(curriculum.philosophyScores)) {
    if (score <= 0) continue;
    const canonical = normalizePhilKey(phil);
    const pos = PHILOSOPHY_POSITIONS[canonical];
    if (!pos) continue;
    weightedX += score * pos[0];
    weightedY += score * pos[1];
    totalWeight += score;
  }

  if (totalWeight === 0) return [0, 0, 0];

  const computedX = weightedX / totalWeight;
  const computedY = weightedY / totalWeight;

  // Add deterministic jitter (same as CurriculumMoon)
  const jitterX = Math.sin(index * 7.13) * 1.2;
  const jitterY = Math.cos(index * 5.37) * 0.8;
  return [computedX + jitterX, computedY + jitterY, 0];
}

export default function ConnectionLines() {
  const { focusedNode, graphData } = useExploreState();

  const lines = useMemo(() => {
    if (!focusedNode || focusedNode.type !== "philosophy") return [];

    const philosophy = graphData.philosophies.find(
      (p) => p.name === focusedNode.id,
    );
    if (!philosophy) return [];

    // Philosophy position from manual positions
    const manualPos = PHILOSOPHY_POSITIONS[philosophy.name] || [0, 0];
    const philPos: [number, number, number] = [manualPos[0], manualPos[1], 0];

    // Find all curricula connected to this philosophy
    const result: {
      key: string;
      points: [number, number, number][];
      color: string;
    }[] = [];

    for (let i = 0; i < graphData.curricula.length; i++) {
      const c = graphData.curricula[i];
      let isConnected = false;
      for (const [key, score] of Object.entries(c.philosophyScores)) {
        if (normalizePhilKey(key) === focusedNode.id && score > 0) {
          isConnected = true;
          break;
        }
      }

      if (isConnected) {
        const cPos = getCurriculumPosition(c, i);
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
