"use client";
import { useRef } from "react";
import { Mafs, Coordinates, Plot, Point, Polygon } from "mafs";
import "mafs/core.css";

interface MafsVisualProps {
  type: string;
  params: Record<string, unknown>;
  onSvgReady?: (svgHtml: string) => void;
}

export function WorksheetMafsVisual({ type, params, onSvgReady }: MafsVisualProps) {
  const ref = useRef<HTMLDivElement>(null);

  const captureSvg = () => {
    if (onSvgReady && ref.current) {
      const svg = ref.current.querySelector("svg");
      if (svg) onSvgReady(svg.outerHTML);
    }
  };

  if (type === "mafs_coordinate_plane") {
    const xRange = params.xRange as [number, number] ?? [-5, 5];
    const yRange = params.yRange as [number, number] ?? [-5, 5];
    const points = params.points as Array<{ x: number; y: number }> ?? [];
    return (
      <div ref={ref} style={{ width: 300, height: 300 }} onTransitionEnd={captureSvg}>
        <Mafs width={300} height={300} viewBox={{ x: xRange, y: yRange }}>
          <Coordinates.Cartesian />
          {points.map((pt, i) => (
            <Point key={i} x={pt.x} y={pt.y} />
          ))}
        </Mafs>
      </div>
    );
  }

  if (type === "mafs_function") {
    const fnStr = params.fn as string ?? "x";
    const safeFn = (x: number) => {
      try {
        // Only allow simple arithmetic expressions
        return Function(`"use strict"; const x = ${x}; return ${fnStr}`)() as number;
      } catch { return 0; }
    };
    return (
      <div ref={ref} style={{ width: 300, height: 300 }} onTransitionEnd={captureSvg}>
        <Mafs width={300} height={300}>
          <Coordinates.Cartesian />
          <Plot.OfX y={safeFn} />
        </Mafs>
      </div>
    );
  }

  if (type === "mafs_polygon") {
    const vertices = params.vertices as Array<[number, number]> ?? [];
    return (
      <div ref={ref} style={{ width: 300, height: 300 }} onTransitionEnd={captureSvg}>
        <Mafs width={300} height={300}>
          <Coordinates.Cartesian />
          <Polygon points={vertices} />
        </Mafs>
      </div>
    );
  }

  return null;
}
