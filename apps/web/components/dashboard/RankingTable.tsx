import type { NeighborhoodRank } from "@/lib/dashboard";

interface RankingTableProps {
  ranking: NeighborhoodRank[];
}

export default function RankingTable({ ranking }: RankingTableProps) {
  return (
    <section className="card-strong rounded-[24px] p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-emerald-950">
            Ranking de bairros
          </h3>
          <p className="mt-1 text-sm text-emerald-950/65">
            Top 10 por pontuação de urgência dos relatos aprovados.
          </p>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
          {ranking.length} bairro(s)
        </span>
      </div>

      <details className="mt-3 rounded-2xl border border-emerald-950/10 bg-white/70 px-4 py-3 text-sm text-emerald-950/75">
        <summary className="cursor-pointer font-semibold text-emerald-950">
          Como é calculado
        </summary>
        <p className="mt-2 leading-6">
          A pontuação de urgência soma o peso de cada relato aprovado do bairro:
          crítica = 4, alta = 3, média = 2 e baixa = 1. Não é um índice
          normalizado de 0 a 100 e não usa medições de temperatura. Bairros com
          menos de 3 relatos recebem o selo{" "}
          <strong>amostra pequena — interpretar com cautela</strong>. Variações
          de grafia do mesmo bairro são agrupadas.
        </p>
      </details>

      {ranking.length === 0 ? (
        <p className="mt-4 text-sm text-emerald-950/60">
          Nenhum relato aprovado no período selecionado.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.14em] text-emerald-950/55">
                <th className="border-b border-emerald-950/10 py-2 pr-3">
                  Bairro
                </th>
                <th className="border-b border-emerald-950/10 py-2 pr-3">
                  Cidade
                </th>
                <th className="border-b border-emerald-950/10 py-2 pr-3 text-right">
                  Relatos
                </th>
                <th className="border-b border-emerald-950/10 py-2 pr-3 text-right">
                  Críticos + altos
                </th>
                <th className="border-b border-emerald-950/10 py-2 text-right">
                  Pontuação
                </th>
              </tr>
            </thead>
            <tbody className="text-emerald-950/80">
              {ranking.map((row) => (
                <tr key={row.key} className="align-top">
                  <td className="border-b border-emerald-950/10 py-3 pr-3">
                    <p className="font-semibold text-emerald-950">{row.name}</p>
                    {row.smallSample ? (
                      <span className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-900">
                        Amostra pequena — interpretar com cautela
                      </span>
                    ) : null}
                  </td>
                  <td className="border-b border-emerald-950/10 py-3 pr-3">
                    {row.city}
                  </td>
                  <td className="border-b border-emerald-950/10 py-3 pr-3 text-right font-semibold text-emerald-950">
                    {row.count}
                  </td>
                  <td className="border-b border-emerald-950/10 py-3 pr-3 text-right">
                    {row.highCritical}
                  </td>
                  <td className="border-b border-emerald-950/10 py-3 text-right font-semibold text-emerald-950">
                    {row.score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
