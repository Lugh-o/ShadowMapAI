"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useId, useState } from "react";

import type { RecentPoint } from "@/lib/dashboard";
import { formatAppDate } from "@/lib/dates";
import {
  getIssueTypeLabel,
  getPointPriorityColor,
  getPriorityLabel,
} from "@/lib/utils";

export default function RecentPoints({ points }: { points: RecentPoint[] }) {
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
  const visiblePoints = expanded ? points : points.slice(0, 5);

  return (
    <section
      aria-label="Pontos recentes"
      className="card-strong min-w-0 rounded-3xl p-4 md:p-5"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-1.5">
        <h2 className="font-display text-base font-semibold text-emerald-950">
          Pontos recentes
        </h2>
        <p className="text-[11px] text-emerald-950/55">
          Simulados · mais recentes primeiro
        </p>
      </header>

      {points.length === 0 ? (
        <p className="mt-3 text-sm text-emerald-950/60">
          Nenhum ponto no período selecionado.
        </p>
      ) : (
        <ul id={listId} className="mt-2 divide-y divide-emerald-950/10">
          {visiblePoints.map((point) => (
            <li
              key={point.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="break-words text-sm font-semibold leading-5 text-emerald-950">
                  {point.neighborhood}
                </p>
                <p className="mt-0.5 text-[11px] leading-4 text-emerald-950/60">
                  {point.city} · {getIssueTypeLabel(point.issueType)}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-950">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      backgroundColor: getPointPriorityColor(point.priority),
                    }}
                    aria-hidden="true"
                  />
                  {getPriorityLabel(point.priority)}
                </span>
                <time
                  dateTime={point.createdAt}
                  className="mt-1 block text-[10px] text-emerald-950/55"
                >
                  {formatAppDate(point.createdAt)}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}

      {points.length > 5 ? (
        <footer className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-emerald-950/10 pt-2 text-xs">
          <p className="text-[11px] text-emerald-950/55">
            {visiblePoints.length} de {points.length} pontos
          </p>
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={listId}
            onClick={() => setExpanded((value) => !value)}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl px-2.5 text-emerald-900 transition-colors hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-emerald-700 motion-reduce:transition-none"
          >
            <span className="font-semibold">
              {expanded
                ? "Mostrar menos"
                : `Ver os ${points.length} mais recentes`}
            </span>
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
        </footer>
      ) : null}
    </section>
  );
}
