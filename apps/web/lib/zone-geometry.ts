import type { HeatZone } from "@shadowmap/types";

export type ZoneCoordinate = [number, number];

export interface ZoneDraft
  extends Pick<HeatZone, "name" | "city" | "intensity" | "coordinates"> {
  editingId: string | null;
  stage: "drawing" | "details";
}

export const MAX_ZONE_VERTICES = 60;
const EARTH_RADIUS = 6_371_000;
const RADIANS = Math.PI / 180;
const EPSILON = 1e-8;

function project(coordinates: ZoneCoordinate[]): ZoneCoordinate[] {
  if (!coordinates.length) return [];
  const [originLat, originLng] = coordinates[0];
  const meanLatitude =
    coordinates.reduce((sum, [lat]) => sum + lat, 0) / coordinates.length;
  const longitudeScale = Math.cos(meanLatitude * RADIANS);
  return coordinates.map(([lat, lng]) => [
    (lng - originLng) * RADIANS * EARTH_RADIUS * longitudeScale,
    (lat - originLat) * RADIANS * EARTH_RADIUS,
  ]);
}

function cross(a: ZoneCoordinate, b: ZoneCoordinate, c: ZoneCoordinate) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function onSegment(a: ZoneCoordinate, b: ZoneCoordinate, p: ZoneCoordinate) {
  return (
    Math.abs(cross(a, b, p)) <= EPSILON &&
    p[0] >= Math.min(a[0], b[0]) - EPSILON &&
    p[0] <= Math.max(a[0], b[0]) + EPSILON &&
    p[1] >= Math.min(a[1], b[1]) - EPSILON &&
    p[1] <= Math.max(a[1], b[1]) + EPSILON
  );
}

function intersects(
  a: ZoneCoordinate,
  b: ZoneCoordinate,
  c: ZoneCoordinate,
  d: ZoneCoordinate,
) {
  const abC = cross(a, b, c);
  const abD = cross(a, b, d);
  const cdA = cross(c, d, a);
  const cdB = cross(c, d, b);
  if (
    ((abC > EPSILON && abD < -EPSILON) || (abC < -EPSILON && abD > EPSILON)) &&
    ((cdA > EPSILON && cdB < -EPSILON) || (cdA < -EPSILON && cdB > EPSILON))
  )
    return true;
  return (
    onSegment(a, b, c) ||
    onSegment(a, b, d) ||
    onSegment(c, d, a) ||
    onSegment(c, d, b)
  );
}

/** Approximate area in square metres, using a local projection around the zone. */
export function getZoneArea(coordinates: ZoneCoordinate[]) {
  const points = project(coordinates);
  return (
    Math.abs(
      points.reduce((sum, point, index) => {
        const next = points[(index + 1) % points.length];
        return sum + point[0] * next[1] - next[0] * point[1];
      }, 0),
    ) / 2
  );
}

export function getZoneGeometryError(
  coordinates: ZoneCoordinate[],
): string | null {
  if (coordinates.length < 3)
    return "Marque pelo menos três vértices para formar uma área.";
  if (coordinates.length > MAX_ZONE_VERTICES)
    return `Use no máximo ${MAX_ZONE_VERTICES} vértices.`;
  if (
    coordinates.some(
      ([lat, lng]) =>
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        Math.abs(lat) > 85 ||
        Math.abs(lng) > 180,
    )
  )
    return "O contorno contém coordenadas inválidas.";
  for (let i = 0; i < coordinates.length; i++) {
    for (let j = i + 1; j < coordinates.length; j++) {
      if (
        Math.abs(coordinates[i][0] - coordinates[j][0]) < 1e-9 &&
        Math.abs(coordinates[i][1] - coordinates[j][1]) < 1e-9
      ) {
        return "Há vértices repetidos. Arraste um deles ou desfaça o último.";
      }
    }
  }
  const points = project(coordinates);
  for (let i = 0; i < points.length; i++) {
    const nextI = (i + 1) % points.length;
    for (let j = i + 1; j < points.length; j++) {
      const nextJ = (j + 1) % points.length;
      if (nextI === j || nextJ === i) continue;
      if (intersects(points[i], points[nextI], points[j], points[nextJ])) {
        return "O contorno se cruza. Arraste os vértices ou desfaça o último.";
      }
    }
  }
  if (getZoneArea(coordinates) < 1)
    return "Desenhe uma área de pelo menos 1 m², com vértices fora de uma mesma linha.";
  return null;
}

export function formatZoneArea(coordinates: ZoneCoordinate[]) {
  const area = getZoneArea(coordinates);
  return area >= 1_000_000
    ? `${(area / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} km²`
    : `${area.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} m²`;
}
