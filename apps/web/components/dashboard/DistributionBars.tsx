import type { DistributionRow } from "@/lib/dashboard";

interface DistributionBarsProps {
  title: string;
  items: DistributionRow[];
  colors?: Record<string, string>;
}

export default function DistributionBars({
  title,
  items,
  colors,
}: DistributionBarsProps) {
  const max = Math.max(...items.map((item) => item.count), 0);
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <section className="card-strong min-w-0 rounded-3xl p-4">
      <h2 className="font-display text-base font-semibold text-emerald-950">
        {title}
      </h2>

      {total === 0 ? (
        <p className="mt-3 text-sm text-emerald-950/60">
          Sem relatos no período selecionado.
        </p>
      ) : (
        <div className="mt-3 space-y-2.5">
          {items.map((item) => (
            <div key={item.key}>
              <div className="flex items-baseline justify-between gap-3 text-xs">
                <span className="inline-flex min-w-0 items-center gap-1.5 text-emerald-950/80">
                  {colors?.[item.key] ? (
                    <span
                      className="h-2 w-2 shrink-0 rounded-sm"
                      style={{ backgroundColor: colors[item.key] }}
                      aria-hidden="true"
                    />
                  ) : null}
                  {item.label}
                </span>
                <span className="font-semibold text-emerald-950">
                  {item.count}
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-emerald-100">
                <div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: colors?.[item.key] ?? "#047857",
                    width: max > 0 ? `${(item.count / max) * 100}%` : "0%",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
