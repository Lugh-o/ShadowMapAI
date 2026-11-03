import type { DailyRow } from "@/lib/dashboard";

interface DailyChartProps {
  data: DailyRow[];
}

function formatDay(date: string): string {
  return new Date(`${date}T00:00:00.000Z`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  });
}

export default function DailyChart({ data }: DailyChartProps) {
  const max = Math.max(...data.map((item) => item.count), 0);
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <section className="card-strong rounded-[24px] p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-lg font-semibold text-emerald-950">
          Relatos por dia
        </h3>
        <p className="text-xs text-emerald-950/55">Últimos 30 dias</p>
      </div>

      {total === 0 ? (
        <p className="mt-3 text-sm text-emerald-950/60">
          Sem relatos nos últimos 30 dias.
        </p>
      ) : (
        <>
          <div
            className="mt-4 flex h-40 items-end gap-1"
            role="img"
            aria-label="Gráfico de relatos por dia nos últimos 30 dias"
          >
            {data.map((item) => (
              <div
                key={item.date}
                title={`${formatDay(item.date)}: ${item.count} relato(s)`}
                className="flex-1 rounded-t bg-emerald-700/80 transition hover:bg-emerald-700"
                style={{
                  height:
                    max > 0
                      ? `${Math.max((item.count / max) * 100, item.count > 0 ? 4 : 1)}%`
                      : "1%",
                }}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-emerald-950/55">
            <span>{formatDay(data[0].date)}</span>
            <span>{formatDay(data[data.length - 1].date)}</span>
          </div>
        </>
      )}
    </section>
  );
}
