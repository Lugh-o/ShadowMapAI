"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useId, useState } from "react";

import type { NeighborhoodRank } from "@/lib/dashboard";

export default function RankingTable({
  ranking,
}: {
  ranking: NeighborhoodRank[];
}) {
  const [expanded, setExpanded] = useState(false);
  const bodyId = useId();
  const visibleRanking = expanded ? ranking : ranking.slice(0, 5);
  const hasSmallSample = ranking.some((row) => row.smallSample);

  return (
    <section
      aria-label="Ranking de bairros"
      className="card-strong min-w-0 rounded-3xl p-4 md:p-5"
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-base font-semibold text-emerald-950">
            Ranking de bairros
          </h2>
          <p className="mt-1 text-xs text-emerald-950/60">
            Até 10 bairros por pontuação de urgência.
          </p>
        </div>
        <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-medium text-emerald-900">
          {ranking.length} {ranking.length === 1 ? "bairro" : "bairros"}
        </span>
      </header>

      <details className="mt-2 text-xs text-emerald-950/70">
        <summary className="w-fit cursor-pointer rounded-sm py-1 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
          Como é calculado
        </summary>
        <p className="mt-1 leading-5">
          A pontuação soma os pesos dos pontos simulados de cada bairro: crítica
          = 4, alta = 3, média = 2 e baixa = 1. Não é um índice de 0 a 100 nem
          uma medição de temperatura. Variações de grafia do mesmo bairro são
          agrupadas.
        </p>
      </details>

      {hasSmallSample ? (
        <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] leading-4 text-amber-950">
          <strong>Amostra pequena:</strong> bairros com menos de 3 pontos devem
          ser interpretados com cautela.
        </p>
      ) : null}

      {ranking.length === 0 ? (
        <p className="mt-3 text-sm text-emerald-950/60">
          Nenhum ponto no período selecionado.
        </p>
      ) : (
        <table className="mt-2 w-full table-fixed border-collapse text-left text-xs sm:text-sm">
          <thead>
            <tr className="text-[10px] font-medium text-emerald-950/55 sm:text-[11px]">
              <th
                scope="col"
                className="w-1/2 border-b border-emerald-950/10 py-2 pr-2 sm:w-[46%]"
              >
                Bairro
              </th>
              <th
                scope="col"
                className="w-[24%] border-b border-emerald-950/10 py-2 pr-2 text-right sm:w-[16%]"
              >
                Pontos
              </th>
              <th
                scope="col"
                className="hidden w-1/5 border-b border-emerald-950/10 py-2 pr-2 text-right sm:table-cell"
              >
                Altos + críticos
              </th>
              <th
                scope="col"
                className="w-[26%] border-b border-emerald-950/10 py-2 text-right sm:w-[18%]"
              >
                Pontuação
              </th>
            </tr>
          </thead>
          <tbody id={bodyId} className="text-emerald-950/80">
            {visibleRanking.map((row) => (
              <tr key={row.key} className="align-top">
                <th
                  scope="row"
                  className="border-b border-emerald-950/8 py-2 pr-2 text-left font-normal"
                >
                  <p className="break-words font-semibold leading-5 text-emerald-950">
                    {row.name}
                  </p>
                  <p className="mt-0.5 text-[10px] font-normal leading-4 text-emerald-950/55 sm:text-[11px]">
                    {row.city}
                    <span className="sm:hidden">
                      {" "}
                      · {row.highCritical}{" "}
                      {row.highCritical === 1
                        ? "alto/crítico"
                        : "altos/críticos"}
                    </span>
                  </p>
                </th>
                <td className="border-b border-emerald-950/8 py-2 pr-2 text-right">
                  <p className="font-semibold leading-5 text-emerald-950">
                    {row.count}
                  </p>
                </td>
                <td className="hidden border-b border-emerald-950/8 py-2 pr-2 text-right leading-5 sm:table-cell">
                  {row.highCritical}
                </td>
                <td className="border-b border-emerald-950/8 py-2 text-right font-semibold leading-5 text-emerald-950">
                  {row.score}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {ranking.length > 5 ? (
        <footer className="mt-2 flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
          <p className="text-[11px] text-emerald-950/55">
            {visibleRanking.length} de {ranking.length} bairros
          </p>
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={bodyId}
            onClick={() => setExpanded((value) => !value)}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl px-2.5 text-emerald-900 transition-colors hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-emerald-700 motion-reduce:transition-none"
          >
            <span className="font-semibold">
              {expanded
                ? "Mostrar menos"
                : `Ver todos os ${ranking.length} bairros`}
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
