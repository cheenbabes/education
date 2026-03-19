"use client";

import { useMemo, useState } from "react";
import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useExploreState } from "./useExploreState";
import { getCurriculumPlacement, normalizePhilosophyKey, PHILOSOPHY_POSITIONS } from "./positions";
import { nodeKey } from "./useForceLayout";
import * as THREE from "three";

type RenderLine = {
  key: string;
  points: [number, number, number][];
  color: string;
  opacity: number;
  width: number;
  shimmer?: boolean;
  shimmerSpeed?: number;
  shimmerAmount?: number;
};

function AnimatedLine({ line }: { line: RenderLine }) {
  const [opacity, setOpacity] = useState(line.opacity);
  const phase = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < line.key.length; i += 1) hash = (hash * 31 + line.key.charCodeAt(i)) | 0;
    return Math.abs(hash % 628) / 100;
  }, [line.key]);

  useFrame(({ clock }) => {
    if (!line.shimmer) return;
    const pulse = (Math.sin(clock.elapsedTime * (line.shimmerSpeed || 2.8) + phase) + 1) / 2;
    setOpacity(line.opacity + pulse * (line.shimmerAmount || 0.24));
  });

  return (
    <Line
      points={line.points}
      color={line.color}
      lineWidth={line.width}
      transparent
      opacity={line.shimmer ? opacity : line.opacity}
    />
  );
}

export default function ConnectionLines() {
  const { focusedNode, graphData, layoutPositions } = useExploreState();

  const lines = useMemo(() => {
    if (!focusedNode) return [];
    const result: RenderLine[] = [];

    const pushCurriculumLinks = (philosophyId: string, color: string, opacity = 0.32) => {
      const philLayout = layoutPositions.positions.get(nodeKey("philosophy", philosophyId));
      const philPos: [number, number, number] = philLayout
        ? [philLayout.x, philLayout.y, 0]
        : (() => { const c = PHILOSOPHY_POSITIONS[philosophyId]; return c ? [c[0], c[1], 0] as [number, number, number] : [0, 0, 0] as [number, number, number]; })();
      for (let i = 0; i < graphData.curricula.length; i += 1) {
        const curriculum = graphData.curricula[i];
        const connected = Object.entries(curriculum.philosophyScores).some(
          ([key, score]) => normalizePhilosophyKey(key) === philosophyId && score > 0.08,
        );
        if (!connected) continue;
        const cLayout = layoutPositions.positions.get(nodeKey("curriculum", curriculum.id));
        const cPos: [number, number, number] = cLayout
          ? [cLayout.x, cLayout.y, 0]
          : getCurriculumPlacement(curriculum.philosophyScores, i).position;
        result.push({
          key: `${philosophyId}-${curriculum.id}`,
          points: [philPos, cPos],
          color,
          opacity,
          width: 0.95,
          shimmer: true,
          shimmerSpeed: 2.6,
          shimmerAmount: 0.28,
        });
      }
    };

    const arcPositions = (
      centerX: number,
      centerY: number,
      count: number,
      minRadius: number,
      maxRadius: number,
      startAngle: number,
      endAngle: number,
      seed: number,
    ): [number, number, number][] => {
      const positions: [number, number, number][] = [];
      for (let i = 0; i < count; i += 1) {
        const t = count === 1 ? 0.5 : i / (count - 1);
        const angle = startAngle + t * (endAngle - startAngle);
        const rRand =
          minRadius + (maxRadius - minRadius) * (0.4 + 0.6 * Math.abs(Math.sin(seed + i * 7.13)));
        const aRand = angle + Math.sin(seed + i * 3.77) * 0.15;
        positions.push([centerX + rRand * Math.cos(aRand), centerY + rRand * Math.sin(aRand), 0]);
      }
      return positions;
    };

    if (focusedNode.type === "philosophy") {
      const philosophy = graphData.philosophies.find((p) => p.name === focusedNode.id);
      if (!philosophy) return [];
      pushCurriculumLinks(philosophy.name, "#e6c887", 0.26);
      return result;
    }

    if (focusedNode.type === "curriculum") {
      const curriculumIndex = graphData.curricula.findIndex((c) => c.id === focusedNode.id);
      if (curriculumIndex < 0) return [];
      const curriculum = graphData.curricula[curriculumIndex];
      const cLayout = layoutPositions.positions.get(nodeKey("curriculum", curriculum.id));
      const cPos: [number, number, number] = cLayout
        ? [cLayout.x, cLayout.y, 0]
        : getCurriculumPlacement(curriculum.philosophyScores, curriculumIndex).position;
      const weighted = Object.entries(curriculum.philosophyScores)
        .map(([key, score]) => ({ key: normalizePhilosophyKey(key), score }))
        .filter((entry) => entry.score > 0.08 && (layoutPositions.positions.get(nodeKey("philosophy", entry.key)) || PHILOSOPHY_POSITIONS[entry.key]))
        .sort((a, b) => b.score - a.score)
        .slice(0, 4);

      for (const entry of weighted) {
        const philLayout = layoutPositions.positions.get(nodeKey("philosophy", entry.key));
        const philPos: [number, number, number] = philLayout
          ? [philLayout.x, philLayout.y, 0]
          : (() => { const p = PHILOSOPHY_POSITIONS[entry.key]; return p ? [p[0], p[1], 0] as [number, number, number] : [0, 0, 0] as [number, number, number]; })();
        result.push({
          key: `${curriculum.id}-${entry.key}`,
          points: [philPos, cPos],
          color: "#f1d79f",
          opacity: THREE.MathUtils.clamp(0.18 + entry.score * 0.24, 0.18, 0.34),
          width: 1.18,
          shimmer: true,
          shimmerSpeed: 2.9,
          shimmerAmount: 0.22,
        });
      }
      return result;
    }

    if (focusedNode.type === "principle" || focusedNode.type === "activity" || focusedNode.type === "material") {
      const details = focusedNode.type === "principle"
        ? graphData.principles
        : focusedNode.type === "activity"
          ? graphData.activities
          : graphData.materials;
      const detail = details.find((item) => item.id === focusedNode.id);
      if (!detail) return [];
      const philLayout = layoutPositions.positions.get(nodeKey("philosophy", detail.philosophyId));
      const center = philLayout
        ? [philLayout.x, philLayout.y] as [number, number]
        : PHILOSOPHY_POSITIONS[detail.philosophyId];
      if (!center) return [];
      const [x, y] = center;
      const siblingList = focusedNode.type === "principle"
        ? graphData.principles.filter((p) => p.philosophyId === detail.philosophyId)
        : focusedNode.type === "activity"
          ? graphData.activities.filter((a) => a.philosophyId === detail.philosophyId)
          : graphData.materials.filter((m) => m.philosophyId === detail.philosophyId);
      const idx = Math.max(0, siblingList.findIndex((item) => item.id === detail.id));
      const arc = focusedNode.type === "principle"
        ? arcPositions(x, y, Math.max(1, siblingList.length), 0.5, 2.0, Math.PI * 0.2, Math.PI * 0.8, 42)
        : focusedNode.type === "activity"
          ? arcPositions(x, y, Math.max(1, siblingList.length), 0.5, 2.0, -Math.PI * 0.8, -Math.PI * 0.2, 137)
          : arcPositions(x, y, Math.max(1, siblingList.length), 0.5, 2.0, -Math.PI * 0.3, Math.PI * 0.3, 271);
      const detailPos = arc[Math.min(idx, arc.length - 1)] || [x, y, 0];

      result.push({
        key: `${focusedNode.type}-${focusedNode.id}-anchor`,
        points: [[x, y, 0], detailPos],
        color: "#e8bf78",
        opacity: 0.28,
        width: 1.1,
        shimmer: true,
        shimmerSpeed: 2.4,
        shimmerAmount: 0.2,
      });
      pushCurriculumLinks(detail.philosophyId, "#d3a95d", 0.12);
      return result;
    }

    return [];
  }, [focusedNode, graphData, layoutPositions]);

  if (lines.length === 0) return null;

  return (
    <group>
      {lines.map((line) => (
        <AnimatedLine key={line.key} line={line} />
      ))}
    </group>
  );
}
