// Região padrão: Região Metropolitana de Salvador.
const DEFAULT_BBOX = "-13.10,-38.75,-12.45,-38.15";

export interface GeoBBox {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

function parseBBox(value: string): GeoBBox | null {
  const parts = value.split(",").map((part) => Number(part.trim()));

  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) {
    return null;
  }

  const [minLat, minLng, maxLat, maxLng] = parts;

  if (minLat >= maxLat || minLng >= maxLng) {
    return null;
  }

  return { minLat, minLng, maxLat, maxLng };
}

export function getGeoBBox(): GeoBBox {
  const raw = process.env.GEO_BBOX?.trim();

  if (raw) {
    const parsed = parseBBox(raw);

    if (parsed) {
      return parsed;
    }
  }

  // Se a variável estiver ausente ou inválida, usa a região documentada.
  return parseBBox(DEFAULT_BBOX) as GeoBBox;
}

export function isInsideBBox(lat: number, lng: number): boolean {
  const { minLat, minLng, maxLat, maxLng } = getGeoBBox();

  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a));
}
