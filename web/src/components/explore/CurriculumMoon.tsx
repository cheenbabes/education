"use client";

import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { createCurriculumSun } from "./glyphShapes";
import { CurriculumNode } from "./types";
import { useExploreState } from "./useExploreState";
import { getCurriculumPlacement } from "./positions";
import { GLYPH_SIZES } from "./glyphs";
import { nodeKey } from "./useForceLayout";

const PHILOSOPHY_COLORS: Record<string, string> = {
  "montessori-inspired": "#8B5CF6",
  "waldorf-adjacent": "#F59E0B",
  "project-based-learning": "#3B82F6",
  "place-nature-based": "#10B981",
  classical: "#6366F1",
  "charlotte-mason": "#EC4899",
  unschooling: "#F97316",
  flexible: "#6B7280",
};

interface CurriculumMoonProps {
  curriculum: CurriculumNode;
  index: number;
}

export default function CurriculumMoon({
  curriculum,
  index,
}: CurriculumMoonProps) {
  const nodeRef = useRef<THREE.Group>(null);
  const glyphRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const { focusedNode, setFocusedNode, searchTerm, graphData, layoutPositions } = useExploreState();
  const placement = useMemo(
    () => getCurriculumPlacement(curriculum.philosophyScores, index),
    [curriculum.philosophyScores, index],
  );

  const layoutTarget = layoutPositions.positions.get(nodeKey("curriculum", curriculum.id));
  const targetPos: [number, number, number] = layoutTarget
    ? [layoutTarget.x, layoutTarget.y, 0]
    : placement.position;

  const { color, connectedPhilosophies } = useMemo(() => {
    // Color: warm ivory blended slightly with top philosophy accent.
    const base = new THREE.Color("#e7d8b5");
    const philColor = new THREE.Color(
      PHILOSOPHY_COLORS[placement.topPhilosophy || ""] || "#c0c0d0",
    );
    base.lerp(philColor, 0.16);

    return {
      color: base,
      connectedPhilosophies: placement.connectedPhilosophies,
    };
  }, [placement]);

  const isCurriculumFocused = focusedNode?.type === "curriculum" && focusedNode.id === curriculum.id;
  const detailFocusPhilosophy = useMemo(() => {
    if (focusedNode?.type === "principle") {
      return graphData.principles.find((p) => p.id === focusedNode.id)?.philosophyId ?? null;
    }
    if (focusedNode?.type === "activity") {
      return graphData.activities.find((a) => a.id === focusedNode.id)?.philosophyId ?? null;
    }
    if (focusedNode?.type === "material") {
      return graphData.materials.find((m) => m.id === focusedNode.id)?.philosophyId ?? null;
    }
    return null;
  }, [focusedNode, graphData]);

  const isConnectedToFocused =
    (focusedNode?.type === "philosophy" && connectedPhilosophies.includes(focusedNode.id)) ||
    (!!detailFocusPhilosophy && connectedPhilosophies.includes(detailFocusPhilosophy));
  const someNodeFocused = focusedNode !== null;
  const shouldHighlight = isCurriculumFocused || isConnectedToFocused;
  const shouldFade = someNodeFocused && !shouldHighlight;

  // Search match
  const matchesSearch = useMemo(() => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      curriculum.name.toLowerCase().includes(term) ||
      curriculum.publisher.toLowerCase().includes(term)
    );
  }, [searchTerm, curriculum.name, curriculum.publisher]);

  // Show label when: hovered, OR connected to focused philosophy, OR search match, OR in focused cluster
  const isInFocusedCluster = focusedNode !== null && (isCurriculumFocused || isConnectedToFocused);
  const showLabel = hovered || shouldHighlight || (!!searchTerm && matchesSearch) || isInFocusedCluster;

  // Target opacity
  const targetOpacity = !matchesSearch ? 0.1 : shouldFade ? 0.55 : isCurriculumFocused ? 0.98 : 0.9;
  // Target scale: grow slightly when connected to focused
  const targetScale = isCurriculumFocused ? 1.55 : shouldHighlight ? 1.35 : 1;
  const haloOpacity = !matchesSearch ? 0.06 : shouldFade ? 0.16 : isCurriculumFocused ? 0.3 : 0.2;

  const sunShapes = useMemo(() => createCurriculumSun(), []);

  // Phase offset for orbit drift
  const phaseOffset = useMemo(() => index * 2.17, [index]);

  useFrame(({ clock }) => {
    if (nodeRef.current) {
      const t = clock.elapsedTime;
      const tx = targetPos[0] + Math.sin(t * 0.3 + phaseOffset) * 0.035;
      const ty = targetPos[1] + Math.cos(t * 0.25 + phaseOffset * 1.3) * 0.035;
      nodeRef.current.position.x += (tx - nodeRef.current.position.x) * 0.02;
      nodeRef.current.position.y += (ty - nodeRef.current.position.y) * 0.02;
    }
    if (glyphRef.current) {
      const target = GLYPH_SIZES.curriculumBase * targetScale;
      const current = glyphRef.current.scale.x;
      const next = current + (target - current) * 0.08;
      glyphRef.current.scale.set(next, next, 1);
    }
  });

  return (
    <group ref={nodeRef}>
      <group ref={glyphRef} scale={[GLYPH_SIZES.curriculumBase, GLYPH_SIZES.curriculumBase, 1]}>
        {/* Outer glow halo */}
        <mesh position={[0, 0, 0.01]}>
          <circleGeometry args={[1.6, 40]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={haloOpacity}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        {/* Sun glyph - vector shapes */}
        {sunShapes.map((shape, i) => (
          <mesh key={i} position={[0, 0, 0.02]}>
            <shapeGeometry args={[shape]} />
            <meshBasicMaterial color={color} transparent opacity={targetOpacity} depthWrite={false} toneMapped={false} />
          </mesh>
        ))}
      </group>

      <mesh
        onClick={(e) => {
          e.stopPropagation();
          setFocusedNode({ type: "curriculum", id: curriculum.id });
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
        <circleGeometry args={[0.25, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Name label on hover or when connected to focused philosophy */}
      {showLabel && (
        <Text
          position={[0, -0.28, 0]}
          fontSize={0.16}
          color="#f1dfb4"
          anchorX="center"
          anchorY="top"
          fillOpacity={shouldFade ? 0.56 : 0.93}
          letterSpacing={0.03}
          outlineWidth={0.08}
          outlineColor="#1d1710"
          maxWidth={14}
          font="/fonts/CormorantSC-SemiBold.ttf"
        >
          {curriculum.name}
        </Text>
      )}
    </group>
  );
}
