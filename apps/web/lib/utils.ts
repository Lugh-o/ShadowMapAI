import clsx, { type ClassValue } from "clsx";

import type {
  City,
  HeatLevel,
  IssueType,
  PointFeature,
  Priority,
  ShadeLevel,
} from "@shadowmap/types";

export const CITY_OPTIONS: City[] = [
  "Salvador",
  "Camaçari",
  "Lauro de Freitas",
  "Simões Filho",
];

export const ISSUE_OPTIONS: IssueType[] = [
  "heat_island",
  "low_tree_cover",
  "exposed_transit_stop",
  "paved_open_area",
  "school_route",
];

export const PRIORITY_OPTIONS: Priority[] = [
  "critical",
  "high",
  "medium",
  "low",
];

export const HEAT_LEVEL_OPTIONS: HeatLevel[] = [
  "extreme",
  "high",
  "medium",
  "low",
];

export const SHADE_LEVEL_OPTIONS: ShadeLevel[] = [
  "none",
  "low",
  "moderate",
  "good",
];

export const DEFAULT_MAP_CENTER: [number, number] = [-12.9718, -38.5011];
export const DEFAULT_MAP_ZOOM = 12;

const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  heat_island: "Ilha de calor",
  low_tree_cover: "Baixa arborização",
  exposed_transit_stop: "Ponto de ônibus exposto",
  paved_open_area: "Área pavimentada exposta",
  school_route: "Rota escolar sem sombra",
};

const PRIORITY_LABELS: Record<Priority, string> = {
  critical: "Crítica",
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

const HEAT_LEVEL_LABELS: Record<HeatLevel, string> = {
  extreme: "Extremo",
  high: "Alto",
  medium: "Médio",
  low: "Baixo",
};

const SHADE_LEVEL_LABELS: Record<ShadeLevel, string> = {
  none: "Sem sombra",
  low: "Sombra insuficiente",
  moderate: "Sombra moderada",
  good: "Boa cobertura",
};

const PRIORITY_SCORES: Record<Priority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const HEAT_LEVEL_SCORES: Record<HeatLevel, number> = {
  extreme: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const SHADE_DEFICIT_SCORES: Record<ShadeLevel, number> = {
  none: 4,
  low: 3,
  moderate: 2,
  good: 1,
};

export const CITY_CENTERS: Record<City, [number, number]> = {
  Salvador: [-12.9718, -38.5011],
  Camaçari: [-12.6991, -38.3261],
  "Lauro de Freitas": [-12.8941, -38.3214],
  "Simões Filho": [-12.7844, -38.4042],
};

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function getIssueTypeLabel(issueType: IssueType) {
  return ISSUE_TYPE_LABELS[issueType];
}

export function getPriorityLabel(priority: Priority) {
  return PRIORITY_LABELS[priority];
}

export function getHeatLevelLabel(heatLevel: HeatLevel) {
  return HEAT_LEVEL_LABELS[heatLevel];
}

export function getShadeLevelLabel(shadeLevel: ShadeLevel) {
  return SHADE_LEVEL_LABELS[shadeLevel];
}

// Regra determinística única para prioridade. A IA nunca decide prioridade.
export function derivePriority(
  heatLevel: HeatLevel,
  shadeLevel: ShadeLevel,
): Priority {
  if (
    heatLevel === "extreme" ||
    (heatLevel === "high" && shadeLevel === "none")
  ) {
    return "critical";
  }

  if (heatLevel === "high") {
    return "high";
  }

  if (heatLevel === "medium") {
    return "medium";
  }

  return "low";
}

export function getHeatZoneColor(intensity: HeatLevel) {
  return {
    low: "#F6C453",
    medium: "#F38B2A",
    high: "#E25A36",
    extreme: "#7F1D1D",
  }[intensity];
}

export function getHeatZoneFillOpacity(intensity: HeatLevel) {
  return {
    low: 0.18,
    medium: 0.24,
    high: 0.3,
    extreme: 0.38,
  }[intensity];
}

export function getPointPriorityColor(priority: Priority) {
  return {
    low: "#2A9D8F",
    medium: "#E9C46A",
    high: "#F4A261",
    critical: "#E63946",
  }[priority];
}

export function getCriticalityScore(point: PointFeature) {
  return (
    PRIORITY_SCORES[point.priority] * 10 +
    HEAT_LEVEL_SCORES[point.heatLevel] * 4 +
    SHADE_DEFICIT_SCORES[point.shadeLevel] * 3
  );
}

export function sortPointsByCriticality(points: PointFeature[]) {
  return [...points].sort(
    (first, second) =>
      getCriticalityScore(second) - getCriticalityScore(first),
  );
}

export function formatCoordinates(lat: number, lng: number) {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export function inferCityFromCoordinates(lat: number, lng: number): City {
  const nearest = CITY_OPTIONS.reduce(
    (closest, city) => {
      const [cityLat, cityLng] = CITY_CENTERS[city];
      const distance = Math.hypot(cityLat - lat, cityLng - lng);

      if (distance < closest.distance) {
        return {
          city,
          distance,
        };
      }

      return closest;
    },
    {
      city: "Salvador" as City,
      distance: Number.POSITIVE_INFINITY,
    },
  );

  return nearest.city;
}
