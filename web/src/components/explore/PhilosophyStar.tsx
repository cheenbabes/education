"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, Text } from "@react-three/drei";
import * as THREE from "three";
import { PhilosophyNode } from "./types";
import { useExploreState } from "./useExploreState";
import { nodeKey } from "./useForceLayout";
import {
  PHILOSOPHY_POSITIONS,
  PHILOSOPHY_DISPLAY_NAMES,
  normalizePhilosophyKey,
} from "./positions";
import { GLYPH_SIZES } from "./glyphs";
import { CONSTELLATION_VECTORS } from "./constellationVectors";

/** Create a 4-pointed sparkle star shape */
function createSparkleShape(outerRadius: number, points: number, innerRatio: number): THREE.Shape {
  const shape = new THREE.Shape();
  const innerRadius = outerRadius * innerRatio;
  const totalPoints = points * 2;
  for (let i = 0; i <= totalPoints; i++) {
    const angle = (i / totalPoints) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  return shape;
}

interface PhilosophyStarProps {
  philosophy: PhilosophyNode;
  index: number;
}

export default function PhilosophyStar({
  philosophy,
  index,
}: PhilosophyStarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const constellationRef = useRef<THREE.Group>(null);
  const focusRingRef = useRef<THREE.Mesh>(null);
  const archetypeGlowRef = useRef<THREE.Mesh>(null);
  const labelShadowRef = useRef<THREE.Mesh>(null);
  const labelMainRef = useRef<THREE.Mesh>(null);
  const hitRef = useRef<THREE.Mesh>(null);
  const { focusedNode, setFocusedNode, searchTerm, graphData, layoutPositions, archetypePhilosophyIds } = useExploreState();

  // 0 = no match, 1 = primary archetype philosophy, 2 = secondary
  const archetypeMatchRank = archetypePhilosophyIds.indexOf(philosophy.name) + 1; // 0 if not found
  const isArchetypeMatch = archetypeMatchRank > 0;

  const isFocused =
    focusedNode?.type === "philosophy" && focusedNode.id === philosophy.name;
  const isConnectedToFocusedCurriculum = useMemo(() => {
    if (focusedNode?.type !== "curriculum") return false;
    // Try placement model first, then fall back to old curricula
    const curriculum =
      graphData.curricula.find((c) => c.id === focusedNode.curriculumId) ||
      graphData.curricula.find((c) => c.id === focusedNode.id);
    if (!curriculum) return false;
    const topConnected = Object.entries(curriculum.philosophyScores)
      .map(([key, score]) => ({
        key: normalizePhilosophyKey(key),
        score: Number(score),
      }))
      .filter((entry) => Number.isFinite(entry.score) && entry.score >= 0.30 && PHILOSOPHY_POSITIONS[entry.key])
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.key);
    return topConnected.includes(philosophy.name);
  }, [focusedNode, graphData.curricula, philosophy.name]);
  const isAnchorForFocusedDetail = useMemo(() => {
    if (focusedNode?.type === "principle") {
      return graphData.principles.find((p) => p.id === focusedNode.id)?.philosophyId === philosophy.name;
    }
    if (focusedNode?.type === "activity") {
      return graphData.activities.find((a) => a.id === focusedNode.id)?.philosophyId === philosophy.name;
    }
    if (focusedNode?.type === "material") {
      return graphData.materials.find((m) => m.id === focusedNode.id)?.philosophyId === philosophy.name;
    }
    return false;
  }, [focusedNode, graphData, philosophy.name]);
  const highlightedByContext = isConnectedToFocusedCurriculum || isAnchorForFocusedDetail;
  const otherFocused = focusedNode !== null && !isFocused && !highlightedByContext;

  const { position, phaseOffset, baseScale } = useMemo(() => {
    const pos = PHILOSOPHY_POSITIONS[philosophy.name] || [0, 0];
    const totalNodes =
      philosophy.principleCount +
      philosophy.activityCount +
      philosophy.materialCount;
    const phase = index * 1.37;

    return {
      position: [pos[0], pos[1], 0] as [number, number, number],
      phaseOffset: phase,
      baseScale: GLYPH_SIZES.philosophyBase + Math.log(totalNodes + 1) * 0.09,
    };
  }, [philosophy, index]);

  const layoutTarget = layoutPositions.positions.get(nodeKey("philosophy", philosophy.name));
  const targetX = layoutTarget?.x ?? position[0];
  const targetY = layoutTarget?.y ?? position[1];

  const displayName = (PHILOSOPHY_DISPLAY_NAMES[philosophy.name] ||
    philosophy.name
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")).replace(/\s+/g, " ");

  const matchesSearch = useMemo(() => {
    if (!searchTerm) return true;
    return displayName.toLowerCase().includes(searchTerm.toLowerCase());
  }, [searchTerm, displayName]);

  const targetOpacity = !matchesSearch ? 0.12 : otherFocused ? (isArchetypeMatch ? 0.75 : 0.6) : highlightedByContext ? 0.95 : 1;
  const constellationLineOpacity = !matchesSearch
    ? 0.08
    : otherFocused
      ? 0.45
      : highlightedByContext
        ? 0.96
        : 0.78;
  const constellationPointOpacity = !matchesSearch
    ? 0.12
    : otherFocused
      ? 0.5
      : highlightedByContext
        ? 1
        : 0.9;
  const labelShadowBaseOpacity = !matchesSearch ? 0.03 : otherFocused ? 0.2 : 0.34;
  const labelMainBaseOpacity = !matchesSearch ? 0.05 : otherFocused ? 0.55 : 0.9;
  const constellation = CONSTELLATION_VECTORS[philosophy.name] ?? CONSTELLATION_VECTORS.classical;
  const pointDegrees = useMemo(() => {
    const degrees = Array(constellation.points.length).fill(0) as number[];
    for (const [a, b] of constellation.segments) {
      degrees[a] += 1;
      degrees[b] += 1;
    }
    return degrees;
  }, [constellation]);

  useFrame(({ clock, camera }) => {
    if (groupRef.current) {
      groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.04;
      groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.04;
    }

    const t = clock.elapsedTime;
    const hasCurriculumFocus = focusedNode?.type === "curriculum";
    const pulseStrength = hasCurriculumFocus
      ? (isFocused ? 0.1 : isConnectedToFocusedCurriculum ? 0.18 : 0)
      : isFocused
        ? 0.1
        : highlightedByContext
          ? 0.085
          : 0.055;
    const pulseSpeed = hasCurriculumFocus
      ? (isConnectedToFocusedCurriculum ? 1.55 : 0)
      : (isConnectedToFocusedCurriculum ? 1.45 : 0.8);
    const pulse = 1 + pulseStrength * Math.sin(t * pulseSpeed + phaseOffset);
    const focusScale = isFocused ? 1.18 : isConnectedToFocusedCurriculum ? 1.2 : highlightedByContext ? 1.08 : 1;
    const zoom = (camera as THREE.OrthographicCamera).zoom;
    const zoomT = THREE.MathUtils.clamp((zoom - 35) / 75, 0, 1);

    if (constellationRef.current) {
      const target = baseScale * 0.64 * pulse * focusScale;
      const current = constellationRef.current.scale.x;
      const next = current + (target - current) * 0.12;
      constellationRef.current.scale.set(next, next, 1);
    }
    // Archetype glow — soft warm pulse, independent of focus state
    if (archetypeGlowRef.current && isArchetypeMatch) {
      const mat = archetypeGlowRef.current.material as THREE.MeshBasicMaterial;
      const baseOpacity = archetypeMatchRank === 1 ? 0.22 : 0.13;
      const pulseAmt = archetypeMatchRank === 1 ? 0.1 : 0.06;
      const speed = archetypeMatchRank === 1 ? 1.1 : 0.85;
      const target = baseOpacity + pulseAmt * Math.sin(t * speed + phaseOffset);
      mat.opacity += (target - mat.opacity) * 0.06;
      const scaleTarget = 1 + (archetypeMatchRank === 1 ? 0.06 : 0.04) * Math.sin(t * speed * 0.7 + phaseOffset);
      archetypeGlowRef.current.scale.setScalar(scaleTarget);
    }

    if (focusRingRef.current) {
      const mat = focusRingRef.current.material as THREE.MeshBasicMaterial;
      const goal = isFocused ? 0.72 + Math.sin(t * 1.8 + phaseOffset) * 0.09 : 0;
      const curriculumGoal = hasCurriculumFocus && isConnectedToFocusedCurriculum
        ? 0.34 + Math.sin(t * 2.4 + phaseOffset) * 0.1
        : 0;
      const resolvedGoal = isFocused ? goal : curriculumGoal;
      mat.opacity += (resolvedGoal - mat.opacity) * 0.12;
    }
    if (labelShadowRef.current) {
      const mat = labelShadowRef.current.material as THREE.Material & { opacity?: number; transparent?: boolean };
      const target = labelShadowBaseOpacity * THREE.MathUtils.lerp(0.55, 1, zoomT);
      if (typeof mat.opacity === "number") {
        mat.transparent = true;
        mat.opacity += (target - mat.opacity) * 0.14;
      }
    }
    if (labelMainRef.current) {
      const mat = labelMainRef.current.material as THREE.Material & { opacity?: number; transparent?: boolean };
      const target = labelMainBaseOpacity * THREE.MathUtils.lerp(0.55, 1, zoomT);
      if (typeof mat.opacity === "number") {
        mat.transparent = true;
        mat.opacity += (target - mat.opacity) * 0.14;
      }
    }
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setFocusedNode(isFocused ? null : { type: "philosophy", id: philosophy.name });
  };

  return (
    <group ref={groupRef}>
      {/* Invisible hit target for reliable hover/click without giant visual node. */}
      <mesh
        ref={hitRef}
        position={[0, 0, 0.02]}
        onClick={handleClick}
        onPointerOver={() => { document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { document.body.style.cursor = "auto"; }}
      >
        <circleGeometry args={[Math.max(0.4, baseScale * 0.3), 24]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <mesh position={[0, 0, 0.028]}>
        <circleGeometry args={[baseScale * 0.57, 48]} />
        <meshBasicMaterial
          color={highlightedByContext || isFocused ? "#F9F6EF" : "#F9F6EF"}
          transparent
          opacity={targetOpacity * (highlightedByContext ? 0.26 : 0.14)}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Archetype glow — warm gold halo for user's matched philosophies */}
      {isArchetypeMatch && (
        <mesh ref={archetypeGlowRef} position={[0, 0, 0.01]}>
          <circleGeometry args={[baseScale * (archetypeMatchRank === 1 ? 0.95 : 0.78), 48]} />
          <meshBasicMaterial
            color={archetypeMatchRank === 1 ? "#6B3FA8" : "#B8A8D8"}
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}

      <mesh ref={focusRingRef} position={[0, 0, 0.032]}>
        <ringGeometry args={[baseScale * 0.52, baseScale * 0.58, 64]} />
        <meshBasicMaterial
          color="#F9F6EF"
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <group ref={constellationRef} position={[0, 0, 0.04]} scale={[baseScale * 0.64, baseScale * 0.64, 1]}>
        {constellation.segments.map(([a, b], segmentIndex) => {
          const p1 = constellation.points[a];
          const p2 = constellation.points[b];
          return (
            <Line
              key={`segment-${segmentIndex}`}
              points={[[p1[0], p1[1], 0], [p2[0], p2[1], 0]]}
              color={highlightedByContext || isFocused ? "#F9F6EF" : "#F9F6EF"}
              lineWidth={1.3}
              transparent
              opacity={constellationLineOpacity}
              depthWrite={false}
              toneMapped={false}
            />
          );
        })}
        {constellation.points.map((point, pointIndex) => {
          const degree = pointDegrees[pointIndex] ?? 1;
          const size = degree >= 3 ? 0.07 : degree === 2 ? 0.055 : 0.04;
          return (
            <group key={`star-${pointIndex}`} position={[point[0], point[1], 0.01]}>
              {/* 4-pointed sparkle — primary rays */}
              <mesh>
                <shapeGeometry args={[createSparkleShape(size, 4, 0.25)]} />
                <meshBasicMaterial
                  color="#F9F6EF"
                  transparent
                  opacity={constellationPointOpacity}
                  depthWrite={false}
                  toneMapped={false}
                />
              </mesh>
              {/* Secondary diagonal rays (smaller, dimmer) */}
              <mesh rotation={[0, 0, Math.PI / 4]}>
                <shapeGeometry args={[createSparkleShape(size * 0.6, 4, 0.2)]} />
                <meshBasicMaterial
                  color="#F9F6EF"
                  transparent
                  opacity={constellationPointOpacity * 0.5}
                  depthWrite={false}
                  toneMapped={false}
                />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* Engraved cartographic label with subtle dark underprint. */}
      <Text
        ref={labelShadowRef}
        position={[0.02, -(baseScale * 0.62 + 0.55), -0.01]}
        fontSize={0.365}
        color="#1a140e"
        anchorX="center"
        anchorY="top"
        fillOpacity={labelShadowBaseOpacity}
        letterSpacing={0.06}
        maxWidth={5.8}
        font="/fonts/im-fell-english-sc.woff"
      >
        {displayName}
      </Text>

      <Text
        ref={labelMainRef}
        position={[0, -(baseScale * 0.62 + 0.54), 0]}
        fontSize={0.365}
        color="#f0d8a1"
        anchorX="center"
        anchorY="top"
        fillOpacity={labelMainBaseOpacity}
        letterSpacing={0.06}
        outlineWidth={0.014}
        outlineColor="#2a2016"
        maxWidth={5.8}
        font="/fonts/im-fell-english-sc.woff"
      >
        {displayName}
      </Text>
    </group>
  );
}
