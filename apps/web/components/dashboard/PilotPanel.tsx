import { Download } from "lucide-react";

import type { PilotData } from "@/lib/pilot";

interface PilotPanelProps {
  data: PilotData;
}

export default function PilotPanel({ data }: PilotPanelProps) {
  return (
    <section className="glass-panel rounded-[28px] p-5 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-950/55">
            Uso interno
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-emerald-950">
            Piloto
          </h2>
          <p className="mt-2 text-sm leading-6 text-emerald-950/70">
            Indicadores de participação, uso do assistente e feedback. Esta
            seção aparece apenas para administradores.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <ExportLink type="points" label="Relatos (CSV)" />
          <ExportLink type="feedback" label="Feedback (CSV)" />
          <ExportLink type="conversations" label="Conversas (CSV)" />
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <PilotMetric label="Usuários ativos" value={data.activeUsers} />
        <PilotMetric label="Conversas" value={data.conversations} />
        <PilotMetric label="Mensagens" value={data.messages} />
        <PilotMetric
          label="% de 👍 no assistente"
          value={data.thumbsUpPercent === null ? "—" : `${data.thumbsUpPercent}%`}
          hint={
            data.thumbsUpPercent === null
              ? "Ainda sem avaliações"
              : "Respostas avaliadas com polegar"
          }
        />
        <PilotMetric
          label="Nota média do feedback"
          value={
            data.averageRating === null ? "—" : data.averageRating.toFixed(1)
          }
          hint={
            data.averageRating === null
              ? "Ainda sem notas de 1 a 5"
              : "Escala de 1 a 5"
          }
        />
      </div>

      <div className="mt-5">
        <h3 className="font-display text-lg font-semibold text-emerald-950">
          Por aplicador (ref)
        </h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.14em] text-emerald-950/55">
                <th className="border-b border-emerald-950/10 py-2 pr-3">
                  Aplicador
                </th>
                <th className="border-b border-emerald-950/10 py-2 pr-3">
                  Relatos
                </th>
                <th className="border-b border-emerald-950/10 py-2 pr-3">
                  Usuários distintos
                </th>
                <th className="border-b border-emerald-950/10 py-2">
                  Feedbacks
                </th>
              </tr>
            </thead>
            <tbody className="text-emerald-950/78">
              {data.refs.map((row) => (
                <tr key={row.ref}>
                  <th className="border-b border-emerald-950/10 py-2.5 pr-3 font-semibold text-emerald-950">
                    {row.ref}
                  </th>
                  <td className="border-b border-emerald-950/10 py-2.5 pr-3">
                    {row.reports}
                  </td>
                  <td className="border-b border-emerald-950/10 py-2.5 pr-3">
                    {row.users}
                  </td>
                  <td className="border-b border-emerald-950/10 py-2.5">
                    {row.feedbacks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs leading-5 text-emerald-950/55">
          Relatos incluem pendentes e aprovados. Usuários distintos são contas
          que enviaram relato, conversaram com o assistente ou deram feedback
          usando aquele <code>ref</code>.
        </p>
      </div>
    </section>
  );
}

function PilotMetric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="card-strong rounded-[24px] bg-emerald-50/80 px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-950/55">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-semibold text-emerald-950">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-emerald-950/55">{hint}</p> : null}
    </div>
  );
}

function ExportLink({
  type,
  label,
}: {
  type: "points" | "feedback" | "conversations";
  label: string;
}) {
  return (
    <a
      href={`/api/admin/export?type=${type}`}
      className="inline-flex min-h-10 items-center gap-2 rounded-2xl bg-emerald-100 px-3 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-200"
    >
      <Download className="h-3.5 w-3.5" />
      {label}
    </a>
  );
}
