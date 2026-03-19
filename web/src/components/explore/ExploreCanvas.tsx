"use client";

import { useRef, useEffect, useCallback } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { GraphData } from "./types";
import PhilosophyStar from "./PhilosophyStar";

/** Subtle mouse-based parallax on the camera */
function CameraRig() {
  const { camera } = useThree();
  const mouse = useRef({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    // Normalized -1 to 1
    mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  useFrame(() => {
    camera.position.x += (mouse.current.x * 0.1 - camera.position.x) * 0.05;
    camera.position.y += (mouse.current.y * 0.1 - camera.position.y) * 0.05;
  });

  return null;
}

/** Set the background clear color */
function Background() {
  const { gl } = useThree();
  useEffect(() => {
    gl.setClearColor(new THREE.Color("#0a0a0f"));
  }, [gl]);
  return null;
}

interface ExploreCanvasProps {
  data: GraphData;
}

export default function ExploreCanvas({ data }: ExploreCanvasProps) {
  return (
    <Canvas
      orthographic
      camera={{
        zoom: 1,
        near: -100,
        far: 100,
        left: -8,
        right: 8,
        top: 5,
        bottom: -5,
      }}
      style={{ width: "100%", height: "100%" }}
      gl={{ antialias: true }}
    >
      <Background />
      <CameraRig />

      {data.philosophies.map((p, i) => (
        <PhilosophyStar key={p.name} philosophy={p} index={i} />
      ))}

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          intensity={1.5}
        />
      </EffectComposer>
    </Canvas>
  );
}
