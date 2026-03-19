"use client";

import { useRef, useEffect, useMemo } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { MapControls } from "@react-three/drei";
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
import { PHILOSOPHY_POSITIONS } from "./positions";

/** Camera controller that animates toward focused node */
function CameraController({
  focusedNode,
}: {
  focusedNode: FocusedNode | null;
}) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0, 10));
  const targetZoom = useRef(45);

  // Compute target position based on focused node
  useEffect(() => {
    if (!focusedNode) {
      targetPos.current.set(0, 0, 10);
      targetZoom.current = 45;
      return;
    }

    if (focusedNode.type === "philosophy") {
      const pos = PHILOSOPHY_POSITIONS[focusedNode.id];
      if (pos) {
        targetPos.current.set(pos[0], pos[1], 10);
        targetZoom.current = 90;
      }
    }
  }, [focusedNode]);

  useFrame(() => {
    if (!focusedNode) return; // let MapControls handle when no focus

    camera.position.x += (targetPos.current.x - camera.position.x) * 0.05;
    camera.position.y += (targetPos.current.y - camera.position.y) * 0.05;

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
        zoom: 45,
        near: -100,
        far: 100,
        position: [0, 0, 10],
      }}
      style={{ width: "100%", height: "100%" }}
      gl={{ antialias: true }}
    >
      {/* Re-provide context inside the R3F Canvas reconciler */}
      <ExploreContext.Provider value={contextValue}>
        <Background />
        <MapControls
          enableRotate={false}
          enableDamping
          dampingFactor={0.1}
          minZoom={0.3}
          maxZoom={8}
          mouseButtons={{ LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }}
        />
        <CameraController focusedNode={focusedNode} />
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
            luminanceThreshold={0.1}
            luminanceSmoothing={0.5}
            intensity={2.5}
            mipmapBlur
          />
        </EffectComposer>
      </ExploreContext.Provider>
    </Canvas>
  );
}
