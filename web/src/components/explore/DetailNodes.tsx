"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Line } from "@react-three/drei";
import * as THREE from "three";
import { useExploreState } from "./useExploreState";
import { nodeKey } from "./useForceLayout";
import {
  PHILOSOPHY_POSITIONS,
  getCurriculumPlacement,
} from "./positions";
import { GLYPH_SIZES } from "./glyphs";
import {
  createMaterialStar,
  createActivityStar,
  createPrincipleStar,
} from "./glyphShapes";

interface DetailDotProps {
  id: string;
  nodeType: "principle" | "activity" | "material";
  label: string;
  position: [number, number, number];
  origin: [number, number, number];
  delay: number;
  showLabel?: boolean;
  emphasized?: boolean;
  previewOnly?: boolean;
  interactive?: boolean;
  dimmed?: boolean;
}

function DetailDot({
  id,
  nodeType,
  label,
  position,
  origin,
  delay,
  showLabel = true,
  emphasized = false,
  previewOnly = false,
  interactive = true,
  dimmed = false,
}: DetailDotProps) {
  const glyphRef = useRef<THREE.Group>(null);
  const hitRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const startTime = useRef<number | null>(null);
  const { focusedNode, setFocusedNode } = useExploreState();
  const materialShape = useMemo(() => createMaterialStar(), []);
  const activityShapes = useMemo(() => createActivityStar(), []);
  const principleShapes = useMemo(() => createPrincipleStar(), []);

  const color = nodeType === "principle"
    ? "#FF7C15"
    : nodeType === "activity"
      ? "#ED4672"
      : "#B44AFF";
  const isSelected = focusedNode?.type === nodeType && focusedNode.id === id;
  const targetOpacity = previewOnly ? 0.45 : dimmed ? 0.2 : (emphasized || isSelected) ? 0.94 : 0.62;
  const targetScale = previewOnly ? 0.72 : isSelected ? 1.28 : emphasized ? 1.1 : 1;

  useFrame(({ clock }) => {
    if (!glyphRef.current) return;
    if (startTime.current === null) {
      startTime.current = clock.elapsedTime;
    }
    const elapsed = clock.elapsedTime - startTime.current;
    const progress = Math.min(1, Math.max(0, (elapsed - delay) / 0.5));
    const eased = 1 - Math.pow(1 - progress, 3);
    const pulse = isSelected ? 1 + Math.sin(clock.elapsedTime * 2.5) * 0.06 : 1;
    const desired = GLYPH_SIZES.detailBase * targetScale * eased * pulse;
    const current = glyphRef.current.scale.x || desired;
    const next = current + (desired - current) * 0.18;
    glyphRef.current.scale.set(next, next, 1);

    if (hitRef.current) {
      hitRef.current.scale.setScalar(0.2 * targetScale);
    }
  });

  return (
    <group>
      <Line
        points={[origin, position]}
        color="#d4af37"
        lineWidth={0.38}
        transparent
        opacity={previewOnly ? 0.08 : emphasized ? 0.24 : 0.14}
      />

      {interactive && (
        <mesh
          ref={hitRef}
          position={position}
          onClick={(e) => {
            e.stopPropagation();
            setFocusedNode({
              type: nodeType,
              id,
            });
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = "auto";
          }}
        >
          <circleGeometry args={[0.13, 12]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}

      <group ref={glyphRef} position={position} scale={[GLYPH_SIZES.detailBase, GLYPH_SIZES.detailBase, 1]}>
        {nodeType === "principle" && principleShapes.map((shape, i) => (
          <mesh key={i} position={[0, 0, 0.02]}>
            <shapeGeometry args={[shape]} />
            <meshBasicMaterial color={color} transparent opacity={targetOpacity} depthWrite={false} toneMapped={false} />
          </mesh>
        ))}
        {nodeType === "activity" && activityShapes.map((shape, i) => (
          <mesh key={i} position={[0, 0, 0.02]}>
            <shapeGeometry args={[shape]} />
            <meshBasicMaterial color={color} transparent opacity={targetOpacity} depthWrite={false} toneMapped={false} />
          </mesh>
        ))}
        {nodeType === "material" && (
          <mesh position={[0, 0, 0.02]}>
            <shapeGeometry args={[materialShape]} />
            <meshBasicMaterial color={color} transparent opacity={targetOpacity} depthWrite={false} toneMapped={false} />
          </mesh>
        )}
      </group>

      {(showLabel || hovered || isSelected) && !previewOnly && !dimmed && (
        <Text
          position={[position[0], position[1] - 0.1, position[2]]}
          fontSize={showLabel ? 0.072 : 0.062}
          color="#F9F6EF"
          anchorX="center"
          anchorY="top"
          fillOpacity={showLabel || isSelected ? 0.86 : 0.92}
          maxWidth={1.6}
          letterSpacing={0.038}
        >
          {label}
        </Text>
      )}
    </group>
  );
}

/** Arrange items in a semicircular arc with slight randomness */
function arcPositions(
  centerX: number,
  centerY: number,
  count: number,
  minRadius: number,
  maxRadius: number,
  startAngle: number,
  endAngle: number,
  seed: number,
): [number, number, number][] {
  const positions: [number, number, number][] = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const angle = startAngle + t * (endAngle - startAngle);
    // Pseudo-random offset based on seed and index
    const rRand =
      minRadius +
      (maxRadius - minRadius) *
        (0.4 + 0.6 * Math.abs(Math.sin(seed + i * 7.13)));
    const aRand = angle + (Math.sin(seed + i * 3.77) * 0.15);
    const x = centerX + rRand * Math.cos(aRand);
    const y = centerY + rRand * Math.sin(aRand);
    positions.push([x, y, 0]);
  }
  return positions;
}

export default function DetailNodes() {
  const { focusedNode, graphData, visibleLayers, layoutPositions } = useExploreState();
  const grouped = useMemo(() => {
    const principlesByPhil = new Map<string, typeof graphData.principles>();
    const activitiesByPhil = new Map<string, typeof graphData.activities>();
    const materialsByPhil = new Map<string, typeof graphData.materials>();

    for (const p of graphData.principles) {
      const arr = principlesByPhil.get(p.philosophyId) || [];
      arr.push(p);
      principlesByPhil.set(p.philosophyId, arr);
    }
    for (const a of graphData.activities) {
      const arr = activitiesByPhil.get(a.philosophyId) || [];
      arr.push(a);
      activitiesByPhil.set(a.philosophyId, arr);
    }
    for (const m of graphData.materials) {
      const arr = materialsByPhil.get(m.philosophyId) || [];
      arr.push(m);
      materialsByPhil.set(m.philosophyId, arr);
    }
    return { principlesByPhil, activitiesByPhil, materialsByPhil };
  }, [graphData]);

  const activePhilosophyId = useMemo(() => {
    if (!focusedNode) return null;
    if (focusedNode.type === "philosophy") return focusedNode.id;
    if (focusedNode.type === "principle" || focusedNode.type === "activity" || focusedNode.type === "material") {
      const detailNode = focusedNode.type === "principle"
        ? graphData.principles.find((p) => p.id === focusedNode.id)
        : focusedNode.type === "activity"
          ? graphData.activities.find((a) => a.id === focusedNode.id)
          : graphData.materials.find((m) => m.id === focusedNode.id);
      return detailNode?.philosophyId ?? null;
    }
    if (focusedNode.type === "curriculum") {
      const curriculumIndex = graphData.curricula.findIndex((c) => c.id === focusedNode.id);
      if (curriculumIndex < 0) return null;
      const placement = getCurriculumPlacement(
        graphData.curricula[curriculumIndex].philosophyScores,
        curriculumIndex,
      );
      return placement.topPhilosophy;
    }
    return null;
  }, [focusedNode, graphData]);

  const showGlobalPreview = activePhilosophyId === null;

  const details = useMemo(() => {
    if (!activePhilosophyId) return null;
    const philName = activePhilosophyId;
    const philosophy = graphData.philosophies.find((p) => p.name === philName);
    if (!philosophy) return null;

    // Use manual philosophy positions
    const manualPos = PHILOSOPHY_POSITIONS[philName] || [0, 0];
    const x = manualPos[0];
    const y = manualPos[1];

    const principles = grouped.principlesByPhil.get(philName) || [];
    const activities = grouped.activitiesByPhil.get(philName) || [];
    const materials = grouped.materialsByPhil.get(philName) || [];

    // Principles: use force-layout positions with arc fallback
    const principlePositions = principles.map((p, i) => {
      const lt = layoutPositions.positions.get(nodeKey("principle", p.id));
      if (lt) return [lt.x, lt.y, 0] as [number, number, number];
      return arcPositions(x, y, principles.length, 0.5, 2.0, Math.PI * 0.2, Math.PI * 0.8, 42)[i];
    });

    // Activities: use force-layout positions with arc fallback
    const activityPositions = activities.map((a, i) => {
      const lt = layoutPositions.positions.get(nodeKey("activity", a.id));
      if (lt) return [lt.x, lt.y, 0] as [number, number, number];
      return arcPositions(x, y, activities.length, 0.5, 2.0, -Math.PI * 0.8, -Math.PI * 0.2, 137)[i];
    });

    // Materials: use force-layout positions with arc fallback
    const materialPositions = materials.map((m, i) => {
      const lt = layoutPositions.positions.get(nodeKey("material", m.id));
      if (lt) return [lt.x, lt.y, 0] as [number, number, number];
      return arcPositions(x, y, materials.length, 0.5, 2.0, -Math.PI * 0.3, Math.PI * 0.3, 271)[i];
    });

    return { x, y, principles, activities, materials, principlePositions, activityPositions, materialPositions };
  }, [activePhilosophyId, graphData, grouped, layoutPositions]);

  if (showGlobalPreview) {
    return null;
  }

  if (!details) return null;

  const {
    x,
    y,
    principles,
    activities,
    materials,
    principlePositions,
    activityPositions,
    materialPositions,
  } = details;
  const totalCount = Math.max(1, principles.length + activities.length + materials.length);

  return (
    <group>
      {/* Principles - white dots above */}
      {visibleLayers.principles &&
        principles.map((p, i) => (
          (() => {
            const dimmed = focusedNode?.type === "principle" && focusedNode.id !== p.id;
            return (
          <DetailDot
            key={`p-${p.id}`}
            id={p.id}
            nodeType="principle"
            label={p.name}
            position={principlePositions[i]}
            origin={[x, y, 0]}
            delay={(i / totalCount) * 0.4}
            showLabel={true}
            emphasized={focusedNode?.type === "curriculum" || i < 5}
            dimmed={dimmed}
          />
            );
          })()
        ))}

      {/* Activities - amber dots below */}
      {visibleLayers.activities &&
        activities.map((a, i) => (
          (() => {
            const dimmed = focusedNode?.type === "activity" && focusedNode.id !== a.id;
            return (
          <DetailDot
            key={`a-${a.id}`}
            id={a.id}
            nodeType="activity"
            label={a.name}
            position={activityPositions[i]}
            origin={[x, y, 0]}
            delay={((principles.length + i) / totalCount) * 0.4}
            showLabel={true}
            emphasized={focusedNode?.type === "curriculum" || i < 4}
            dimmed={dimmed}
          />
            );
          })()
        ))}

      {/* Materials - blue dots to the right */}
      {visibleLayers.materials &&
        materials.map((m, i) => (
          (() => {
            const dimmed = focusedNode?.type === "material" && focusedNode.id !== m.id;
            return (
          <DetailDot
            key={`m-${m.id}`}
            id={m.id}
            nodeType="material"
            label={m.name}
            position={materialPositions[i]}
            origin={[x, y, 0]}
            delay={
              ((principles.length + activities.length + i) / totalCount) * 0.4
            }
            showLabel={true}
            emphasized={focusedNode?.type === "curriculum" || i < 4}
            dimmed={dimmed}
          />
            );
          })()
        ))}
    </group>
  );
}
