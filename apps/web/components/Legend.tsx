"use client";

import { EyeOff, Layers } from "lucide-react";
import { useId } from "react";
import type { Ref } from "react";

import { cn } from "@/lib/utils";

interface LegendProps {
  className?: string;
  showSimulated?: boolean;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  toggleRef?: Ref<HTMLButtonElement>;
}

const heatLegend = [
  { label: "Baixo", color: "#F6C453" },
  { label: "Médio", color: "#F38B2A" },
  { label: "Alto", color: "#E25A36" },
  { label: "Extremo", color: "#7F1D1D" },
];

const pointLegend = [
  { label: "Baixa", color: "#2A9D8F" },
  { label: "Média", color: "#E9C46A" },
  { label: "Alta", color: "#F4A261" },
  { label: "Crítica", color: "#E63946" },
];

export default function Legend({
  className,
  showSimulated = false,
  expanded: isExpanded,
  onExpandedChange,
  toggleRef,
}: LegendProps) {
  const contentId = useId();

  return (
    <aside
      aria-label="Legenda do mapa"
      className={cn(
        "max-w-full rounded-xl border border-emerald-950/10 bg-white/90 px-2.5 py-2 text-[11px] leading-4 text-emerald-950/80 shadow-sm backdrop-blur-md",
        isExpanded ? "w-60" : "w-fit",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        {isExpanded ? (
          <h2 className="font-semibold text-emerald-950">Legenda</h2>
        ) : null}
        <button
          ref={toggleRef}
          type="button"
          aria-label={isExpanded ? "Ocultar legenda" : "Exibir legenda"}
          aria-expanded={isExpanded}
          aria-controls={contentId}
          onClick={() => onExpandedChange(!isExpanded)}
          className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg px-2 font-medium text-emerald-950/75 transition hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-emerald-700"
        >
          {isExpanded ? (
            <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Layers className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {isExpanded ? "Ocultar" : "Legenda"}
        </button>
      </div>

      <div id={contentId} hidden={!isExpanded} className="mt-1 space-y-1.5">
        {showSimulated ? (
          <div>
            <p className="mb-0.5 font-semibold text-emerald-950/65">
              Calor · zonas ilustrativas
            </p>
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
              {heatLegend.map((item) => (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-1"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-sm"
                    style={{ backgroundColor: item.color }}
                    aria-hidden="true"
                  />
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-emerald-950/65">Dados simulados ocultos.</p>
        )}

        <div>
          <p className="mb-0.5 font-semibold text-emerald-950/65">
            Prioridade · contorno dos pontos
          </p>
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
            {pointLegend.map((item) => (
              <span key={item.label} className="inline-flex items-center gap-1">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full border-2 bg-slate-300"
                  style={{ borderColor: item.color }}
                  aria-hidden="true"
                />
                {item.label}
              </span>
            ))}
          </div>
        </div>
        <p className="flex items-center gap-1.5 border-t border-emerald-950/10 pt-1.5 text-emerald-950/65">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full border border-dashed border-emerald-950/45 bg-slate-300"
            aria-hidden="true"
          />
          Tracejado · ponto simulado
        </p>
      </div>
    </aside>
  );
}
