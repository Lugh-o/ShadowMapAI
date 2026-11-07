import { Filter, Plus, RotateCcw } from "lucide-react";

import {
  CITY_OPTIONS,
  getIssueTypeLabel,
  getPriorityLabel,
  ISSUE_OPTIONS,
  PRIORITY_OPTIONS,
} from "@/lib/utils";
import type { FiltersState } from "@shadowmap/types";

interface FiltersBarProps {
  filters: FiltersState;
  totalPoints: number;
  filteredPoints: number;
  simulatedCount: number;
  showSimulated: boolean;
  onShowSimulatedChange: (value: boolean) => void;
  onFiltersChange: (filters: FiltersState) => void;
  onOpenForm: () => void;
  onClearFilters: () => void;
}

const selectClassName =
  "h-9 w-full min-w-0 rounded-lg border border-emerald-950/10 bg-white/75 p-[5px] text-emerald-950 outline-none transition focus:border-emerald-700 focus:bg-white";

export default function FiltersBar({
  filters,
  totalPoints,
  filteredPoints,
  simulatedCount,
  showSimulated,
  onShowSimulatedChange,
  onFiltersChange,
  onOpenForm,
  onClearFilters,
}: FiltersBarProps) {
  return (
    <section
      aria-label="Filtros do mapa"
      className="glass-panel m-0 flex h-16 min-w-0 items-center gap-1 rounded-2xl p-1.25 text-sm"
    >
      <div className="relative min-w-0 flex-1 overflow-x-auto overflow-y-hidden [scrollbar-width:thin]">
        <div className="flex min-h-11.5 w-max min-w-full shrink-0 flex-nowrap items-center whitespace-nowrap">
          <div className="hidden shrink-0 items-center justify-center p-1.25 sm:flex">
            <Filter
              aria-hidden="true"
              className="h-4 w-4 text-emerald-950/60"
            />
          </div>
          <label className="flex w-36 shrink-0 items-center p-1.25 sm:w-44">
            <span className="sr-only">Cidade</span>
            <select
              className={selectClassName}
              value={filters.city}
              onChange={(event) =>
                onFiltersChange({
                  ...filters,
                  city: event.target.value as FiltersState["city"],
                })
              }
            >
              <option value="all">Todas as cidades</option>
              {CITY_OPTIONS.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </label>

          <label className="flex w-60 shrink-0 items-center p-1.25">
            <span className="sr-only">Tipo de ocorrência</span>
            <select
              className={selectClassName}
              value={filters.issueType}
              onChange={(event) =>
                onFiltersChange({
                  ...filters,
                  issueType: event.target.value as FiltersState["issueType"],
                })
              }
            >
              <option value="all">Todos os tipos</option>
              {ISSUE_OPTIONS.map((issueType) => (
                <option key={issueType} value={issueType}>
                  {getIssueTypeLabel(issueType)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex w-40 shrink-0 items-center p-1.25">
            <span className="sr-only">Criticidade</span>
            <select
              className={selectClassName}
              value={filters.priority}
              onChange={(event) =>
                onFiltersChange({
                  ...filters,
                  priority: event.target.value as FiltersState["priority"],
                })
              }
            >
              <option value="all">Todos os níveis</option>
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority} value={priority}>
                  {getPriorityLabel(priority)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-h-11.5 shrink-0 cursor-pointer items-center gap-1.25 p-1.25 text-xs text-emerald-950/78">
            <input
              type="checkbox"
              className="h-4 w-4 accent-emerald-800"
              checked={showSimulated}
              onChange={(event) => onShowSimulatedChange(event.target.checked)}
            />
            <span>Dados simulados</span>
          </label>

          <div
            className="shrink-0 self-center p-1.25 text-xs text-emerald-950/65"
            title={`${simulatedCount} pontos simulados no total`}
          >
            <strong className="font-semibold text-emerald-950">
              {filteredPoints}
            </strong>{" "}
            / {totalPoints} pontos
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 border-l border-emerald-950/10 p-1.25 text-xs">
        <button
          type="button"
          onClick={onClearFilters}
          aria-label="Limpar filtros"
          title="Limpar filtros"
          disabled={
            filters.city === "all" &&
            filters.issueType === "all" &&
            filters.priority === "all" &&
            showSimulated
          }
          className="inline-flex h-9 min-w-8 items-center justify-center gap-1.5 rounded-lg px-1.5 text-emerald-950/70 transition-colors hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-emerald-700 disabled:cursor-default disabled:opacity-35 motion-reduce:transition-none sm:px-2"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Limpar</span>
        </button>
        <button
          type="button"
          onClick={onOpenForm}
          className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-emerald-900 py-1.25 pl-2 pr-3 text-white transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="font-semibold whitespace-nowrap">Novo ponto</span>
        </button>
      </div>
    </section>
  );
}
