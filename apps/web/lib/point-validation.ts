import type { PointFormValues } from "@shadowmap/types";

export type PointFormDraft = Omit<PointFormValues, "lat" | "lng"> & {
  lat: string | number;
  lng: string | number;
};

export const POINT_TEXT_LIMITS = { neighborhood: 100, description: 2000 };

// Envelope da área atendida pela demonstração na Grande Salvador.
export const POINT_BOUNDS = {
  lat: { min: -13.2, max: -12.3 },
  lng: { min: -38.8, max: -37.8 },
};

export type PointFormErrors = Partial<
  Record<"neighborhood" | "description" | "lat" | "lng", string>
>;

function parseCoordinate(value: string | number): number {
  if (typeof value === "number") return value;
  const text = value.trim().replace(",", ".");
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text))
    return NaN;
  return Number(text);
}

export function parsePointForm(draft: PointFormDraft): {
  values: PointFormValues | null;
  errors: PointFormErrors;
} {
  const errors: PointFormErrors = {};
  const neighborhood = draft.neighborhood.trim();
  const description = draft.description.trim();
  for (const field of ["neighborhood", "description"] as const) {
    const text = field === "neighborhood" ? neighborhood : description;
    const label = field === "neighborhood" ? "o bairro" : "a descrição";
    if (!text) errors[field] = `Informe ${label}; espaços não são suficientes.`;
    else if (text.length > POINT_TEXT_LIMITS[field])
      errors[field] = `Use no máximo ${POINT_TEXT_LIMITS[field]} caracteres.`;
  }

  const lat = parseCoordinate(draft.lat);
  const lng = parseCoordinate(draft.lng);
  for (const field of ["lat", "lng"] as const) {
    const value = field === "lat" ? lat : lng;
    const limit = field === "lat" ? 90 : 180;
    const bounds = POINT_BOUNDS[field];
    if (!Number.isFinite(value) || Math.abs(value) > limit)
      errors[field] = `Informe um número finito entre -${limit} e ${limit}.`;
    else if (value < bounds.min || value > bounds.max)
      errors[field] = `Use coordenadas da Grande Salvador (${bounds.min} a ${bounds.max}).`;
  }

  return {
    errors,
    values: Object.keys(errors).length
      ? null
      : { ...draft, lat, lng, neighborhood, description },
  };
}
