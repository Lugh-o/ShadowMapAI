import { Filter, MapPinPlus } from "lucide-react";

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
  collectedCount: number;
  simulatedCount: number;
  showSimulated: boolean;
  onShowSimulatedChange: (value: boolean) => void;
  onFiltersChange: (filters: FiltersState) => void;
  onOpenForm: () => void;
}

const selectClassName =
  "h-11 rounded-2xl border border-emerald-950/10 bg-white/75 px-4 text-sm text-emerald-950 shadow-sm outline-none transition focus:border-emerald-700 focus:bg-white";

export default function FiltersBar({
  filters,
  totalPoints,
  filteredPoints,
  collectedCount,
  simulatedCount,
  showSimulated,
  onShowSimulatedChange,
  onFiltersChange,
  onOpenForm,
}: FiltersBarProps) {
  return (
    <section className="glass-panel rounded-[28px] p-4 md:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap">
          <label className="flex min-w-[190px] flex-col gap-2">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-950/60">
              <Filter className="h-4 w-4" />
              Cidade
            </span>
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

          <label className="flex min-w-[220px] flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-950/60">
              Tipo de ocorrência
            </span>
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

          <label className="flex min-w-[200px] flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-950/60">
              Criticidade
            </span>
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
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl border border-emerald-950/10 bg-white/72 px-4 py-2 text-sm text-emerald-950/78">
            <input
              type="checkbox"
              className="h-4 w-4 accent-emerald-800"
              checked={showSimulated}
              onChange={(event) => onShowSimulatedChange(event.target.checked)}
            />
            <span className="leading-5">
              Mostrar dados de demonstração (simulados)
            </span>
          </label>

          <div className="rounded-[22px] bg-white/72 px-4 py-3 text-sm text-emerald-950/72">
            <strong className="font-semibold text-emerald-950">
              {filteredPoints}
            </strong>{" "}
            de {totalPoints} pontos visíveis · {collectedCount} coletados ·{" "}
            {simulatedCount} simulados
          </div>

          <button
            type="button"
            onClick={onOpenForm}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            <MapPinPlus className="h-4 w-4" />
            Adicionar ponto
          </button>
        </div>
      </div>
    </section>
  );
}
