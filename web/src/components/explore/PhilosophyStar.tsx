"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { PhilosophyNode } from "./types";
import { useExploreState } from "./useExploreState";

interface PhilosophyStarProps {
  philosophy: PhilosophyNode;
  index: number;
}

export default function PhilosophyStar({
  philosophy,
  index,
}: PhilosophyStarProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { focusedNode, setFocusedNode, searchTerm } = useExploreState();

  const isFocused =
    focusedNode?.type === "philosophy" && focusedNode.id === philosophy.name;
  const otherFocused = focusedNode !== null && !isFocused;

  const { position, radius, phaseOffset, color, ringRadii } = useMemo(() => {
    const x = (philosophy.dimensions.structure / 100) * 12 - 6;
    const y = (philosophy.dimensions.modality / 100) * -8 + 4;
    const totalNodes =
      philosophy.principleCount +
      philosophy.activityCount +
      philosophy.materialCount;
    const r = 0.15 + Math.log(totalNodes + 1) * 0.06;
    const phase = index * 1.37; // golden-angle-ish offset
    const c = new THREE.Color(philosophy.color);

    // Ring radii scale with total node count
    const baseRing = r + 0.2;
    const rings = [baseRing, baseRing + 0.15, baseRing + 0.3];

    return {
      position: [x, y, 0] as [number, number, number],
      radius: r,
      phaseOffset: phase,
      color: c,
      ringRadii: rings,
    };
  }, [philosophy, index]);

  // Format display name: "place-nature-based" -> "Place Nature Based"
  const displayName = useMemo(
    () =>
      philosophy.name
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
    [philosophy.name],
  );

  // Does this node match the current search?
  const matchesSearch = useMemo(() => {
    if (!searchTerm) return true;
    return displayName.toLowerCase().includes(searchTerm.toLowerCase());
  }, [searchTerm, displayName]);

  // Target opacity: fade when another node is focused or search doesn't match
  const targetOpacity = !matchesSearch ? 0.15 : otherFocused ? 0.2 : 1;

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const pulse =
        1 + 0.05 * Math.sin(clock.elapsedTime * 0.5 + phaseOffset);
      meshRef.current.scale.setScalar(pulse);

      // Lerp opacity
      const mat = meshRef.current.material as THREE.MeshBasicMaterial;
      if (!mat.transparent) mat.transparent = true;
      mat.opacity += (targetOpacity - mat.opacity) * 0.08;
    }
    if (ringsRef.current) {
      ringsRef.current.rotation.z =
        clock.elapsedTime * 0.05 + phaseOffset * 0.3;

      // Fade rings too
      ringsRef.current.children.forEach((child, idx) => {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshBasicMaterial;
        if (mat.transparent) {
          const baseOpacity = 0.1 - idx * 0.025;
          mat.opacity += (baseOpacity * targetOpacity - mat.opacity) * 0.08;
        }
      });
    }
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (isFocused) {
      setFocusedNode(null);
    } else {
      setFocusedNode({ type: "philosophy", id: philosophy.name });
    }
  };

  return (
    <group ref={groupRef} position={position}>
      {/* Core orb */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <sphereGeometry args={[radius, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={1} />
      </mesh>

      {/* Ripple rings */}
      <group ref={ringsRef}>
        {ringRadii.map((ringR, i) => (
          <mesh key={i} rotation={[0, 0, i * 0.3]}>
            <ringGeometry args={[ringR, ringR + 0.015, 64]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.1 - i * 0.025}
            />
          </mesh>
        ))}
      </group>

      {/* Label */}
      <Text
        position={[0, -(radius + 0.2), 0]}
        fontSize={0.15}
        color="white"
        anchorX="center"
        anchorY="top"
        fillOpacity={!matchesSearch ? 0.08 : otherFocused ? 0.15 : 0.6}
      >
        {displayName}
      </Text>
    </group>
  );
}
