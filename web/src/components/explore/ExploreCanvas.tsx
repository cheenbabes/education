"use client";

import { useRef, useEffect, useMemo, MutableRefObject } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Line } from "@react-three/drei";
import { AdditiveBlending } from "three";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
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
import { LayoutPositions } from "./useForceLayout";
import {
  PHILOSOPHY_POSITIONS,
  CONSTELLATION_EDGES,
} from "./positions";

/** Constellation lines between philosophies — bezier curves in gold like a star atlas */
function ConstellationLines({
  philosophyNames,
  focusActive,
}: {
  philosophyNames: Set<string>;
  focusActive: boolean;
}) {
  const lines = useMemo(() => {
    return CONSTELLATION_EDGES.map(([a, b]) => {
      if (!philosophyNames.has(a) || !philosophyNames.has(b)) return null;
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
  }, [philosophyNames]);

  return (
    <group>
      {lines.map((line) => (
        <Line
          key={line.key}
          points={line.points}
          color="#d4af37"
          lineWidth={0.8}
          transparent
          opacity={focusActive ? 0.09 : 0.24}
        />
      ))}
    </group>
  );
}

/** Decorative atlas guide rings/meridians to evoke antique celestial maps. */
function AtlasGuides() {
  const { rings, meridians, ticks } = useMemo(() => {
    const makeRing = (radiusX: number, radiusY: number, z: number, steps: number) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(t) * radiusX, Math.sin(t) * radiusY, z));
      }
      return pts;
    };

    const ringDefs = [
      makeRing(13.5, 9.2, -0.35, 110),
      makeRing(10.8, 7.4, -0.35, 110),
      makeRing(7.2, 4.9, -0.35, 110),
    ];
    const meridianDefs = [
      [
        new THREE.Vector3(-12.4, 0, -0.34),
        new THREE.Vector3(-4.8, 4.5, -0.34),
        new THREE.Vector3(4.9, 4.5, -0.34),
        new THREE.Vector3(12.4, 0, -0.34),
      ],
      [
        new THREE.Vector3(-12.4, 0, -0.34),
        new THREE.Vector3(-4.8, -4.5, -0.34),
        new THREE.Vector3(4.9, -4.5, -0.34),
        new THREE.Vector3(12.4, 0, -0.34),
      ],
    ];
    const tickDefs: [THREE.Vector3, THREE.Vector3][] = [];
    const stepCount = 28;
    for (let i = 0; i < stepCount; i += 1) {
      const t = (i / stepCount) * Math.PI * 2;
      const cos = Math.cos(t);
      const sin = Math.sin(t);
      const outer = new THREE.Vector3(cos * 13.6, sin * 9.3, -0.34);
      const inner = new THREE.Vector3(cos * 13.28, sin * 9.05, -0.34);
      tickDefs.push([inner, outer]);
    }
    return { rings: ringDefs, meridians: meridianDefs, ticks: tickDefs };
  }, []);

  return (
    <group rotation={[0, 0, -0.13]}>
      {rings.map((points, i) => (
        <Line
          key={`guide-${i}`}
          points={points}
          color="#d4af37"
          transparent
          opacity={i === 0 ? 0.09 : 0.05}
          lineWidth={i === 0 ? 0.55 : 0.3}
        />
      ))}
      {meridians.map((points, i) => (
        <Line
          key={`meridian-${i}`}
          points={points}
          color="#d4af37"
          transparent
          opacity={0.08}
          lineWidth={0.34}
        />
      ))}
      {ticks.map(([a, b], i) => (
        <Line
          key={`tick-${i}`}
          points={[a, b]}
          color="#d4af37"
          transparent
          opacity={0.17}
          lineWidth={0.3}
        />
      ))}
    </group>
  );
}

/** Faint background star dust — tiny random points for atmosphere */
function StarDust() {
  const points = useMemo(() => {
    const positions = new Float32Array(1200 * 3);
    for (let i = 0; i < 1200; i++) {
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
          count={1200}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#d4af37"
        size={0.035}
        transparent
        opacity={0.24}
        blending={AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
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

function BackgroundDismissPlane({ onDismiss }: { onDismiss: () => void }) {
  const down = useRef<{ x: number; y: number } | null>(null);
  return (
    <mesh
      position={[0, 0, -2]}
      onPointerDown={(e) => {
        down.current = { x: e.clientX, y: e.clientY };
      }}
      onClick={(e) => {
        // Ignore drag-release clicks so panning does not clear focus.
        if (!down.current) return;
        const dx = e.clientX - down.current.x;
        const dy = e.clientY - down.current.y;
        const moved = Math.sqrt(dx * dx + dy * dy) > 6;
        if (!moved) onDismiss();
        down.current = null;
      }}
    >
      <planeGeometry args={[200, 200]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

/** Set the background clear color */
function Background() {
  const { gl } = useThree();
  useEffect(() => {
    gl.setClearColor(new THREE.Color("#000000"), 0);
  }, [gl]);
  return null;
}

/** Scale map zoom to viewport size so composition fills large screens. */
function ResponsiveZoom({ controlsRef }: { controlsRef: MutableRefObject<OrbitControlsImpl | null> }) {
  const { camera, size } = useThree();
  useEffect(() => {
    const ortho = camera as THREE.OrthographicCamera;
    const shortest = Math.min(size.width, size.height);
    const targetZoom = THREE.MathUtils.clamp(shortest / 14, 45, 95);
    ortho.zoom = targetZoom;
    ortho.updateProjectionMatrix();
    controlsRef.current?.update?.();
  }, [camera, size.width, size.height, controlsRef]);
  return null;
}

/** Zoom controller that exposes zoomIn/zoomOut to DOM layer via ref */
function ZoomController({
  zoomRef,
  controlsRef,
}: {
  zoomRef: MutableRefObject<{ zoomIn: () => void; zoomOut: () => void }>;
  controlsRef: MutableRefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();
  useEffect(() => {
    const applyZoom = (factor: number) => {
      const ortho = camera as THREE.OrthographicCamera;
      ortho.zoom = THREE.MathUtils.clamp(ortho.zoom * factor, 15, 200);
      ortho.updateProjectionMatrix();
      const controls = controlsRef.current;
      controls?.update?.();
    };

    zoomRef.current = {
      zoomIn: () => applyZoom(1.2),
      zoomOut: () => applyZoom(1 / 1.2),
    };
  }, [camera, zoomRef, controlsRef]);
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
  layoutPositions: LayoutPositions;
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
  layoutPositions,
  zoomRef,
}: ExploreCanvasProps) {
  const defaultZoomRef = useRef({ zoomIn: () => {}, zoomOut: () => {} });
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const resolvedZoomRef = zoomRef || defaultZoomRef;
  const presentPhilosophyNames = useMemo(
    () => new Set(data.philosophies.map((p) => p.name)),
    [data.philosophies],
  );
  const contextValue = useMemo<ExploreState>(
    () => ({
      focusedNode,
      setFocusedNode,
      graphData: data,
      visibleLayers,
      setVisibleLayers,
      searchTerm,
      setSearchTerm,
      layoutPositions,
    }),
    [focusedNode, setFocusedNode, data, visibleLayers, setVisibleLayers, searchTerm, setSearchTerm, layoutPositions],
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
      gl={{ antialias: true, alpha: true }}
    >
      <ExploreContext.Provider value={contextValue}>
        <Background />
        <ResponsiveZoom controlsRef={controlsRef} />
        <AtlasGuides />
        <OrbitControls
          ref={controlsRef}
          enableRotate={false}
          enabled
          enablePan
          screenSpacePanning
          enableDamping
          dampingFactor={0.1}
          zoomSpeed={0.9}
          panSpeed={1}
          minZoom={15}
          maxZoom={200}
          mouseButtons={{ LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }}
        />
        <ZoomController zoomRef={resolvedZoomRef} controlsRef={controlsRef} />
        <EscapeListener setFocusedNode={setFocusedNode} />

        {/* Click empty background to clear focus (without breaking drag-pan). */}
        <BackgroundDismissPlane onDismiss={() => setFocusedNode(null)} />

        {/* Ambient star dust */}
        <StarDust />

        {/* Constellation lines between philosophies */}
        <ConstellationLines
          philosophyNames={presentPhilosophyNames}
          focusActive={focusedNode !== null}
        />

        {/* Philosophy stars */}
        {data.philosophies.map((p, i) => (
          <PhilosophyStar key={`${p.name}-${i}`} philosophy={p} index={i} />
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
