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
  const color = nodeType === "principle"
    ? "#f6e9c8"
    : nodeType === "activity"
      ? "#f0b15f"
      : "#8ab8ee";
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
        {nodeType === "principle" && (
          <>
            {/* Sun circle */}
            <mesh position={[0, 0, 0.02]}>
              <circleGeometry args={[0.1, 24]} />
              <meshBasicMaterial color={color} transparent opacity={targetOpacity} depthWrite={false} toneMapped={false} />
            </mesh>
            {/* 8 rays */}
            {Array.from({ length: 8 }, (_, i) => {
              const angle = (i / 8) * Math.PI * 2;
              const inner: [number, number, number] = [Math.cos(angle) * 0.13, Math.sin(angle) * 0.13, 0.03];
              const outer: [number, number, number] = [Math.cos(angle) * 0.22, Math.sin(angle) * 0.22, 0.03];
              return (
                <Line key={`ray-${i}`} points={[inner, outer]} color={color} lineWidth={0.8}
                  transparent opacity={targetOpacity * 0.85} depthWrite={false} toneMapped={false} />
              );
            })}
          </>
        )}
        {nodeType === "activity" && (
          <>
            {/* Vertical line */}
            <Line points={[[0, -0.2, 0.03], [0, 0.2, 0.03]]} color={color} lineWidth={0.9}
              transparent opacity={targetOpacity} depthWrite={false} toneMapped={false} />
            {/* Horizontal line */}
            <Line points={[[-0.2, 0, 0.03], [0.2, 0, 0.03]]} color={color} lineWidth={0.9}
              transparent opacity={targetOpacity} depthWrite={false} toneMapped={false} />
            {/* Arrow tips */}
            <Line points={[[-0.06, 0.16, 0.03], [0, 0.22, 0.03], [0.06, 0.16, 0.03]]} color={color} lineWidth={0.7}
              transparent opacity={targetOpacity * 0.8} depthWrite={false} toneMapped={false} />
            <Line points={[[-0.06, -0.16, 0.03], [0, -0.22, 0.03], [0.06, -0.16, 0.03]]} color={color} lineWidth={0.7}
              transparent opacity={targetOpacity * 0.8} depthWrite={false} toneMapped={false} />
            <Line points={[[0.16, -0.06, 0.03], [0.22, 0, 0.03], [0.16, 0.06, 0.03]]} color={color} lineWidth={0.7}
              transparent opacity={targetOpacity * 0.8} depthWrite={false} toneMapped={false} />
            <Line points={[[-0.16, -0.06, 0.03], [-0.22, 0, 0.03], [-0.16, 0.06, 0.03]]} color={color} lineWidth={0.7}
              transparent opacity={targetOpacity * 0.8} depthWrite={false} toneMapped={false} />
          </>
        )}
        {nodeType === "material" && (
          <>
            {/* Circle */}
            <Line
              points={Array.from({ length: 33 }, (_, i) => {
                const t = (i / 32) * Math.PI * 2;
                return [Math.cos(t) * 0.18, Math.sin(t) * 0.18, 0.03] as [number, number, number];
              })}
              color={color} lineWidth={0.9} transparent opacity={targetOpacity} depthWrite={false} toneMapped={false}
            />
            {/* Vertical cross line */}
            <Line points={[[0, -0.18, 0.03], [0, 0.18, 0.03]]} color={color} lineWidth={0.7}
              transparent opacity={targetOpacity * 0.8} depthWrite={false} toneMapped={false} />
            {/* Horizontal cross line */}
            <Line points={[[-0.18, 0, 0.03], [0.18, 0, 0.03]]} color={color} lineWidth={0.7}
              transparent opacity={targetOpacity * 0.8} depthWrite={false} toneMapped={false} />
          </>
        )}
      </group>

      {(showLabel || hovered || isSelected) && !previewOnly && !dimmed && (
        <Text
          position={[position[0], position[1] - 0.1, position[2]]}
          fontSize={showLabel ? 0.072 : 0.062}
          color="#d8c18a"
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

  const preview = useMemo(() => {
    if (!showGlobalPreview) return [];
    const dots: Array<{
      key: string;
      id: string;
      nodeType: "principle" | "activity" | "material";
      label: string;
      position: [number, number, number];
    }> = [];

    for (let index = 0; index < graphData.philosophies.length; index += 1) {
      const philosophy = graphData.philosophies[index];
      const center = PHILOSOPHY_POSITIONS[philosophy.name];
      if (!center) continue;
      const [x, y] = center;
      const principles = grouped.principlesByPhil.get(philosophy.name) || [];
      const activities = grouped.activitiesByPhil.get(philosophy.name) || [];
      const materials = grouped.materialsByPhil.get(philosophy.name) || [];

      if (visibleLayers.principles && principles.length) {
        const count = Math.min(12, principles.length);
        const positions = arcPositions(x, y, count, 2.3, 3.7, Math.PI * 0.22, Math.PI * 0.78, 41 + index);
        for (let i = 0; i < count; i += 1) {
          dots.push({
            key: `gp-${principles[i].id}`,
            id: principles[i].id,
            nodeType: "principle",
            label: principles[i].name,
            position: positions[i],
          });
        }
      }
      if (visibleLayers.activities && activities.length) {
        const count = Math.min(12, activities.length);
        const positions = arcPositions(x, y, count, 2.3, 3.7, -Math.PI * 0.78, -Math.PI * 0.22, 131 + index);
        for (let i = 0; i < count; i += 1) {
          dots.push({
            key: `ga-${activities[i].id}`,
            id: activities[i].id,
            nodeType: "activity",
            label: activities[i].name,
            position: positions[i],
          });
        }
      }
      if (visibleLayers.materials && materials.length) {
        const count = Math.min(12, materials.length);
        const positions = arcPositions(x, y, count, 2.3, 3.7, -Math.PI * 0.26, Math.PI * 0.26, 271 + index);
        for (let i = 0; i < count; i += 1) {
          dots.push({
            key: `gm-${materials[i].id}`,
            id: materials[i].id,
            nodeType: "material",
            label: materials[i].name,
            position: positions[i],
          });
        }
      }
    }
    return dots;
  }, [showGlobalPreview, graphData.philosophies, grouped, visibleLayers]);

  if (showGlobalPreview) {
    return (
      <group>
        {preview.map((dot) => (
          <DetailDot
            key={dot.key}
            id={dot.id}
            nodeType={dot.nodeType}
            label={dot.label}
            position={dot.position}
            origin={[dot.position[0], dot.position[1], dot.position[2]]}
            delay={0}
            showLabel={false}
            previewOnly
            interactive
          />
        ))}
      </group>
    );
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
