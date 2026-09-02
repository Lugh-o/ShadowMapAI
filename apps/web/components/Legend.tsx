import { cn } from "@/lib/utils";

interface LegendProps {
  className?: string;
}

const heatLegend = [
  { label: "Calor baixo", color: "#F6C453" },
  { label: "Calor médio", color: "#F38B2A" },
  { label: "Calor alto", color: "#E25A36" },
  { label: "Calor extremo", color: "#7F1D1D" },
];

const pointLegend = [
  { label: "Baixa", color: "#2A9D8F" },
  { label: "Média", color: "#E9C46A" },
  { label: "Alta", color: "#F4A261" },
  { label: "Crítica", color: "#E63946" },
];

export default function Legend({ className }: LegendProps) {
  return (
    <aside
      className={cn(
        "glass-panel flex max-w-[360px] flex-col gap-4 rounded-[24px] px-4 py-3 text-sm text-emerald-950/78",
        className,
      )}
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-950/55">
          Legenda
        </p>
        <h2 className="mt-1 font-display text-lg font-semibold text-emerald-950">
          Zonas e pontos críticos
        </h2>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-950/55">
          Intensidade térmica
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {heatLegend.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span
                className="h-3 w-8 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-950/55">
          Prioridade dos pontos
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {pointLegend.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full border border-white/80"
                style={{ backgroundColor: item.color }}
              />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
