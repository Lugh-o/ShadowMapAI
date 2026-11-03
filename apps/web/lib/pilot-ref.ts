const DEFAULT_PILOT_REFS = [
  "bruno",
  "vitoria",
  "davi",
  "joao",
  "lucas",
  "pedro",
  "gustavo",
  "caio",
  "mariana",
];

const PILOT_REF_PATTERN = /^[a-z0-9_-]+$/;

export function getPilotRefs(): string[] {
  const configured = process.env.PILOT_REFS;
  const source =
    configured && configured.trim().length > 0
      ? configured
      : DEFAULT_PILOT_REFS.join(",");

  return Array.from(
    new Set(
      source
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter((value) => PILOT_REF_PATTERN.test(value)),
    ),
  );
}

/**
 * Retorna o slug apenas se ele estiver na lista configurada. Qualquer valor
 * desconhecido é descartado (nunca gravamos refs inventados).
 */
export function normalizePilotRef(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const slug = value.trim().toLowerCase();

  if (!PILOT_REF_PATTERN.test(slug)) return null;

  return getPilotRefs().includes(slug) ? slug : null;
}
