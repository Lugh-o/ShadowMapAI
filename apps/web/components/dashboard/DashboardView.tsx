"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { ArrowLeft, FlaskConical } from "lucide-react";

import { useDemoSession } from "@/components/DemoSessionProvider";
import DailyChart from "@/components/dashboard/DailyChart";
import DashboardFilters from "@/components/dashboard/DashboardFilters";
import DashboardDistributions from "@/components/dashboard/DashboardDistributions";
import RankingTable from "@/components/dashboard/RankingTable";
import RecentPoints from "@/components/dashboard/RecentPoints";
import { getDashboardData, parseDashboardParams } from "@/lib/dashboard";

export default function DashboardView() {
  const searchParams = useSearchParams();
  const { session, setSession } = useDemoSession();
  const hasUrlFilters = searchParams.has("city") || searchParams.has("days");
  const filters = parseDashboardParams({
    city: hasUrlFilters ? searchParams.get("city") : session.dashboardFilters.city,
    days: hasUrlFilters
      ? searchParams.get("days")
      : String(session.dashboardFilters.days),
  });

  const data = useMemo(
    () =>
      getDashboardData(
        { city: filters.city, days: filters.days },
        session.points,
      ),
    [filters.city, filters.days, session.points],
  );

  useEffect(() => {
    // Snapshot even the initial entry before later changes can overwrite the
    // session fallback. Back/Forward then always have their own filter values.
    if (!searchParams.has("city") || !searchParams.has("days")) {
      const url = new URL(window.location.href);
      url.searchParams.set("city", filters.city);
      url.searchParams.set("days", String(filters.days));
      window.history.replaceState(null, "", url);
    }
    setSession((current) =>
      current.dashboardFilters.city === filters.city &&
      current.dashboardFilters.days === filters.days
        ? current
        : {
            ...current,
            dashboardFilters: { city: filters.city, days: filters.days },
          },
    );
  }, [filters.city, filters.days, searchParams, setSession]);

  const hasNoFilteredData = data.totals.approved === 0;
  const highCriticalPercent = data.totals.approved
    ? Math.round((data.totals.highCritical / data.totals.approved) * 100)
    : 0;
  const filterKey = `${filters.city}:${filters.days}`;

  return (
    <main id="conteudo-principal" tabIndex={-1} className="min-h-screen">
      <div className="mx-auto flex max-w-[1400px] min-w-0 flex-col gap-3 px-4 py-4 md:gap-4 md:px-6 md:py-5">
        <header className="glass-panel rounded-3xl p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-950/55">
                Painel demonstrativo
              </p>
              <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-emerald-950 md:text-3xl">
                Calor urbano em números
              </h1>
              <p className="mt-1 text-sm leading-5 text-emerald-950/70">
                Explore os indicadores por cidade e período.
              </p>
            </div>

            <Link
              href="/"
              aria-label="Voltar ao mapa"
              className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-emerald-100 px-3 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-200"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="sm:hidden">Mapa</span>
              <span className="hidden sm:inline">Voltar ao mapa</span>
            </Link>
          </div>

          <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs leading-5 text-amber-950">
            <FlaskConical
              className="mt-0.5 h-3.5 w-3.5 shrink-0"
              aria-hidden="true"
            />
            <p>
              <strong>Dados simulados.</strong> Valores ilustrativos, sem
              medições de temperatura ou relatos reais.
            </p>
          </div>
        </header>

        <DashboardFilters
          filters={filters}
          filteredPoints={data.totals.approved}
          totalPoints={session.points.length}
        />

        {hasNoFilteredData ? (
          <EmptyState
            title="Nenhum ponto simulado com os filtros atuais."
            description="Ajuste a cidade ou o período para ver outros resultados."
          />
        ) : (
          <>
            <section
              aria-label="Indicadores do painel"
              className="grid min-w-0 grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4"
            >
              <MetricCard
                label="Pontos simulados"
                value={data.totals.approved}
              />
              <MetricCard
                label="Críticos + altos"
                value={data.totals.highCritical}
              />
              <MetricCard label="Bairros" value={data.totals.neighborhoods} />
              <MetricCard
                label="Altos/críticos (%)"
                value={`${highCriticalPercent}%`}
              />
            </section>

            <DashboardDistributions distributions={data.distributions} />

            <DailyChart
              key={`daily:${filterKey}`}
              data={data.daily}
              period={filters.days}
            />

            <RankingTable key={`ranking:${filterKey}`} ranking={data.ranking} />

            <RecentPoints key={`recent:${filterKey}`} points={data.recent} />
          </>
        )}
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="card-strong min-w-0 rounded-2xl bg-emerald-50/80 p-3">
      <p className="text-[10px] font-medium leading-4 text-emerald-950/60 sm:text-[11px]">
        {label}
      </p>
      <p className="mt-1 font-display text-xl font-semibold text-emerald-950 sm:text-2xl">
        {value}
      </p>
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
