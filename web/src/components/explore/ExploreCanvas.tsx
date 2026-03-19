"use client";

import { useRef, useEffect, useCallback, useMemo } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { GraphData } from "./types";
import PhilosophyStar from "./PhilosophyStar";
import CurriculumMoon from "./CurriculumMoon";
import DetailNodes from "./DetailNodes";
import ConnectionLines from "./ConnectionLines";
import {
  ExploreContext,
  ExploreState,
  FocusedNode,
  VisibleLayers,
} from "./useExploreState";

/** Subtle mouse-based parallax on the camera (only when not focused) */
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
    // Only apply subtle parallax — CameraController handles focus animation
    camera.position.x += (mouse.current.x * 0.1 - camera.position.x) * 0.02;
    camera.position.y += (mouse.current.y * 0.1 - camera.position.y) * 0.02;
  });

  return null;
}

/** Camera controller that animates toward focused node */
function CameraController({
  focusedNode,
  data,
}: {
  focusedNode: FocusedNode | null;
  data: GraphData;
}) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0, 10));
  const targetZoom = useRef(1);

  // Compute target position based on focused node
  useEffect(() => {
    if (!focusedNode) {
      targetPos.current.set(0, 0, 10);
      targetZoom.current = 1;
      return;
    }

    if (focusedNode.type === "philosophy") {
      const phil = data.philosophies.find((p) => p.name === focusedNode.id);
      if (phil) {
        const x = (phil.dimensions.structure / 100) * 12 - 6;
        const y = (phil.dimensions.modality / 100) * -8 + 4;
        targetPos.current.set(x, y, 10);
        targetZoom.current = 3;
      }
    }
  }, [focusedNode, data]);

  useFrame(() => {
    // Lerp camera position toward target
    camera.position.x += (targetPos.current.x - camera.position.x) * 0.05;
    camera.position.y += (targetPos.current.y - camera.position.y) * 0.05;

    // Lerp zoom
    const ortho = camera as THREE.OrthographicCamera;
    ortho.zoom += (targetZoom.current - ortho.zoom) * 0.05;
    ortho.updateProjectionMatrix();
  });

  return null;
}

/** Escape key listener to clear focus */
function EscapeListener({
  setFocusedNode,
}: {
  setFocusedNode: (node: FocusedNode | null) => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFocusedNode(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setFocusedNode]);

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

export interface ExploreCanvasProps {
  data: GraphData;
  focusedNode: FocusedNode | null;
  setFocusedNode: (node: FocusedNode | null) => void;
  visibleLayers: VisibleLayers;
  setVisibleLayers: (layers: VisibleLayers) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export default function ExploreCanvas({
  data,
  focusedNode,
  setFocusedNode,
  visibleLayers,
  setVisibleLayers,
  searchTerm,
  setSearchTerm,
}: ExploreCanvasProps) {
  // Bridge the context into the R3F Canvas reconciler
  const contextValue = useMemo<ExploreState>(
    () => ({
      focusedNode,
      setFocusedNode,
      graphData: data,
      visibleLayers,
      setVisibleLayers,
      searchTerm,
      setSearchTerm,
    }),
    [focusedNode, setFocusedNode, data, visibleLayers, setVisibleLayers, searchTerm, setSearchTerm],
  );

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
      {/* Re-provide context inside the R3F Canvas reconciler */}
      <ExploreContext.Provider value={contextValue}>
        <Background />
        <CameraRig />
        <CameraController focusedNode={focusedNode} data={data} />
        <EscapeListener setFocusedNode={setFocusedNode} />

        {/* Invisible background plane — click to clear focus */}
        <mesh
          position={[0, 0, -1]}
          onClick={() => setFocusedNode(null)}
        >
          <planeGeometry args={[100, 100]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        {data.philosophies.map((p, i) => (
          <PhilosophyStar key={p.name} philosophy={p} index={i} />
        ))}

        {visibleLayers.curricula &&
          data.curricula.map((c, i) => (
            <CurriculumMoon
              key={c.id}
              curriculum={c}
              index={i}
            />
          ))}

        {/* Connection lines from focused philosophy to curricula */}
        {visibleLayers.curricula && <ConnectionLines />}

        {/* Detail nodes for focused philosophy */}
        <DetailNodes />

        <EffectComposer>
          <Bloom
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            intensity={1.5}
          />
        </EffectComposer>
      </ExploreContext.Provider>
    </Canvas>
  );
}
