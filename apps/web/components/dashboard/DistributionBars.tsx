import type { DistributionRow } from "@/lib/dashboard";

interface DistributionBarsProps {
  title: string;
  items: DistributionRow[];
}

export default function DistributionBars({
  title,
  items,
}: DistributionBarsProps) {
  const max = Math.max(...items.map((item) => item.count), 0);
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <section className="card-strong rounded-[24px] p-4">
      <h3 className="font-display text-lg font-semibold text-emerald-950">
        {title}
      </h3>

      {total === 0 ? (
        <p className="mt-3 text-sm text-emerald-950/60">
          Sem relatos no período selecionado.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={item.key}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-emerald-950/80">{item.label}</span>
                <span className="font-semibold text-emerald-950">
                  {item.count}
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-emerald-100">
                <div
                  className="h-full rounded-full bg-emerald-700"
                  style={{
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
