import type { Metadata } from "next";
import Link from "next/link";

import DailyChart from "@/components/dashboard/DailyChart";
import DashboardFilters from "@/components/dashboard/DashboardFilters";
import DistributionBars from "@/components/dashboard/DistributionBars";
import PilotPanel from "@/components/dashboard/PilotPanel";
import RankingTable from "@/components/dashboard/RankingTable";
import { auth } from "@/auth";
import {
  getDashboardData,
  parseDashboardParams,
  type RecentPoint,
} from "@/lib/dashboard";
import { getPilotData } from "@/lib/pilot";
import { getIssueTypeLabel, getPriorityLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Painel | ShadowMap",
  description:
    "Relatos aprovados de calor urbano e arborização na Região Metropolitana de Salvador.",
};

interface DashboardPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("pt-BR");
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const resolvedSearchParams = await searchParams;
  const filters = parseDashboardParams({
    origin: firstParam(resolvedSearchParams.origin),
    city: firstParam(resolvedSearchParams.city),
    days: firstParam(resolvedSearchParams.days),
  });

  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase() ?? "";
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin = Boolean(email) && adminEmails.includes(email);

  const data = await getDashboardData({ ...filters, includePending: isAdmin });
  const pilotData = isAdmin ? await getPilotData() : null;

  const hasNoCollected = filters.origin === "collected" && data.collectedCount === 0;
  const hasNoFilteredData = data.totals.approved === 0;

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-4 md:px-6 md:py-6">
        <header className="glass-panel rounded-[30px] p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex items-center rounded-full bg-emerald-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-50">
                Painel público
              </span>
              <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-emerald-950 md:text-4xl">
                Calor urbano e arborização em números
              </h1>
              <p className="mt-2 text-sm leading-6 text-emerald-950/72 md:text-base">
                Agregados dos relatos aprovados pela equipe do ShadowMap AI,
                projeto de extensão da UCSAL na Região Metropolitana de Salvador.
              </p>
            </div>

            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-emerald-100 px-4 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-200"
            >
              Voltar ao mapa
            </Link>
          </div>

          <p className="mt-4 rounded-[20px] border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
            Estes números vêm de relatos enviados pelos usuários e aprovados
            pela equipe. Não são medições de temperatura.
          </p>
        </header>

        <DashboardFilters filters={filters} />

        {isAdmin && pilotData ? <PilotPanel data={pilotData} /> : null}

        {hasNoCollected ? (
          <EmptyState
            title="Ainda não há relatos coletados."
            description="Quando os primeiros relatos forem aprovados, este painel mostrará os agregados por bairro, tipo de ocorrência e período."
          />
        ) : hasNoFilteredData ? (
          <EmptyState
            title="Nenhum relato aprovado com os filtros atuais."
            description="Ajuste a origem, a cidade ou o período para ver outros resultados."
          />
        ) : (
          <>
            {filters.origin === "all" && data.collectedCount === 0 ? (
              <div className="rounded-[24px] border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
                Ainda não há relatos coletados. Os números abaixo incluem dados
                simulados, sempre identificados com o selo SIMULADO.
              </div>
            ) : null}

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <MetricCard label="Relatos aprovados" value={data.totals.approved} />
              <MetricCard
                label="Críticos + altos"
                value={data.totals.highCritical}
              />
              <MetricCard
                label="Bairros com relatos"
                value={data.totals.neighborhoods}
              />
              <MetricCard
                label="Com apoio da IA"
                value={`${data.totals.aiAssistedPercent}%`}
              />
              {isAdmin ? (
                <MetricCard
                  label="Pendentes de moderação"
                  value={data.totals.pending ?? 0}
                  hint="Visível apenas para admin"
                />
              ) : null}
            </section>

            <RankingTable ranking={data.ranking} />

            <section className="grid gap-4 lg:grid-cols-3">
              <DistributionBars
                title="Por tipo de ocorrência"
                items={data.distributions.issueType}
              />
              <DistributionBars
                title="Por nível de calor"
                items={data.distributions.heatLevel}
              />
              <DistributionBars
                title="Por nível de sombra"
                items={data.distributions.shadeLevel}
              />
            </section>

            <DailyChart data={data.daily} />

            <RecentReports points={data.recent} />
          </>
        )}
      </div>
    </main>
  );
}

function MetricCard({
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

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="glass-panel rounded-[28px] p-5 md:p-6">
      <h2 className="font-display text-xl font-semibold text-emerald-950">
        {title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-950/70">
        {description}
      </p>
      <Link
        href="/"
        className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-900 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800"
      >
        Ir para o mapa
      </Link>
    </section>
  );
}

function RecentReports({ points }: { points: RecentPoint[] }) {
  return (
    <section className="card-strong rounded-[24px] p-4 md:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="font-display text-lg font-semibold text-emerald-950">
          Últimos 10 relatos
        </h3>
        <p className="text-xs text-emerald-950/55">
          Aprovados, mais recentes primeiro
        </p>
      </div>

      {points.length === 0 ? (
        <p className="mt-3 text-sm text-emerald-950/60">
          Nenhum relato aprovado no período selecionado.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-emerald-950/10">
          {points.map((point) => (
            <li
              key={point.id}
              className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-emerald-950">
                  {point.neighborhood}
                </p>
                <p className="text-xs text-emerald-950/55">{point.city}</p>
              </div>

              <div className="text-sm text-emerald-950/75">
                <p>{getIssueTypeLabel(point.issueType)}</p>
                <p className="text-xs text-emerald-950/55">
                  Prioridade: {getPriorityLabel(point.priority)}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-emerald-950/60">
                <span>{formatDate(point.createdAt)}</span>
                {point.dataOrigin === "simulated" ? (
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-700">
                    Simulado
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
