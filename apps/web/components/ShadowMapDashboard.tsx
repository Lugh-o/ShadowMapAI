"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Info,
  MapPinned,
  Trees,
  X,
} from "lucide-react";

import FiltersBar from "@/components/FiltersBar";
import Legend from "@/components/Legend";
import Sidebar from "@/components/Sidebar";
import { cn, derivePriority, sortPointsByCriticality } from "@/lib/utils";
import type {
  FiltersState,
  HeatZone,
  PointFeature,
  PointFormValues,
} from "@shadowmap/types";

const DynamicMapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[64svh] items-center justify-center rounded-[28px] bg-[rgba(255,255,255,0.52)] text-sm text-emerald-950/70">
      Carregando mapa interativo...
    </div>
  ),
});

const TOUR_STORAGE_KEY = "shadowmap-tour-completed";

const initialFilters: FiltersState = {
  city: "Salvador",
  issueType: "all",
  priority: "all",
};

const tourSteps = [
  {
    id: "mapa",
    title: "Mapa interativo",
    description:
      "No celular, o mapa fica livre para toque, arraste, zoom e seleção de pontos.",
  },
  {
    id: "filtros",
    title: "Filtros rápidos",
    description:
      "Use cidade, tipo de ocorrência e criticidade para reduzir o conjunto analisado.",
  },
  {
    id: "dados",
    title: "Dados simulados",
    description:
      "Todos os pontos e zonas deste mapa são simulados para demonstração. Eles não representam medições reais nem relatos de moradores.",
  },
  {
    id: "cadastro",
    title: "Clique para simular um cadastro",
    description:
      "Toque no mapa para capturar latitude e longitude e abrir o formulário no painel lateral. O ponto é adicionado apenas à tela desta sessão: nada é salvo.",
  },
  {
    id: "sobre",
    title: "Sobre a demonstração",
    description:
      "O botão ao lado do selo explica o objetivo da amostra visual, sem login e sem persistência de dados.",
  },
];

const comparisonRows = [
  {
    topic: "Origem dos dados",
    original: "Banco de dados e relatos reais de moradores",
    current:
      "Arquivo local de demonstração com pontos e zonas marcados como SIMULADO",
  },
  {
    topic: "Acesso",
    original: "Login por e-mail/senha e Google",
    current: "Sem login: o mapa é público e abre direto na demonstração",
  },
  {
    topic: "Cadastro de ponto",
    original: "Persistido no banco e enviado para moderação",
    current:
      "Simulado apenas na tela desta sessão; nada é enviado nem salvo",
  },
  {
    topic: "Mapa",
    original: "Camadas CARTO com chave de API",
    current: "OpenStreetMap, que não exige chave de API",
  },
  {
    topic: "Escopo",
    original: "Região Metropolitana de Salvador",
    current: "Recorte visual das ilhas de calor em Salvador",
  },
];

interface ShadowMapDashboardProps {
  initialPoints: PointFeature[];
  initialHeatZones: HeatZone[];
}

export default function ShadowMapDashboard({
  initialPoints,
  initialHeatZones,
}: ShadowMapDashboardProps) {
  const [points, setPoints] = useState(initialPoints);
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(
    initialPoints[0]?.id ?? null,
  );
  const [draftLocation, setDraftLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [draftValues, setDraftValues] = useState<Partial<PointFormValues> | null>(
    null,
  );
  const [aiAssisted, setAiAssisted] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [showSimulated, setShowSimulated] = useState(true);
  const [submitMessage, setSubmitMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const hasCompletedTour =
        window.localStorage.getItem(TOUR_STORAGE_KEY) === "1";

      if (!hasCompletedTour) {
        setIsTourOpen(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const simulatedCount = points.length;

  const originPoints = showSimulated ? points : [];

  const filteredPoints = originPoints.filter((point) => {
    const matchesCity = filters.city === "all" || point.city === filters.city;
    const matchesIssue =
      filters.issueType === "all" || point.issueType === filters.issueType;
    const matchesPriority =
      filters.priority === "all" || point.priority === filters.priority;

    return matchesCity && matchesIssue && matchesPriority;
  });

  const visibleHeatZones = showSimulated
    ? initialHeatZones.filter(
        (zone) => filters.city === "all" || zone.city === filters.city,
      )
    : [];

  const effectiveSelectedPointId = filteredPoints.some(
    (point) => point.id === selectedPointId,
  )
    ? selectedPointId
    : filteredPoints[0]?.id ?? null;

  const selectedPoint =
    points.find((point) => point.id === effectiveSelectedPointId) ?? null;
  const criticalPoints = sortPointsByCriticality(filteredPoints).slice(0, 5);
  const criticalCount = filteredPoints.filter(
    (point) => point.priority === "critical",
  ).length;

  const originLabel = showSimulated ? "simulados" : "dados ocultos";

  function handlePointSubmit(
    values: PointFormValues,
    submittedWithAi: boolean,
  ) {
    setSubmitMessage(null);

    const created: PointFeature = {
      id: `sim-${Date.now()}`,
      ...values,
      neighborhood: values.neighborhood.trim(),
      description: values.description.trim(),
      priority: derivePriority(values.heatLevel, values.shadeLevel),
      moderationStatus: "approved",
      dataOrigin: "simulated",
      aiAssisted: submittedWithAi,
      submittedAt: new Date().toISOString(),
    };

    setPoints((current) => [created, ...current]);
    setFilters((current) => ({ ...current, city: created.city }));
    setShowSimulated(true);
    setSelectedPointId(created.id);
    setDraftLocation(null);
    setDraftValues(null);
    setAiAssisted(false);
    setIsFormOpen(false);
    setSubmitMessage({
      tone: "success",
      text: "Ponto simulado adicionado ao mapa desta sessão. Nenhum dado foi salvo ou enviado.",
    });
  }

  function handleMapPick(location: { lat: number; lng: number }) {
    setDraftLocation(location);
    setIsFormOpen(true);
  }

  function openManualForm() {
    setDraftValues(null);
    setAiAssisted(false);
    setFormKey((value) => value + 1);
    setIsFormOpen(true);
  }

  function closeForm() {
    setDraftLocation(null);
    setDraftValues(null);
    setAiAssisted(false);
    setIsFormOpen(false);
  }

  function closeTour() {
    window.localStorage.setItem(TOUR_STORAGE_KEY, "1");
    setIsTourOpen(false);
  }

  function reopenTour() {
    window.localStorage.removeItem(TOUR_STORAGE_KEY);
    setIsInfoOpen(false);
    setIsTourOpen(true);
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 md:px-6 md:py-6">
        <header className="glass-panel overflow-hidden rounded-[30px] p-5 md:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center rounded-full bg-emerald-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-50">
                  ShadowMap
                </span>
                <button
                  type="button"
                  onClick={() => setIsInfoOpen(true)}
                  className="relative z-[700] inline-flex min-h-11 items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-100/95 px-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-900 shadow-[0_0_0_0_rgba(110,231,183,0.4)] transition hover:bg-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 active:scale-[0.98] motion-safe:animate-pulse"
                >
                  <Info className="h-3.5 w-3.5" />
                  Mais info
                </button>
              </div>
              <div>
                <h1 className="font-display text-3xl font-semibold tracking-tight text-emerald-950 md:text-4xl">
                  Mapa demonstrativo de ilhas de calor em Salvador
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-950/72 md:text-base">
                  Amostra visual do ShadowMap AI: pontos e zonas de calor são
                  dados SIMULADOS para demonstrar a interface, sem login e sem
                  persistência.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <MetricCard
                icon={MapPinned}
                label={`Pontos (${originLabel})`}
                value={String(filteredPoints.length)}
                tone="emerald"
              />
              <MetricCard
                icon={AlertTriangle}
                label={`Críticos (${originLabel})`}
                value={String(criticalCount)}
                tone="amber"
              />
              <MetricCard
                icon={Trees}
                label="Zonas ilustrativas"
                value={String(visibleHeatZones.length)}
                tone="teal"
              />
            </div>
          </div>
        </header>

        <section className="rounded-[24px] border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
          <strong>Todos os dados desta página são simulados.</strong> Os pontos
          e as zonas de calor foram criados apenas para demonstrar a interface
          em Salvador. Eles não são medições de temperatura, não vieram de
          moradores e não são salvos em banco de dados.
        </section>

        {submitMessage ? (
          <div
            role="status"
            className={cn(
              "flex items-start justify-between gap-3 rounded-[24px] border px-4 py-3 text-sm",
              submitMessage.tone === "success"
                ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                : "border-rose-300 bg-rose-50 text-rose-900",
            )}
          >
            <p className="leading-6">{submitMessage.text}</p>
            <button
              type="button"
              onClick={() => setSubmitMessage(null)}
              className="shrink-0 rounded-full p-1 hover:bg-white/60"
              aria-label="Fechar aviso"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        <FiltersBar
          filters={filters}
          totalPoints={originPoints.length}
          filteredPoints={filteredPoints.length}
          simulatedCount={simulatedCount}
          showSimulated={showSimulated}
          onShowSimulatedChange={setShowSimulated}
          onFiltersChange={setFilters}
          onOpenForm={openManualForm}
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_420px]">
          <section className="glass-panel relative min-h-[64svh] overflow-hidden rounded-[30px] p-2 md:min-h-[62vh]">
            <DynamicMapView
              draftLocation={draftLocation}
              points={filteredPoints}
              selectedPointId={effectiveSelectedPointId}
              visibleHeatZones={visibleHeatZones}
              onMapPick={handleMapPick}
              onSelectPoint={setSelectedPointId}
            />

            <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[500] hidden md:block md:inset-x-auto md:left-3">
              <Legend
                className="pointer-events-auto"
                showSimulated={showSimulated}
              />
            </div>
          </section>

          <div className="md:hidden">
            <Legend className="max-w-none" showSimulated={showSimulated} />
          </div>

          <Sidebar
            criticalPoints={criticalPoints}
            draftLocation={draftLocation}
            draftValues={draftValues}
            aiAssisted={aiAssisted}
            formKey={formKey}
            isFormOpen={isFormOpen}
            selectedPoint={selectedPoint}
            totalPoints={originPoints.length}
            onCloseForm={closeForm}
            onOpenForm={openManualForm}
            onSelectPoint={setSelectedPointId}
            onSubmitPoint={handlePointSubmit}
          />
        </div>
      </div>

      <AboutProjectModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        onOpenTour={reopenTour}
      />

      <TourModal isOpen={isTourOpen} onClose={closeTour} />

    </main>
  );
}

interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: "emerald" | "amber" | "teal";
}

function MetricCard({ icon: Icon, label, value, tone }: MetricCardProps) {
  return (
    <div
      className={cn(
        "card-strong rounded-[24px] px-4 py-4",
        tone === "emerald" && "bg-emerald-50/80",
        tone === "amber" && "bg-amber-50/85",
        tone === "teal" && "bg-teal-50/80",
      )}
    >
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-white/85 p-2 text-emerald-950">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-950/55">
            {label}
          </p>
          <p className="mt-1 font-display text-2xl font-semibold text-emerald-950">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function AboutProjectModal({
  isOpen,
  onClose,
  onOpenTour,
}: {
  isOpen: boolean;
  onClose: () => void;
  onOpenTour: () => void;
}) {
  useOverlayBodyLock(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-emerald-950/55 p-0 backdrop-blur-sm md:items-center md:p-6">
      <div className="glass-panel flex h-[100svh] w-full flex-col overflow-hidden rounded-none p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] md:h-auto md:max-h-[88svh] md:max-w-4xl md:rounded-[28px] md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-950/55">
              Sobre a demonstração
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-emerald-950">
              O que é esta amostra
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/80 text-emerald-950 transition hover:bg-white"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 flex-1 space-y-4 overflow-y-auto pr-0 md:pr-1">
          <section className="card-strong rounded-[24px] p-4 text-sm leading-6 text-emerald-950/78">
            <p>
              O ShadowMap AI é um projeto de extensão da UCSAL sobre ilhas de
              calor e arborização urbana em Salvador. Esta versão é uma{" "}
              <strong>amostra visual</strong>: o mapa usa dados simulados e não
              há login, cadastro real, moderação ou persistência em banco.
            </p>
          </section>

          <section className="card-strong rounded-[24px] p-4">
            <h3 className="font-display text-lg font-semibold text-emerald-950">
              O que muda nesta demonstração
            </h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-left text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-[0.14em] text-emerald-950/55">
                    <th className="border-b border-emerald-950/10 py-2 pr-3">
                      Tema
                    </th>
                    <th className="border-b border-emerald-950/10 py-2 pr-3">
                      Versão completa
                    </th>
                    <th className="border-b border-emerald-950/10 py-2">
                      Esta amostra
                    </th>
                  </tr>
                </thead>
                <tbody className="text-emerald-950/78">
                  {comparisonRows.map((row) => (
                    <tr key={row.topic} className="align-top">
                      <th className="border-b border-emerald-950/10 py-3 pr-3 font-semibold text-emerald-950">
                        {row.topic}
                      </th>
                      <td className="border-b border-emerald-950/10 py-3 pr-3">
                        {row.original}
                      </td>
                      <td className="border-b border-emerald-950/10 py-3">
                        {row.current}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-[24px] border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            <strong>Dados marcados como SIMULADO servem apenas para demonstração.</strong>{" "}
            Eles não foram enviados por moradores, não representam medições de
            temperatura e não são gravados em nenhum banco de dados.
          </section>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onOpenTour}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              Abrir guia do MVP
            </button>
            <Link
              href="/privacidade"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-emerald-100 px-4 text-center text-sm font-semibold text-emerald-900 transition hover:bg-emerald-200"
            >
              Política de privacidade
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function TourModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);

  useOverlayBodyLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    const timer = window.setTimeout(() => {
      setStepIndex(0);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const currentStep = tourSteps[stepIndex];

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center bg-emerald-950/55 p-3 backdrop-blur-sm md:items-center md:p-6">
      <div className="glass-panel flex max-h-[100svh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] md:max-h-[88svh] md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-950/55">
              Primeiro acesso
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-emerald-950">
              Tour guiado do ShadowMap
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/80 text-emerald-950 transition hover:bg-white"
            aria-label="Fechar guia"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          {tourSteps.map((step, index) => (
            <span
              key={step.id}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                index <= stepIndex ? "bg-emerald-800" : "bg-emerald-200",
              )}
            />
          ))}
        </div>

        <div className="mt-5 shrink-0 rounded-[24px] bg-white/82 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-950/50">
            Etapa {stepIndex + 1} de {tourSteps.length}
          </p>
          <h3 className="mt-1 font-display text-xl font-semibold text-emerald-950">
            {currentStep.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-emerald-950/76">
            {currentStep.description}
          </p>
        </div>

        <div className="mt-4 grid gap-3 overflow-y-auto pr-0 md:pr-1">
          {tourSteps.map((step, index) => (
            <button
              key={step.id}
              type="button"
              onClick={() => setStepIndex(index)}
              className={cn(
                "rounded-[20px] border px-4 py-4 text-left transition",
                stepIndex === index
                  ? "border-emerald-400 bg-emerald-50"
                  : "border-emerald-950/10 bg-white/70 hover:bg-white",
              )}
            >
              <p className="font-semibold text-emerald-950">{step.title}</p>
              <p className="mt-1 text-sm leading-6 text-emerald-950/72">
                {step.description}
              </p>
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStepIndex((value) => Math.max(0, value - 1))}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-emerald-950/10 bg-white/80 px-4 text-sm font-semibold text-emerald-950 disabled:opacity-40"
              disabled={stepIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </button>

            <button
              type="button"
              onClick={() =>
                setStepIndex((value) =>
                  Math.min(tourSteps.length - 1, value + 1),
                )
              }
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-emerald-900 px-4 text-sm font-semibold text-white disabled:opacity-40"
              disabled={stepIndex === tourSteps.length - 1}
            >
              Próximo
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-100 px-4 text-sm font-semibold text-emerald-900"
          >
            Encerrar guia
          </button>
        </div>
      </div>
    </div>
  );
}

function useOverlayBodyLock(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);
}
