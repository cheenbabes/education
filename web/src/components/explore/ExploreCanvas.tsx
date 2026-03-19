"use client";

import { useRef, useEffect, useMemo, MutableRefObject } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { MapControls, Line } from "@react-three/drei";
import { AdditiveBlending } from "three";
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
import { PHILOSOPHY_POSITIONS, CONSTELLATION_EDGES } from "./positions";

/** Constellation lines between philosophies — bezier curves in gold like a star atlas */
function ConstellationLines() {
  const lines = useMemo(() => {
    return CONSTELLATION_EDGES.map(([a, b]) => {
      const posA = PHILOSOPHY_POSITIONS[a];
      const posB = PHILOSOPHY_POSITIONS[b];
      if (!posA || !posB) return null;

      // Create quadratic bezier curve with control point offset perpendicular to the line
      const start = new THREE.Vector3(posA[0], posA[1], -0.1);
      const end = new THREE.Vector3(posB[0], posB[1], -0.1);
      const mid = new THREE.Vector3(
        (posA[0] + posB[0]) / 2,
        (posA[1] + posB[1]) / 2,
        -0.1,
      );
      // Offset perpendicular to line direction for curve
      const dx = posB[0] - posA[0];
      const dy = posB[1] - posA[1];
      const len = Math.sqrt(dx * dx + dy * dy);
      const curvature = len * 0.15;
      mid.x += (-dy / len) * curvature;
      mid.y += (dx / len) * curvature;

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const points = curve.getPoints(20);

      return { points, key: `${a}-${b}` };
    }).filter(Boolean) as { points: THREE.Vector3[]; key: string }[];
  }, []);

  return (
    <group>
      {lines.map((line) => (
        <Line
          key={line.key}
          points={line.points}
          color="#d4af37"
          lineWidth={0.5}
          transparent
          opacity={0.15}
        />
      ))}
    </group>
  );
}

/** Faint background star dust — tiny random points for atmosphere */
function StarDust() {
  const points = useMemo(() => {
    const positions = new Float32Array(600 * 3);
    for (let i = 0; i < 600; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 35;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 25;
      positions[i * 3 + 2] = -0.5;
    }
    return positions;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={points}
          count={600}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#d4af37"
        size={0.03}
        transparent
        opacity={0.15}
        blending={AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

/** Camera controller that animates toward focused node */
function CameraController({ focusedNode }: { focusedNode: FocusedNode | null }) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0, 10));
  const targetZoom = useRef(45);

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
        targetZoom.current = 80;
      }
    }
  }, [focusedNode]);

  useFrame(() => {
    if (!focusedNode) return;
    camera.position.x += (targetPos.current.x - camera.position.x) * 0.05;
    camera.position.y += (targetPos.current.y - camera.position.y) * 0.05;
    const ortho = camera as THREE.OrthographicCamera;
    ortho.zoom += (targetZoom.current - ortho.zoom) * 0.05;
    ortho.updateProjectionMatrix();
  });

  return null;
}

/** Escape key listener to clear focus */
function EscapeListener({ setFocusedNode }: { setFocusedNode: (node: FocusedNode | null) => void }) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocusedNode(null);
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
    gl.setClearColor(new THREE.Color("#060610"));
  }, [gl]);
  return null;
}

/** Zoom controller that exposes zoomIn/zoomOut to DOM layer via ref */
function ZoomController({ zoomRef }: { zoomRef: MutableRefObject<{ zoomIn: () => void; zoomOut: () => void }> }) {
  const { camera } = useThree();
  useEffect(() => {
    zoomRef.current = {
      zoomIn: () => {
        const ortho = camera as THREE.OrthographicCamera;
        ortho.zoom = Math.min(ortho.zoom * 1.3, 200);
        ortho.updateProjectionMatrix();
      },
      zoomOut: () => {
        const ortho = camera as THREE.OrthographicCamera;
        ortho.zoom = Math.max(ortho.zoom / 1.3, 15);
        ortho.updateProjectionMatrix();
      },
    };
  }, [camera, zoomRef]);
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
  zoomRef?: MutableRefObject<{ zoomIn: () => void; zoomOut: () => void }>;
}

export default function ExploreCanvas({
  data,
  focusedNode,
  setFocusedNode,
  visibleLayers,
  setVisibleLayers,
  searchTerm,
  setSearchTerm,
  zoomRef,
}: ExploreCanvasProps) {
  const defaultZoomRef = useRef({ zoomIn: () => {}, zoomOut: () => {} });
  const resolvedZoomRef = zoomRef || defaultZoomRef;
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
      gl={{ antialias: true, alpha: false }}
    >
      <ExploreContext.Provider value={contextValue}>
        <Background />
        <MapControls
          enableRotate={false}
          enableDamping
          dampingFactor={0.1}
          minZoom={15}
          maxZoom={200}
          mouseButtons={{ LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }}
        />
        <ZoomController zoomRef={resolvedZoomRef} />
        <CameraController focusedNode={focusedNode} />
        <EscapeListener setFocusedNode={setFocusedNode} />

        {/* Click background to clear focus */}
        <mesh position={[0, 0, -2]} onClick={() => setFocusedNode(null)}>
          <planeGeometry args={[200, 200]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        {/* Ambient star dust */}
        <StarDust />

        {/* Constellation lines between philosophies */}
        <ConstellationLines />

        {/* Philosophy stars */}
        {data.philosophies.map((p, i) => (
          <PhilosophyStar key={p.name} philosophy={p} index={i} />
        ))}

        {/* Curriculum moons */}
        {visibleLayers.curricula &&
          data.curricula.map((c, i) => (
            <CurriculumMoon key={c.id} curriculum={c} index={i} />
          ))}

        {/* Connection lines from focused philosophy to curricula */}
        {visibleLayers.curricula && <ConnectionLines />}

        {/* Detail nodes for focused philosophy */}
        <DetailNodes />
      </ExploreContext.Provider>
    </Canvas>
  );
}
