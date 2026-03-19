import * as THREE from "three";

/**
 * SVG glyph designs converted to THREE.Shape vector geometry.
 *
 * Coordinate conventions:
 *   - All shapes are unit-sized (radius ~1) so components scale them.
 *   - SVG Y-down is flipped to Three.js Y-up by negating Y values.
 *   - SVG 24px viewBox is normalized by dividing by 12 (the half-size).
 */

/** Rotate a 2D point around the origin by `angle` radians. */
function rotatePoint(x: number, y: number, angle: number): [number, number] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [x * cos - y * sin, x * sin + y * cos];
}

/**
 * 4-ray elongated diamond star (materials).
 *
 * SVG path (24px viewBox, center 12,12):
 *   M12,0 C12,7 13,10 20,12 C13,14 12,17 12,24
 *         C12,17 11,14 4,12 C11,10 12,7 12,0Z
 *
 * Normalized (divide by 12, negate Y, center at origin):
 *   SVG (12,0) -> (0, 1)    top
 *   SVG (20,12)-> (0.667, 0) right
 *   SVG (12,24)-> (0, -1)   bottom
 *   SVG (4,12) -> (-0.667, 0) left
 */
export function createMaterialStar(): THREE.Shape {
  const shape = new THREE.Shape();

  // Start at top: SVG (12,0) -> Three.js (0, 1)
  shape.moveTo(0, 1);

  // Top -> Right: SVG C12,7 13,10 20,12
  // cp1: (12,7) -> (0, 5/12) = (0, 0.4167)
  // cp2: (13,10) -> (1/12, 2/12) = (0.0833, 0.1667)
  // end: (20,12) -> (8/12, 0) = (0.6667, 0)
  shape.bezierCurveTo(0, 5 / 12, 1 / 12, 2 / 12, 8 / 12, 0);

  // Right -> Bottom: SVG C13,14 12,17 12,24
  // cp1: (13,14) -> (1/12, -2/12) = (0.0833, -0.1667)
  // cp2: (12,17) -> (0, -5/12) = (0, -0.4167)
  // end: (12,24) -> (0, -1)
  shape.bezierCurveTo(1 / 12, -2 / 12, 0, -5 / 12, 0, -1);

  // Bottom -> Left: SVG C12,17 11,14 4,12
  // cp1: (12,17) -> (0, -5/12) = (0, -0.4167)
  // cp2: (11,14) -> (-1/12, -2/12) = (-0.0833, -0.1667)
  // end: (4,12) -> (-8/12, 0) = (-0.6667, 0)
  shape.bezierCurveTo(0, -5 / 12, -1 / 12, -2 / 12, -8 / 12, 0);

  // Left -> Top: SVG C11,10 12,7 12,0
  // cp1: (11,10) -> (-1/12, 2/12) = (-0.0833, 0.1667)
  // cp2: (12,7) -> (0, 5/12) = (0, 0.4167)
  // end: (12,0) -> (0, 1)
  shape.bezierCurveTo(-1 / 12, 2 / 12, 0, 5 / 12, 0, 1);

  return shape;
}

/**
 * 6-ray curved petal star (activities).
 *
 * Single petal SVG (centered, 24px viewBox):
 *   M0,-12 C1.5,-5 3,-2 0,0 C-3,-2 -1.5,-5 0,-12Z
 *
 * Normalized (divide by 12, negate Y):
 *   start: (0, 1)   top
 *   cp1: (0.125, 5/12)  cp2: (0.25, 2/12)  end: (0, 0)
 *   cp1: (-0.25, 2/12)  cp2: (-0.125, 5/12)  end: (0, 1)
 *
 * 6 petals rotated 60deg apart + center circle.
 */
export function createActivityStar(): THREE.Shape[] {
  const shapes: THREE.Shape[] = [];
  const N = 12; // half-viewBox

  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI * 2) / 6;
    const shape = new THREE.Shape();

    // SVG petal points (already centered, Y-down):
    // M0,-12  C1.5,-5  3,-2  0,0  C-3,-2  -1.5,-5  0,-12Z
    // Normalized & Y-flipped:
    const start: [number, number] = [0 / N, 12 / N]; // (0, 1)
    const cp1a: [number, number] = [1.5 / N, 5 / N]; // right side control
    const cp2a: [number, number] = [3 / N, 2 / N];
    const mid: [number, number] = [0 / N, 0 / N]; // center
    const cp1b: [number, number] = [-3 / N, 2 / N];
    const cp2b: [number, number] = [-1.5 / N, 5 / N];
    const end: [number, number] = [0 / N, 12 / N]; // back to top

    const [sx, sy] = rotatePoint(start[0], start[1], angle);
    shape.moveTo(sx, sy);

    const [c1ax, c1ay] = rotatePoint(cp1a[0], cp1a[1], angle);
    const [c2ax, c2ay] = rotatePoint(cp2a[0], cp2a[1], angle);
    const [mx, my] = rotatePoint(mid[0], mid[1], angle);
    shape.bezierCurveTo(c1ax, c1ay, c2ax, c2ay, mx, my);

    const [c1bx, c1by] = rotatePoint(cp1b[0], cp1b[1], angle);
    const [c2bx, c2by] = rotatePoint(cp2b[0], cp2b[1], angle);
    const [ex, ey] = rotatePoint(end[0], end[1], angle);
    shape.bezierCurveTo(c1bx, c1by, c2bx, c2by, ex, ey);

    shapes.push(shape);
  }

  // Center circle (radius 2/12 ~ 0.1667)
  const circle = new THREE.Shape();
  const cR = 2 / N;
  circle.absarc(0, 0, cR, 0, Math.PI * 2, false);
  shapes.push(circle);

  return shapes;
}

/**
 * 8-ray compass rose (principles).
 *
 * 4 long cardinal triangles: points="0,-12 1.5,-3 -1.5,-3"
 * 4 short diagonal triangles: points="0,-8 1,-3 -1,-3"
 * + center circle r=3
 *
 * Normalized (divide by 12, negate Y):
 *   Long: (0,1) (0.125, 0.25) (-0.125, 0.25)
 *   Short: (0, 0.6667) (1/12, 0.25) (-1/12, 0.25)
 *   Circle radius: 3/12 = 0.25
 */
export function createPrincipleStar(): THREE.Shape[] {
  const shapes: THREE.Shape[] = [];
  const N = 12;

  // 4 long cardinal triangles at 0, 90, 180, 270 deg
  const longAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
  for (const angle of longAngles) {
    const shape = new THREE.Shape();
    // SVG: (0, -12), (1.5, -3), (-1.5, -3) -> normalized Y-flipped: (0, 1), (0.125, 0.25), (-0.125, 0.25)
    const p0: [number, number] = [0 / N, 12 / N]; // tip
    const p1: [number, number] = [1.5 / N, 3 / N]; // right base
    const p2: [number, number] = [-1.5 / N, 3 / N]; // left base

    const [x0, y0] = rotatePoint(p0[0], p0[1], angle);
    const [x1, y1] = rotatePoint(p1[0], p1[1], angle);
    const [x2, y2] = rotatePoint(p2[0], p2[1], angle);

    shape.moveTo(x0, y0);
    shape.lineTo(x1, y1);
    shape.lineTo(x2, y2);
    shape.lineTo(x0, y0);

    shapes.push(shape);
  }

  // 4 short diagonal triangles at 45, 135, 225, 315 deg
  const shortAngles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
  for (const angle of shortAngles) {
    const shape = new THREE.Shape();
    // SVG: (0, -8), (1, -3), (-1, -3) -> normalized Y-flipped: (0, 8/12), (1/12, 3/12), (-1/12, 3/12)
    const p0: [number, number] = [0 / N, 8 / N];
    const p1: [number, number] = [1 / N, 3 / N];
    const p2: [number, number] = [-1 / N, 3 / N];

    const [x0, y0] = rotatePoint(p0[0], p0[1], angle);
    const [x1, y1] = rotatePoint(p1[0], p1[1], angle);
    const [x2, y2] = rotatePoint(p2[0], p2[1], angle);

    shape.moveTo(x0, y0);
    shape.lineTo(x1, y1);
    shape.lineTo(x2, y2);
    shape.lineTo(x0, y0);

    shapes.push(shape);
  }

  // Center circle (radius 3/12 = 0.25)
  const circle = new THREE.Shape();
  circle.absarc(0, 0, 3 / N, 0, Math.PI * 2, false);
  shapes.push(circle);

  return shapes;
}

/**
 * 12-ray sun (curricula).
 *
 * 12 triangular rays every 30deg: points="0,-12 1,-4.5 -1,-4.5"
 * + solid circle center r=4.5
 *
 * Normalized (divide by 12, negate Y):
 *   Ray: (0, 1), (1/12, 4.5/12), (-1/12, 4.5/12)
 *        = (0, 1), (0.0833, 0.375), (-0.0833, 0.375)
 *   Circle radius: 4.5/12 = 0.375
 */
export function createCurriculumSun(): THREE.Shape[] {
  const shapes: THREE.Shape[] = [];
  const N = 12;

  // 12 rays every 30 degrees
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI * 2) / 12;
    const shape = new THREE.Shape();

    // SVG: (0, -12), (1, -4.5), (-1, -4.5)
    // Normalized Y-flipped: (0, 1), (1/12, 4.5/12), (-1/12, 4.5/12)
    const p0: [number, number] = [0 / N, 12 / N]; // tip
    const p1: [number, number] = [1 / N, 4.5 / N]; // right base
    const p2: [number, number] = [-1 / N, 4.5 / N]; // left base

    const [x0, y0] = rotatePoint(p0[0], p0[1], angle);
    const [x1, y1] = rotatePoint(p1[0], p1[1], angle);
    const [x2, y2] = rotatePoint(p2[0], p2[1], angle);

    shape.moveTo(x0, y0);
    shape.lineTo(x1, y1);
    shape.lineTo(x2, y2);
    shape.lineTo(x0, y0);

    shapes.push(shape);
  }

  // Center circle (radius 4.5/12 = 0.375)
  const circle = new THREE.Shape();
  circle.absarc(0, 0, 4.5 / N, 0, Math.PI * 2, false);
  shapes.push(circle);

  return shapes;
}
