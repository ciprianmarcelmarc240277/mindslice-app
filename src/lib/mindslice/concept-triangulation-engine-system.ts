import type { ColorPaletteStop } from "@/lib/mindslice/concept-visual-renderer-system";

export type TriangulationCanvas = {
  width: number;
  height: number;
};

export type TriangulationSettings = {
  point_count?: number;
  jitter?: number;
  grid_cols?: number;
  grid_rows?: number;
  color_variation?: number;
  seed?: string;
};

export type TriangulationPalette = Partial<{
  light_blue: string;
  medium_blue: string;
  deep_blue: string;
}> & {
  stops?: ColorPaletteStop[];
};

export type TriangulationPoint = {
  x: number;
  y: number;
};

export type TriangulationEdge = {
  a: TriangulationPoint;
  b: TriangulationPoint;
};

export type TriangulationTriangle = {
  points: [TriangulationPoint, TriangulationPoint, TriangulationPoint];
  centroid: TriangulationPoint;
  fill: string;
  opacity: number;
};

export type TriangulationOutput = {
  points: TriangulationPoint[];
  edges: TriangulationEdge[];
  triangles: TriangulationTriangle[];
};

type IndexedTriangle = {
  a: number;
  b: number;
  c: number;
};

type Circumcircle = {
  x: number;
  y: number;
  r2: number;
};

const DEFAULT_SEED = "mindslice-triangulation";

function hashSeed(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function seededUnit(seed: string, salt: string) {
  const hash = hashSeed(`${seed}:${salt}`);
  const normalized = Math.sin(hash * 12.9898) * 43758.5453;

  return normalized - Math.floor(normalized);
}

function seededRange(seed: string, salt: string, min: number, max: number) {
  return min + seededUnit(seed, salt) * (max - min);
}

function paletteColor(
  palette: TriangulationPalette,
  role: ColorPaletteStop["role"],
  fallback: string,
) {
  return palette.stops?.find((entry) => entry.role === role)?.color ?? fallback;
}

function generatePoints(
  canvas: TriangulationCanvas,
  settings: TriangulationSettings,
): TriangulationPoint[] {
  const seed = settings.seed ?? DEFAULT_SEED;
  const pointLimit = settings.point_count ?? 220;
  const jitter = settings.jitter ?? 0.35;
  const gridCols = settings.grid_cols ?? 28;
  const gridRows = settings.grid_rows ?? 10;
  const cellW = canvas.width / gridCols;
  const cellH = canvas.height / gridRows;
  const points: TriangulationPoint[] = [];

  for (let row = 0; row <= gridRows; row += 1) {
    for (let col = 0; col <= gridCols; col += 1) {
      if (points.length >= pointLimit) {
        return points;
      }

      const x = col * cellW + seededRange(seed, `point:${row}:${col}:x`, -cellW * jitter, cellW * jitter);
      const y = row * cellH + seededRange(seed, `point:${row}:${col}:y`, -cellH * jitter, cellH * jitter);

      points.push({
        x: Math.min(canvas.width, Math.max(0, x)),
        y: Math.min(canvas.height, Math.max(0, y)),
      });
    }
  }

  return points;
}

function addBoundaryPoints(points: TriangulationPoint[], canvas: TriangulationCanvas) {
  return [
    ...points,
    { x: 0, y: 0 },
    { x: canvas.width, y: 0 },
    { x: 0, y: canvas.height },
    { x: canvas.width, y: canvas.height },
  ];
}

function superTriangle(points: TriangulationPoint[]): [TriangulationPoint, TriangulationPoint, TriangulationPoint] {
  const minX = Math.min(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxX = Math.max(...points.map((point) => point.x));
  const maxY = Math.max(...points.map((point) => point.y));
  const dx = maxX - minX;
  const dy = maxY - minY;
  const delta = Math.max(dx, dy) || 1;
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;

  return [
    { x: midX - 20 * delta, y: midY - delta },
    { x: midX, y: midY + 20 * delta },
    { x: midX + 20 * delta, y: midY - delta },
  ];
}

function circumcircle(
  a: TriangulationPoint,
  b: TriangulationPoint,
  c: TriangulationPoint,
): Circumcircle {
  const ax = a.x;
  const ay = a.y;
  const bx = b.x;
  const by = b.y;
  const cx = c.x;
  const cy = c.y;
  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));

  if (Math.abs(d) < 1e-9) {
    return {
      x: Number.POSITIVE_INFINITY,
      y: Number.POSITIVE_INFINITY,
      r2: Number.POSITIVE_INFINITY,
    };
  }

  const ux =
    ((ax * ax + ay * ay) * (by - cy) +
      (bx * bx + by * by) * (cy - ay) +
      (cx * cx + cy * cy) * (ay - by)) /
    d;
  const uy =
    ((ax * ax + ay * ay) * (cx - bx) +
      (bx * bx + by * by) * (ax - cx) +
      (cx * cx + cy * cy) * (bx - ax)) /
    d;
  const r2 = (ux - ax) * (ux - ax) + (uy - ay) * (uy - ay);

  return { x: ux, y: uy, r2 };
}

function pointInCircumcircle(point: TriangulationPoint, circle: Circumcircle) {
  const dx = point.x - circle.x;
  const dy = point.y - circle.y;

  return dx * dx + dy * dy <= circle.r2;
}

function edgeKey(a: number, b: number) {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function delaunayTriangulation(points: TriangulationPoint[]): IndexedTriangle[] {
  const trianglePoints = [...points, ...superTriangle(points)];
  const superA = trianglePoints.length - 3;
  const superB = trianglePoints.length - 2;
  const superC = trianglePoints.length - 1;
  let triangles: IndexedTriangle[] = [{ a: superA, b: superB, c: superC }];

  points.forEach((point, pointIndex) => {
    const badTriangles = triangles.filter((triangle) =>
      pointInCircumcircle(
        point,
        circumcircle(
          trianglePoints[triangle.a],
          trianglePoints[triangle.b],
          trianglePoints[triangle.c],
        ),
      ),
    );
    const polygonEdges = new Map<string, [number, number]>();

    badTriangles.forEach((triangle) => {
      [
        [triangle.a, triangle.b],
        [triangle.b, triangle.c],
        [triangle.c, triangle.a],
      ].forEach(([a, b]) => {
        const key = edgeKey(a, b);

        if (polygonEdges.has(key)) {
          polygonEdges.delete(key);
          return;
        }

        polygonEdges.set(key, [a, b]);
      });
    });

    const badSet = new Set(badTriangles);
    triangles = triangles.filter((triangle) => !badSet.has(triangle));

    polygonEdges.forEach(([a, b]) => {
      triangles.push({ a, b, c: pointIndex });
    });
  });

  return triangles.filter(
    (triangle) =>
      triangle.a < points.length &&
      triangle.b < points.length &&
      triangle.c < points.length,
  );
}

function extractEdges(
  triangles: IndexedTriangle[],
  points: TriangulationPoint[],
): TriangulationEdge[] {
  const edges = new Map<string, TriangulationEdge>();

  triangles.forEach((triangle) => {
    [
      [triangle.a, triangle.b],
      [triangle.b, triangle.c],
      [triangle.c, triangle.a],
    ].forEach(([a, b]) => {
      const key = edgeKey(a, b);

      if (!edges.has(key)) {
        edges.set(key, {
          a: points[a],
          b: points[b],
        });
      }
    });
  });

  return [...edges.values()];
}

function triangleCentroid(points: [TriangulationPoint, TriangulationPoint, TriangulationPoint]) {
  return {
    x: (points[0].x + points[1].x + points[2].x) / 3,
    y: (points[0].y + points[1].y + points[2].y) / 3,
  };
}

function chooseBlueTone(palette: TriangulationPalette, tone: number) {
  if (tone < 0.33) {
    return palette.light_blue ?? paletteColor(palette, "surface", "#DDEAF2");
  }

  if (tone < 0.66) {
    return palette.medium_blue ?? paletteColor(palette, "accent", "#7FB7D8");
  }

  return palette.deep_blue ?? paletteColor(palette, "ink", "#21445B");
}

function assignTriangleColors(
  triangles: IndexedTriangle[],
  points: TriangulationPoint[],
  palette: TriangulationPalette,
  settings: TriangulationSettings,
): TriangulationTriangle[] {
  const seed = settings.seed ?? DEFAULT_SEED;
  const variation = settings.color_variation ?? 1;

  return triangles.map((triangle, index) => {
    const trianglePoints: [TriangulationPoint, TriangulationPoint, TriangulationPoint] = [
      points[triangle.a],
      points[triangle.b],
      points[triangle.c],
    ];
    const centroid = triangleCentroid(trianglePoints);
    const tone = seededUnit(seed, `tone:${Math.round(centroid.x)}:${Math.round(centroid.y)}:${index}`) * variation;

    return {
      points: trianglePoints,
      centroid,
      fill: chooseBlueTone(palette, tone),
      opacity: seededRange(seed, `opacity:${index}`, 0.28, 0.65),
    };
  });
}

export function runTriangulationEngineV1(
  canvas: TriangulationCanvas,
  settings: TriangulationSettings = {},
  palette: TriangulationPalette = {},
): TriangulationOutput {
  const points = addBoundaryPoints(generatePoints(canvas, settings), canvas);
  const triangles = delaunayTriangulation(points);
  const edges = extractEdges(triangles, points);
  const filledTriangles = assignTriangleColors(triangles, points, palette, settings);

  return {
    points,
    edges,
    triangles: filledTriangles,
  };
}

export const RUN = runTriangulationEngineV1;
