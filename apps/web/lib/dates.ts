// Timestamps remain in UTC; all interface calendar dates use Bahia time.
export const APP_TIME_ZONE = "America/Bahia";
export const DAY_MS = 24 * 60 * 60 * 1000;

const calendarFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function toAppDayKey(date: Date): string {
  const parts = calendarFormatter.formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)!.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

// These UTC dates represent calendar keys, not event timestamps. Calendar
// arithmetic must not reinterpret them as midnight in the interface time zone.
export function shiftDayKey(key: string, days: number): string {
  return new Date(Date.parse(`${key}T00:00:00Z`) + days * DAY_MS)
    .toISOString().slice(0, 10);
}

export function formatAppDate(value: string): string {
  return new Date(value).toLocaleDateString("pt-BR", { timeZone: APP_TIME_ZONE });
}

export function formatDayKey(key: string, full = false): string {
  const [year, month, day] = key.split("-");
  return `${day}/${month}${full ? `/${year}` : ""}`;
}
