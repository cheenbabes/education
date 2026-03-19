"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { AdditiveBlending } from "three";
import * as THREE from "three";
import { PhilosophyNode } from "./types";
import { useExploreState } from "./useExploreState";
import { PHILOSOPHY_POSITIONS, PHILOSOPHY_DISPLAY_NAMES } from "./positions";

interface PhilosophyStarProps {
  philosophy: PhilosophyNode;
  index: number;
}

export default function PhilosophyStar({
  philosophy,
  index,
}: PhilosophyStarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const { focusedNode, setFocusedNode, searchTerm } = useExploreState();

  const isFocused =
    focusedNode?.type === "philosophy" && focusedNode.id === philosophy.name;
  const otherFocused = focusedNode !== null && !isFocused;

  const { position, coreRadius, glowRadius, phaseOffset, color } = useMemo(() => {
    const pos = PHILOSOPHY_POSITIONS[philosophy.name] || [0, 0];
    const totalNodes =
      philosophy.principleCount +
      philosophy.activityCount +
      philosophy.materialCount;
    // Core star: make DRAMATICALLY larger than curriculum moons (0.08)
    const core = 0.7 + Math.log(totalNodes + 1) * 0.1;
    // Glow halo: 5x core radius for dramatic glow
    const glow = core * 5;
    const phase = index * 1.37;
    const c = new THREE.Color(philosophy.color);

    return {
      position: [pos[0], pos[1], 0] as [number, number, number],
      coreRadius: core,
      glowRadius: glow,
      phaseOffset: phase,
      color: c,
    };
  }, [philosophy, index]);

  const displayName = PHILOSOPHY_DISPLAY_NAMES[philosophy.name] ||
    philosophy.name.split("-").map((w) => w.toUpperCase()).join(" ");

  const matchesSearch = useMemo(() => {
    if (!searchTerm) return true;
    return displayName.toLowerCase().includes(searchTerm.toLowerCase());
  }, [searchTerm, displayName]);

  const targetOpacity = !matchesSearch ? 0.1 : otherFocused ? 0.25 : 1;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // Gentle breathing pulse
    const pulse = 1 + 0.08 * Math.sin(t * 0.4 + phaseOffset);

    if (coreRef.current) {
      coreRef.current.scale.setScalar(pulse);
      const mat = coreRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity += (targetOpacity - mat.opacity) * 0.06;
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(pulse * 1.05);
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity += (targetOpacity * 0.3 - mat.opacity) * 0.06;
    }
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setFocusedNode(isFocused ? null : { type: "philosophy", id: philosophy.name });
  };

  return (
    <group ref={groupRef} position={position}>
      {/* Outer glow halo — AdditiveBlending for natural luminosity */}
      <mesh ref={glowRef}>
        <circleGeometry args={[glowRadius, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Core bright star — no additive blending so colors stay vivid */}
      <mesh
        ref={coreRef}
        onClick={handleClick}
        onPointerOver={() => { document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { document.body.style.cursor = "auto"; }}
      >
        <circleGeometry args={[coreRadius, 24]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={1}
          depthWrite={false}
        />
      </mesh>

      {/* Bright white center point */}
      <mesh>
        <circleGeometry args={[coreRadius * 0.4, 12]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.9}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Label — always visible, gold/warm tone, uppercase like star atlas */}
      <Text
        position={[0, -(coreRadius + 0.8), 0]}
        fontSize={0.45}
        color="#d4af37"
        anchorX="center"
        anchorY="top"
        fillOpacity={!matchesSearch ? 0.05 : otherFocused ? 0.2 : 0.85}
        letterSpacing={0.12}
        font={undefined}
      >
        {displayName}
      </Text>

      {/* Subtitle — node count */}
      <Text
        position={[0, -(coreRadius + 1.1), 0]}
        fontSize={0.18}
        color="#8a7a5a"
        anchorX="center"
        anchorY="top"
        fillOpacity={!matchesSearch ? 0.03 : otherFocused ? 0.1 : 0.5}
      >
        {philosophy.principleCount + philosophy.activityCount + philosophy.materialCount} elements
      </Text>
    </group>
  );
}
