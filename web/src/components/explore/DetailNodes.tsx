"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { useExploreState } from "./useExploreState";

interface DetailDotProps {
  label: string;
  position: [number, number, number];
  color: string;
  delay: number;
}

function DetailDot({ label, position, color, delay }: DetailDotProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const startTime = useRef<number | null>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    if (startTime.current === null) {
      startTime.current = clock.elapsedTime;
    }
    const elapsed = clock.elapsedTime - startTime.current;
    const progress = Math.min(1, Math.max(0, (elapsed - delay) / 0.5));
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    meshRef.current.scale.setScalar(eased);
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        position={position}
        scale={0}
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
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>

      {hovered && (
        <Text
          position={[position[0], position[1] - 0.08, position[2]]}
          fontSize={0.06}
          color="white"
          anchorX="center"
          anchorY="top"
          fillOpacity={0.95}
          maxWidth={1.5}
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
  const { focusedNode, graphData } = useExploreState();

  const details = useMemo(() => {
    if (!focusedNode || focusedNode.type !== "philosophy") return null;

    const philName = focusedNode.id;
    const philosophy = graphData.philosophies.find((p) => p.name === philName);
    if (!philosophy) return null;

    // Compute philosophy position (same formula as PhilosophyStar)
    const x = (philosophy.dimensions.structure / 100) * 12 - 6;
    const y = (philosophy.dimensions.modality / 100) * -8 + 4;

    const principles = graphData.principles.filter(
      (p) => p.philosophyId === philName,
    );
    const activities = graphData.activities.filter(
      (a) => a.philosophyId === philName,
    );
    const materials = graphData.materials.filter(
      (m) => m.philosophyId === philName,
    );

    // Principles: arc ABOVE the star
    const principlePositions = arcPositions(
      x,
      y,
      principles.length,
      0.5,
      2.0,
      Math.PI * 0.2,  // roughly upper arc
      Math.PI * 0.8,
      42,
    );

    // Activities: arc BELOW the star
    const activityPositions = arcPositions(
      x,
      y,
      activities.length,
      0.5,
      2.0,
      -Math.PI * 0.8, // lower arc
      -Math.PI * 0.2,
      137,
    );

    // Materials: arc to the RIGHT
    const materialPositions = arcPositions(
      x,
      y,
      materials.length,
      0.5,
      2.0,
      -Math.PI * 0.3, // right side arc
      Math.PI * 0.3,
      271,
    );

    return { principles, activities, materials, principlePositions, activityPositions, materialPositions };
  }, [focusedNode, graphData]);

  if (!details) return null;

  const { principles, activities, materials, principlePositions, activityPositions, materialPositions } = details;
  const totalCount = principles.length + activities.length + materials.length;

  return (
    <group>
      {/* Principles - white dots above */}
      {principles.map((p, i) => (
        <DetailDot
          key={`p-${p.id}`}
          label={p.name}
          position={principlePositions[i]}
          color="#ffffff"
          delay={(i / totalCount) * 0.4}
        />
      ))}

      {/* Activities - amber dots below */}
      {activities.map((a, i) => (
        <DetailDot
          key={`a-${a.id}`}
          label={a.name}
          position={activityPositions[i]}
          color="#F59E42"
          delay={((principles.length + i) / totalCount) * 0.4}
        />
      ))}

      {/* Materials - blue dots to the right */}
      {materials.map((m, i) => (
        <DetailDot
          key={`m-${m.id}`}
          label={m.name}
          position={materialPositions[i]}
          color="#60A5FA"
          delay={
            ((principles.length + activities.length + i) / totalCount) * 0.4
          }
        />
      ))}
    </group>
  );
}
