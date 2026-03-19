"use client";

import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { CurriculumNode } from "./types";
import { useExploreState } from "./useExploreState";

const PHILOSOPHY_DIMENSIONS: Record<
  string,
  { structure: number; modality: number }
> = {
  classical: { structure: 85, modality: 80 },
  charlotte_mason: { structure: 60, modality: 55 },
  "charlotte-mason": { structure: 60, modality: 55 },
  waldorf: { structure: 45, modality: 25 },
  "waldorf-adjacent": { structure: 45, modality: 25 },
  montessori: { structure: 35, modality: 30 },
  "montessori-inspired": { structure: 35, modality: 30 },
  project_based: { structure: 40, modality: 35 },
  "project-based-learning": { structure: 40, modality: 35 },
  place_nature: { structure: 30, modality: 15 },
  "place-nature-based": { structure: 30, modality: 15 },
  unschooling: { structure: 10, modality: 20 },
  eclectic_flexible: { structure: 50, modality: 50 },
  flexible: { structure: 50, modality: 50 },
};

const PHILOSOPHY_COLORS: Record<string, string> = {
  "montessori-inspired": "#8B5CF6",
  montessori: "#8B5CF6",
  "waldorf-adjacent": "#F59E0B",
  waldorf: "#F59E0B",
  "project-based-learning": "#3B82F6",
  project_based: "#3B82F6",
  "place-nature-based": "#10B981",
  place_nature: "#10B981",
  classical: "#6366F1",
  "charlotte-mason": "#EC4899",
  charlotte_mason: "#EC4899",
  unschooling: "#F97316",
  flexible: "#6B7280",
  eclectic_flexible: "#6B7280",
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

interface CurriculumMoonProps {
  curriculum: CurriculumNode;
  index: number;
}

export default function CurriculumMoon({
  curriculum,
  index,
}: CurriculumMoonProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const { focusedNode, setFocusedNode } = useExploreState();

  const { position, color, connectedPhilosophies } = useMemo(() => {
    const scores = curriculum.philosophyScores;
    let weightedStructure = 0;
    let weightedModality = 0;
    let totalWeight = 0;
    let maxScore = 0;
    let topPhil = "";
    const connected: string[] = [];

    for (const [phil, score] of Object.entries(scores)) {
      const dims = PHILOSOPHY_DIMENSIONS[phil];
      if (!dims || score <= 0) continue;
      weightedStructure += score * dims.structure;
      weightedModality += score * dims.modality;
      totalWeight += score;
      connected.push(normalizePhilKey(phil));
      if (score > maxScore) {
        maxScore = score;
        topPhil = phil;
      }
    }

    if (totalWeight === 0) {
      return {
        position: [0, 0, 0] as [number, number, number],
        color: new THREE.Color("#c0c0d0"),
        connectedPhilosophies: [] as string[],
      };
    }

    const avgStructure = weightedStructure / totalWeight;
    const avgModality = weightedModality / totalWeight;

    const x = (avgStructure / 100) * 12 - 6;
    const y = (avgModality / 100) * -8 + 4;

    // Color: silver-white base blended 20% with top philosophy color
    const base = new THREE.Color("#c0c0d0");
    const philColor = new THREE.Color(
      PHILOSOPHY_COLORS[topPhil] || "#c0c0d0",
    );
    base.lerp(philColor, 0.2);

    return {
      position: [x, y, 0] as [number, number, number],
      color: base,
      connectedPhilosophies: Array.from(new Set(connected)),
    };
  }, [curriculum]);

  // Determine focus-related state
  const isConnectedToFocused =
    focusedNode?.type === "philosophy" &&
    connectedPhilosophies.includes(focusedNode.id);
  const someNodeFocused = focusedNode !== null;
  const shouldFade = someNodeFocused && !isConnectedToFocused;
  const shouldHighlight = isConnectedToFocused;

  // Show label when: hovered, OR connected to focused philosophy
  const showLabel = hovered || shouldHighlight;

  // Target opacity
  const targetOpacity = shouldFade ? 0.1 : 0.8;
  // Target scale: grow slightly when connected to focused
  const targetScale = shouldHighlight ? 1.4 : 1;

  // Phase offset for orbit drift
  const phaseOffset = useMemo(() => index * 2.17, [index]);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Subtle slow orbit drift
      const t = clock.elapsedTime;
      meshRef.current.position.x =
        position[0] + Math.sin(t * 0.3 + phaseOffset) * 0.05;
      meshRef.current.position.y =
        position[1] + Math.cos(t * 0.25 + phaseOffset * 1.3) * 0.05;

      // Lerp opacity
      const mat = meshRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity += (targetOpacity - mat.opacity) * 0.08;

      // Lerp scale
      const s = meshRef.current.scale.x;
      const newScale = s + (targetScale - s) * 0.08;
      meshRef.current.scale.setScalar(newScale);
    }
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        position={position}
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
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>

      {/* Name label on hover or when connected to focused philosophy */}
      {showLabel && (
        <Text
          position={[position[0], position[1] - 0.12, 0]}
          fontSize={0.08}
          color="white"
          anchorX="center"
          anchorY="top"
          fillOpacity={0.9}
        >
          {curriculum.name}
        </Text>
      )}
    </group>
  );
}
