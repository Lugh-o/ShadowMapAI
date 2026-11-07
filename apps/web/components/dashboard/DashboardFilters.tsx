"use client";

import { Filter, FlaskConical } from "lucide-react";
import type { ReactNode } from "react";

import { CITY_OPTIONS, cn } from "@/lib/utils";
import type { DashboardParams, DashboardPeriod } from "@/lib/dashboard";

interface DashboardFiltersProps {
  filters: DashboardParams;
  filteredPoints: number;
  totalPoints: number;
}

const periodOptions: Array<{ value: DashboardPeriod; label: string }> = [
  { value: 7, label: "7 dias" },
  { value: 30, label: "30 dias" },
  { value: "all", label: "Tudo" },
];

export default function DashboardFilters({
  filters,
  filteredPoints,
  totalPoints,
}: DashboardFiltersProps) {
  function updateFilters(updates: Partial<DashboardParams>) {
    const next = { ...filters, ...updates };
    if (next.city === filters.city && next.days === filters.days) return;
    const params = new URLSearchParams({
      city: next.city,
      days: String(next.days),
    });
    window.history.pushState(null, "", `?${params}`);
  }

  return (
    <section
      aria-label="Filtros do painel"
      className="glass-panel m-0 flex h-16 min-w-0 items-center overflow-x-auto overflow-y-hidden rounded-2xl p-1.25 text-sm scrollbar-thin"
    >
      <div className="flex min-h-11.5 w-max min-w-full shrink-0 flex-nowrap items-center whitespace-nowrap">
        <div className="flex shrink-0 items-center justify-center p-1.25">
          <Filter aria-hidden="true" className="h-4 w-4 text-emerald-950/60" />
        </div>

        <div
          role="group"
          aria-label="Cidade"
          className="flex shrink-0 items-center gap-1.5 p-1.25 text-xs"
        >
          <span className="mr-1 text-[11px] text-emerald-950/55">Cidade</span>
          <FilterButton
            active={filters.city === "all"}
            onClick={() => updateFilters({ city: "all" })}
          >
            Todas
          </FilterButton>
          {CITY_OPTIONS.map((city) => (
            <FilterButton
              key={city}
              active={filters.city === city}
              onClick={() => updateFilters({ city })}
            >
              {city}
            </FilterButton>
          ))}
        </div>

        <div
          role="group"
          aria-label="Período"
          className="flex shrink-0 items-center gap-1.5 border-l border-emerald-950/10 p-1.25 pl-2.5 text-xs"
        >
          <span className="mr-1 text-[11px] text-emerald-950/55">Período</span>
          {periodOptions.map((option) => (
            <FilterButton
              key={String(option.value)}
              active={filters.days === option.value}
              onClick={() => updateFilters({ days: option.value })}
            >
              {option.label}
            </FilterButton>
          ))}
        </div>

        <span className="flex min-h-11.5 shrink-0 items-center gap-1.25 p-1.25 text-xs text-emerald-950/78">
          <FlaskConical
            aria-hidden="true"
            className="h-3.5 w-3.5 text-emerald-950/60"
          />
          Dados simulados
        </span>

        <div
          className="shrink-0 self-center p-1.25 text-xs text-emerald-950/65"
          aria-live="polite"
          aria-atomic="true"
        >
          <strong className="font-semibold text-emerald-950">
            {filteredPoints}
          </strong>{" "}
          / {totalPoints} pontos
        </div>
      </div>
    </section>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 shrink-0 items-center justify-center rounded-full border px-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 motion-reduce:transition-none",
        active
          ? "border-emerald-900 bg-emerald-900 text-white"
          : "border-emerald-950/10 bg-white/80 text-emerald-950 hover:bg-white",
      )}
    >
      <span className="font-semibold">{children}</span>
    </button>
  );
}
