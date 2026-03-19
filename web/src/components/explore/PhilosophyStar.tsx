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
import {
  GLYPH_SIZES,
  getPhilosophyPlanetSign,
} from "./glyphs";
import { CONSTELLATION_VECTORS } from "./constellationVectors";

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
  const planetGroupRef = useRef<THREE.Group>(null);
  const planetBadgeRef = useRef<THREE.Mesh>(null);
  const planetTextRef = useRef<THREE.Mesh>(null);
  const labelShadowRef = useRef<THREE.Mesh>(null);
  const labelMainRef = useRef<THREE.Mesh>(null);
  const hitRef = useRef<THREE.Mesh>(null);
  const { focusedNode, setFocusedNode, searchTerm, graphData, layoutPositions } = useExploreState();

  const isFocused =
    focusedNode?.type === "philosophy" && focusedNode.id === philosophy.name;
  const isConnectedToFocusedCurriculum = useMemo(() => {
    if (focusedNode?.type !== "curriculum") return false;
    const curriculum = graphData.curricula.find((c) => c.id === focusedNode.id);
    if (!curriculum) return false;
    // Keep pulse eligibility exactly in sync with ConnectionLines curriculum mode:
    // top 4 weighted philosophies above threshold and with known positions.
    const topConnected = Object.entries(curriculum.philosophyScores)
      .map(([key, score]) => ({
        key: normalizePhilosophyKey(key),
        score: Number(score),
      }))
      .filter((entry) => Number.isFinite(entry.score) && entry.score > 0.08 && PHILOSOPHY_POSITIONS[entry.key])
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
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
  const planetSign = getPhilosophyPlanetSign(philosophy.name);

  const matchesSearch = useMemo(() => {
    if (!searchTerm) return true;
    return displayName.toLowerCase().includes(searchTerm.toLowerCase());
  }, [searchTerm, displayName]);

  const targetOpacity = !matchesSearch ? 0.12 : otherFocused ? 0.6 : highlightedByContext ? 0.95 : 1;
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
  const planetBaseOpacity = !matchesSearch ? 0.05 : otherFocused ? 0.5 : 0.94;
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
      groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.02;
      groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.02;
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
    if (focusRingRef.current) {
      const mat = focusRingRef.current.material as THREE.MeshBasicMaterial;
      const goal = isFocused ? 0.72 + Math.sin(t * 1.8 + phaseOffset) * 0.09 : 0;
      const curriculumGoal = hasCurriculumFocus && isConnectedToFocusedCurriculum
        ? 0.34 + Math.sin(t * 2.4 + phaseOffset) * 0.1
        : 0;
      const resolvedGoal = isFocused ? goal : curriculumGoal;
      mat.opacity += (resolvedGoal - mat.opacity) * 0.12;
    }
    if (planetGroupRef.current) {
      const signScale = THREE.MathUtils.lerp(0.78, 1.08, zoomT) * (isFocused ? 1.08 : 1);
      const curr = planetGroupRef.current.scale.x;
      const next = curr + (signScale - curr) * 0.14;
      planetGroupRef.current.scale.set(next, next, 1);
    }
    if (planetBadgeRef.current) {
      const mat = planetBadgeRef.current.material as THREE.MeshBasicMaterial;
      const target = THREE.MathUtils.lerp(0.22, 0.36, zoomT) * (isFocused ? 1.15 : 1);
      mat.opacity += (target - mat.opacity) * 0.12;
    }
    if (planetTextRef.current) {
      const mat = planetTextRef.current.material as THREE.Material & { opacity?: number; transparent?: boolean };
      const target = planetBaseOpacity * THREE.MathUtils.lerp(0.5, 1, zoomT);
      if (typeof mat.opacity === "number") {
        mat.transparent = true;
        mat.opacity += (target - mat.opacity) * 0.14;
      }
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
    <group ref={groupRef} position={[targetX, targetY, 0]}>
      {/* Invisible hit target for reliable hover/click without giant visual node. */}
      <mesh
        ref={hitRef}
        position={[0, 0, 0.02]}
        onClick={handleClick}
        onPointerOver={() => { document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { document.body.style.cursor = "auto"; }}
      >
        <circleGeometry args={[Math.max(0.78, baseScale * 0.56), 24]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <mesh position={[0, 0, 0.028]}>
        <circleGeometry args={[baseScale * 0.57, 48]} />
        <meshBasicMaterial
          color={highlightedByContext || isFocused ? "#bea263" : "#b08d57"}
          transparent
          opacity={targetOpacity * (highlightedByContext ? 0.26 : 0.14)}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <mesh ref={focusRingRef} position={[0, 0, 0.032]}>
        <ringGeometry args={[baseScale * 0.52, baseScale * 0.58, 64]} />
        <meshBasicMaterial
          color="#efd9a4"
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
              color={highlightedByContext || isFocused ? "#f5deaa" : "#e5c88d"}
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
          const radius = degree >= 3 ? 0.045 : degree === 2 ? 0.036 : 0.03;
          return (
            <mesh key={`star-${pointIndex}`} position={[point[0], point[1], 0.01]}>
              <circleGeometry args={[radius, 20]} />
              <meshBasicMaterial
                color={highlightedByContext || isFocused ? "#fff0ca" : "#f3d9a0"}
                transparent
                opacity={constellationPointOpacity}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>
          );
        })}
      </group>

      {/* Planetary sign marks each philosophy with a semantic celestial identity. */}
      <group
        ref={planetGroupRef}
        position={[baseScale * 0.46, -(baseScale * 0.43), 0.07]}
        scale={[1, 1, 1]}
      >
        <mesh ref={planetBadgeRef} position={[0, 0, -0.002]}>
          <circleGeometry args={[0.23, 24]} />
          <meshBasicMaterial
            color="#141013"
            transparent
            opacity={0.28}
            depthWrite={false}
          />
        </mesh>
        <Text
          ref={planetTextRef}
          position={[0, 0, 0]}
          fontSize={0.32}
          color="#f7e7bf"
          anchorX="center"
          anchorY="middle"
          fillOpacity={planetBaseOpacity}
          outlineWidth={0.014}
          outlineColor="#241a12"
          font="/fonts/STIXTwoText.ttf"
        >
          {planetSign}
        </Text>
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
