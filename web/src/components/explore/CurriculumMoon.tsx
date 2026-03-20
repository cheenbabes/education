"use client";

import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { createCurriculumSun } from "./glyphShapes";
import { CurriculumPlacement } from "./types";
import { useExploreState } from "./useExploreState";
import { normalizePhilosophyKey } from "./positions";
import { GLYPH_SIZES } from "./glyphs";

interface CurriculumMoonProps {
  placement: CurriculumPlacement;
  position: [number, number];
}

export default function CurriculumMoon({
  placement,
  position: orbitalPos,
}: CurriculumMoonProps) {
  const nodeRef = useRef<THREE.Group>(null);
  const glyphRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const { focusedNode, setFocusedNode, searchTerm, graphData } = useExploreState();

  const targetPos: [number, number, number] = [orbitalPos[0], orbitalPos[1], 0];

  // Build connected philosophies list from the placement's scores
  const connectedPhilosophies = useMemo(() => {
    const connected: string[] = [];
    for (const [rawKey, rawValue] of Object.entries(placement.philosophyScores || {})) {
      const score = Number(rawValue);
      if (!Number.isFinite(score) || score <= 0) continue;
      connected.push(normalizePhilosophyKey(rawKey));
    }
    return connected;
  }, [placement.philosophyScores]);

  const color = useMemo(() => new THREE.Color("#FFB400"), []);

  const isCurriculumFocused =
    focusedNode?.type === "curriculum" && focusedNode.id === placement.placementId;
  // Also highlight if a sibling placement (same curriculumId) is focused
  const isSiblingFocused =
    focusedNode?.type === "curriculum" &&
    focusedNode.curriculumId === placement.curriculumId &&
    focusedNode.id !== placement.placementId;

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
  const shouldHighlight = isCurriculumFocused || isSiblingFocused || isConnectedToFocused;
  const shouldFade = someNodeFocused && !shouldHighlight;

  // Search match
  const matchesSearch = useMemo(() => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      placement.name.toLowerCase().includes(term) ||
      placement.publisher.toLowerCase().includes(term)
    );
  }, [searchTerm, placement.name, placement.publisher]);

  // Show label when: hovered, OR connected to focused philosophy, OR search match, OR in focused cluster
  const isInFocusedCluster = focusedNode !== null && (isCurriculumFocused || isSiblingFocused || isConnectedToFocused);
  const showLabel = hovered || shouldHighlight || (!!searchTerm && matchesSearch) || isInFocusedCluster;

  // Target opacity
  const targetOpacity = !matchesSearch ? 0.1 : shouldFade ? 0.55 : isCurriculumFocused ? 0.98 : 0.9;
  // Target scale: grow slightly when connected to focused
  const targetScale = isCurriculumFocused ? 1.55 : shouldHighlight ? 1.35 : 1;
  const haloOpacity = !matchesSearch ? 0.06 : shouldFade ? 0.16 : isCurriculumFocused ? 0.3 : 0.2;

  const sunShapes = useMemo(() => createCurriculumSun(), []);

  // Phase offset for orbit drift — use a hash of placementId for determinism
  const phaseOffset = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < placement.placementId.length; i++) {
      hash = (hash * 31 + placement.placementId.charCodeAt(i)) | 0;
    }
    return Math.abs(hash % 628) / 100;
  }, [placement.placementId]);

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
          setFocusedNode({
            type: "curriculum",
            id: placement.placementId,
            curriculumId: placement.curriculumId,
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
        <circleGeometry args={[0.25, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Name label on hover or when connected to focused philosophy */}
      {showLabel && (
        <Text
          position={[0, -0.28, 0]}
          fontSize={0.16}
          color="#FFB400"
          anchorX="center"
          anchorY="top"
          fillOpacity={shouldFade ? 0.56 : 0.93}
          letterSpacing={0.03}
          outlineWidth={0.08}
          outlineColor="#1d1710"
          maxWidth={14}
          font="/fonts/CormorantSC-SemiBold.ttf"
        >
          {placement.name}
        </Text>
      )}
    </group>
  );
}
