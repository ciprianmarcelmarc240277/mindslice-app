export type GeometryPoint = {
  x: number;
  y: number;
};

export type GeometryVector = GeometryPoint;

export type GeometryLine = {
  start: GeometryPoint;
  end: GeometryPoint;
};

export type GeometryRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type GeometryCircle = {
  cx: number;
  cy: number;
  r: number;
};

export type GeometryCanvas = {
  width: number;
  height: number;
};

export type GeometryArea = GeometryRect;

export type GeometryShape = {
  points: GeometryPoint[];
  rotation?: number;
};

export type GeometryCurve = {
  start: GeometryPoint;
  control: GeometryPoint;
  end: GeometryPoint;
};

export type GeometryWeightedElement = GeometryPoint & {
  visual_weight?: number;
};

export type GeometryEngineState = {
  points: GeometryPoint[];
  vectors: GeometryVector[];
  angles: number[];
  shapes: GeometryShape[];
  paths: Array<GeometryLine | GeometryCurve>;
};

export type GeometryRequest =
  | {
      type: "point_on_circle";
      center: GeometryPoint;
      radius: number;
      angle: number;
    }
  | {
      type: "distribute_on_circle";
      center: GeometryPoint;
      radius: number;
      count: number;
      start_angle: number;
    }
  | {
      type: "rotate_point";
      point: GeometryPoint;
      center: GeometryPoint;
      angle: number;
    }
  | {
      type: "project_toward";
      source: GeometryPoint;
      target: GeometryPoint;
      distance: number;
    }
  | {
      type: "curve_between";
      a: GeometryPoint;
      b: GeometryPoint;
      curvature: number;
    }
  | {
      type: "balance_score";
      elements: GeometryWeightedElement[];
    };

export type GeometryContext = {
  canvas?: GeometryCanvas;
};

export type GeometryFailure = {
  status: "fail";
  message: string;
};

export type GeometryResult =
  | GeometryPoint
  | GeometryPoint[]
  | GeometryCurve
  | number
  | GeometryFailure;

export function point(x: number, y: number): GeometryPoint {
  return { x, y };
}

export function distance(a: GeometryPoint, b: GeometryPoint) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  return Math.hypot(dx, dy);
}

export function midpoint(a: GeometryPoint, b: GeometryPoint): GeometryPoint {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

export function vector(from: GeometryPoint, to: GeometryPoint): GeometryVector {
  return {
    x: to.x - from.x,
    y: to.y - from.y,
  };
}

export function vector_length(v: GeometryVector) {
  return Math.hypot(v.x, v.y);
}

export function normalize_vector(v: GeometryVector): GeometryVector {
  const length = vector_length(v);

  if (length === 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: v.x / length,
    y: v.y / length,
  };
}

export function scale_vector(v: GeometryVector, amount: number): GeometryVector {
  return {
    x: v.x * amount,
    y: v.y * amount,
  };
}

export function move_point(source: GeometryPoint, movement: GeometryVector): GeometryPoint {
  return {
    x: source.x + movement.x,
    y: source.y + movement.y,
  };
}

export function angle_between(a: GeometryPoint, b: GeometryPoint) {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

export function deg_to_rad(degrees: number) {
  return (degrees * Math.PI) / 180;
}

export function rad_to_deg(radians: number) {
  return (radians * 180) / Math.PI;
}

export function point_on_circle(
  center: GeometryPoint,
  radius: number,
  angle_degrees: number,
): GeometryPoint {
  const angle = deg_to_rad(angle_degrees);

  return {
    x: center.x + Math.cos(angle) * radius,
    y: center.y + Math.sin(angle) * radius,
  };
}

export function distribute_on_circle(
  center: GeometryPoint,
  radius: number,
  count: number,
  start_angle_degrees: number,
) {
  if (count <= 0) {
    return [];
  }

  return Array.from({ length: count }, (_, index) =>
    point_on_circle(center, radius, start_angle_degrees + index * (360 / count)),
  );
}

export function rotate_point(
  source: GeometryPoint,
  center: GeometryPoint,
  angle_degrees: number,
): GeometryPoint {
  const angle = deg_to_rad(angle_degrees);
  const translatedX = source.x - center.x;
  const translatedY = source.y - center.y;

  return {
    x: translatedX * Math.cos(angle) - translatedY * Math.sin(angle) + center.x,
    y: translatedX * Math.sin(angle) + translatedY * Math.cos(angle) + center.y,
  };
}

export function rotate_shape(
  shape: GeometryShape,
  center: GeometryPoint,
  angle_degrees: number,
): GeometryShape {
  return {
    ...shape,
    points: shape.points.map((shapePoint) =>
      rotate_point(shapePoint, center, angle_degrees),
    ),
    rotation: (shape.rotation ?? 0) + angle_degrees,
  };
}

export function line_from_angle(
  origin: GeometryPoint,
  angle_degrees: number,
  length: number,
): GeometryLine {
  return {
    start: origin,
    end: point_on_circle(origin, length, angle_degrees),
  };
}

export function project_toward(
  source: GeometryPoint,
  target: GeometryPoint,
  distance_amount: number,
): GeometryPoint {
  const direction = normalize_vector(vector(source, target));
  const movement = scale_vector(direction, distance_amount);

  return move_point(source, movement);
}

export function perpendicular(v: GeometryVector): GeometryVector {
  return {
    x: -v.y,
    y: v.x,
  };
}

export function offset_line(line: GeometryLine, amount: number): GeometryLine {
  const normal = normalize_vector(perpendicular(vector(line.start, line.end)));
  const offset = scale_vector(normal, amount);

  return {
    start: move_point(line.start, offset),
    end: move_point(line.end, offset),
  };
}

export function rect_from_center(
  center: GeometryPoint,
  width: number,
  height: number,
): GeometryRect {
  return {
    x: center.x - width / 2,
    y: center.y - height / 2,
    width,
    height,
  };
}

export function circle_from_center(center: GeometryPoint, radius: number): GeometryCircle {
  return {
    cx: center.x,
    cy: center.y,
    r: radius,
  };
}

export function golden_points(canvas: GeometryCanvas) {
  const phi = 1.61803398875;
  const gx1 = canvas.width / phi;
  const gx2 = canvas.width - gx1;
  const gy1 = canvas.height / phi;
  const gy2 = canvas.height - gy1;

  return [
    { x: gx1, y: gy1 },
    { x: gx1, y: gy2 },
    { x: gx2, y: gy1 },
    { x: gx2, y: gy2 },
  ];
}

export function thirds_points(canvas: GeometryCanvas) {
  return [
    { x: canvas.width / 3, y: canvas.height / 3 },
    { x: (canvas.width * 2) / 3, y: canvas.height / 3 },
    { x: canvas.width / 3, y: (canvas.height * 2) / 3 },
    { x: (canvas.width * 2) / 3, y: (canvas.height * 2) / 3 },
  ];
}

export function safe_area(canvas: GeometryCanvas, margin: number): GeometryArea {
  return {
    x: margin,
    y: margin,
    width: canvas.width - margin * 2,
    height: canvas.height - margin * 2,
  };
}

export function clamp_point_to_area(
  source: GeometryPoint,
  area: GeometryArea,
): GeometryPoint {
  return {
    x: clamp(source.x, area.x, area.x + area.width),
    y: clamp(source.y, area.y, area.y + area.height),
  };
}

export function tension_point(
  a: GeometryPoint,
  b: GeometryPoint,
  bias: number,
): GeometryPoint {
  return {
    x: a.x + (b.x - a.x) * bias,
    y: a.y + (b.y - a.y) * bias,
  };
}

export function bezier_control_point(
  a: GeometryPoint,
  b: GeometryPoint,
  curvature: number,
): GeometryPoint {
  const mid = midpoint(a, b);
  const normal = normalize_vector(perpendicular(vector(a, b)));
  const offset = scale_vector(normal, curvature);

  return move_point(mid, offset);
}

export function curve_between(
  a: GeometryPoint,
  b: GeometryPoint,
  curvature: number,
): GeometryCurve {
  return {
    start: a,
    control: bezier_control_point(a, b, curvature),
    end: b,
  };
}

export function center_of_mass(elements: GeometryWeightedElement[]): GeometryPoint {
  const totalWeight = elements.reduce(
    (sum, element) => sum + (element.visual_weight ?? 1),
    0,
  );

  if (totalWeight <= 0) {
    return { x: 0, y: 0 };
  }

  return elements.reduce(
    (accumulator, element) => {
      const weight = element.visual_weight ?? 1;

      return {
        x: accumulator.x + (element.x * weight) / totalWeight,
        y: accumulator.y + (element.y * weight) / totalWeight,
      };
    },
    { x: 0, y: 0 },
  );
}

export function balance_score(elements: GeometryWeightedElement[], canvas: GeometryCanvas) {
  const mass = center_of_mass(elements);
  const center = {
    x: canvas.width / 2,
    y: canvas.height / 2,
  };
  const d = distance(mass, center);
  const maxD = canvas.width / 2;

  return 1 - clamp(d / maxD, 0, 1);
}

export function nearest_point(source: GeometryPoint, points: GeometryPoint[]) {
  return points.reduce<GeometryPoint | null>((nearest, candidate) => {
    if (!nearest) {
      return candidate;
    }

    return distance(source, candidate) < distance(source, nearest) ? candidate : nearest;
  }, null);
}

export function interpolate_point(
  a: GeometryPoint,
  b: GeometryPoint,
  amount: number,
): GeometryPoint {
  return {
    x: a.x + (b.x - a.x) * amount,
    y: a.y + (b.y - a.y) * amount,
  };
}

export function runGeometryEngineV1(
  geometry_request: GeometryRequest,
  geometry_context: GeometryContext = {},
): GeometryResult {
  switch (geometry_request.type) {
    case "point_on_circle":
      return point_on_circle(
        geometry_request.center,
        geometry_request.radius,
        geometry_request.angle,
      );

    case "distribute_on_circle":
      return distribute_on_circle(
        geometry_request.center,
        geometry_request.radius,
        geometry_request.count,
        geometry_request.start_angle,
      );

    case "rotate_point":
      return rotate_point(
        geometry_request.point,
        geometry_request.center,
        geometry_request.angle,
      );

    case "project_toward":
      return project_toward(
        geometry_request.source,
        geometry_request.target,
        geometry_request.distance,
      );

    case "curve_between":
      return curve_between(
        geometry_request.a,
        geometry_request.b,
        geometry_request.curvature,
      );

    case "balance_score":
      if (!geometry_context.canvas) {
        return fail("MISSING_GEOMETRY_CONTEXT_CANVAS");
      }

      return balance_score(geometry_request.elements, geometry_context.canvas);

    default:
      return fail("UNKNOWN_GEOMETRY_REQUEST");
  }
}

export function clamp(value: number, min: number, max: number) {
  if (value < min) {
    return min;
  }

  if (value > max) {
    return max;
  }

  return value;
}

export function fail(message: string): GeometryFailure {
  return {
    status: "fail",
    message,
  };
}

export const RUN = runGeometryEngineV1;
