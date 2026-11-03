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

import AssistantChat from "@/components/AssistantChat";
import FiltersBar from "@/components/FiltersBar";
import Legend from "@/components/Legend";
import Sidebar from "@/components/Sidebar";
import { cn, sortPointsByCriticality } from "@/lib/utils";
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
  city: "all",
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
    title: "Coletado x simulado",
    description:
      "Por padrão o mapa mostra apenas relatos coletados. Dados de demonstração só aparecem ao ligar o botão e sempre vêm marcados como SIMULADO.",
  },
  {
    id: "cadastro",
    title: "Clique para cadastrar",
    description:
      "Toque no mapa para capturar latitude e longitude e abrir o formulário no painel lateral.",
  },
  {
    id: "sobre",
    title: "Sobre o projeto",
    description:
      "O botão ao lado do selo abre o modal com o que o projeto é e o que esta disciplina acrescenta.",
  },
];

const comparisonRows = [
  {
    topic: "Registro de ocorrências",
    original: "Formulário manual (calor, sombra e prioridade escolhidos pela pessoa)",
    current:
      "Descrição em linguagem natural → IA sugere classificação → pessoa confirma",
  },
  {
    topic: "Apoio ao cidadão",
    original: "Nenhum",
    current: "Assistente conversacional com instruções de escopo e dados do projeto",
  },
  {
    topic: "Análise",
    original: "Painel de curadoria manual",
    current:
      "Dashboard com ranking transparente de bairros e indicador de amostra pequena",
  },
  {
    topic: "Qualidade dos dados",
    original: "Não tratada",
    current:
      "Validação anti-ruído (limites geográficos, duplicidade) e separação coletado/simulado",
  },
  {
    topic: "Avaliação",
    original: "—",
    current: "Feedback, uso da IA e origem por aplicador do piloto",
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
  const [points] = useState(initialPoints);
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(
    initialPoints.find((point) => point.dataOrigin === "collected")?.id ?? null,
  );
  const [draftLocation, setDraftLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [showSimulated, setShowSimulated] = useState(
    process.env.NEXT_PUBLIC_SHOW_SIMULATED_DEFAULT === "true",
  );
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

  const collectedCount = points.filter(
    (point) => point.dataOrigin === "collected",
  ).length;
  const simulatedCount = points.length - collectedCount;

  const originPoints = points.filter(
    (point) => showSimulated || point.dataOrigin === "collected",
  );

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
    originPoints.find((point) => point.id === effectiveSelectedPointId) ?? null;
  const criticalPoints = sortPointsByCriticality(filteredPoints).slice(0, 5);
  const criticalCount = filteredPoints.filter(
    (point) => point.priority === "critical",
  ).length;
  const activeCities = new Set(filteredPoints.map((point) => point.city)).size;

  const originLabel = showSimulated
    ? "coletados + simulados"
    : "somente coletados";

  async function handlePointSubmit(values: PointFormValues) {
    setSubmitMessage(null);

    try {
      const response = await fetch("/api/points", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          neighborhood: values.neighborhood.trim(),
          description: values.description.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);

        if (response.status === 401) {
          setSubmitMessage({
            tone: "error",
            text: "Entre na sua conta para enviar um relato.",
          });
          return;
        }

        if (error?.code === "DUPLICATE") {
          setSubmitMessage({
            tone: "error",
            text: "Já existe um relato parecido muito perto deste local nas últimas 24 horas.",
          });
          return;
        }

        if (error?.code === "OUT_OF_REGION") {
          setSubmitMessage({
            tone: "error",
            text: "Este local está fora da região do projeto. Marque um ponto em Salvador, Camaçari, Lauro de Freitas ou Simões Filho.",
          });
          return;
        }

        setSubmitMessage({
          tone: "error",
          text:
            error?.error ||
            "Não foi possível enviar o relato. Confira os campos e tente novamente.",
        });
        return;
      }

      // O ponto enviado fica pendente de moderação: não entra no mapa ainda.
      setDraftLocation(null);
      setIsFormOpen(false);
      setSubmitMessage({
        tone: "success",
        text: "Relato enviado! Ele ficará pendente de aprovação até ser revisado pela equipe.",
      });
    } catch {
      setSubmitMessage({
        tone: "error",
        text: "Erro de conexão. Verifique sua internet e tente novamente.",
      });
    }
  }

  function handleMapPick(location: { lat: number; lng: number }) {
    setDraftLocation(location);
    setIsFormOpen(true);
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
                  Mapeamento coletivo de calor urbano e baixa arborização
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-950/72 md:text-base">
                  Projeto de extensão da UCSAL para registrar, com a comunidade,
                  pontos de desconforto térmico em Salvador, Camaçari, Lauro de
                  Freitas e Simões Filho.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <MetricCard
                icon={MapPinned}
                label={`Relatos (${originLabel})`}
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
                label="Cidades com relatos"
                value={String(activeCities)}
                tone="teal"
              />
            </div>
          </div>
        </header>

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

        {collectedCount === 0 ? (
          <section className="glass-panel rounded-[28px] p-5 md:p-6">
            <p className="font-display text-lg font-semibold text-emerald-950">
              Ainda não há relatos coletados nesta região.
            </p>
            <p className="mt-1 text-sm leading-6 text-emerald-950/72">
              Seja a primeira pessoa a registrar um ponto.
            </p>
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-900 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              Registrar um ponto
            </button>
          </section>
        ) : null}

        <FiltersBar
          filters={filters}
          totalPoints={originPoints.length}
          filteredPoints={filteredPoints.length}
          collectedCount={collectedCount}
          simulatedCount={simulatedCount}
          showSimulated={showSimulated}
          onShowSimulatedChange={setShowSimulated}
          onFiltersChange={setFilters}
          onOpenForm={() => setIsFormOpen(true)}
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
            isFormOpen={isFormOpen}
            selectedPoint={selectedPoint}
            totalPoints={originPoints.length}
            onCloseForm={() => setIsFormOpen(false)}
            onOpenForm={() => setIsFormOpen(true)}
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

      <AssistantChat />
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
              Sobre o projeto
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-emerald-950">
              O que é o ShadowMap AI
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
              calor e arborização urbana na Região Metropolitana de Salvador.
              Moradores registram pontos de desconforto térmico e a equipe
              revisa cada relato antes de publicá-lo no mapa.
            </p>
          </section>

          <section className="card-strong rounded-[24px] p-4">
            <h3 className="font-display text-lg font-semibold text-emerald-950">
              O que esta disciplina acrescenta
            </h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-left text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-[0.14em] text-emerald-950/55">
                    <th className="border-b border-emerald-950/10 py-2 pr-3">
                      Tema
                    </th>
                    <th className="border-b border-emerald-950/10 py-2 pr-3">
                      Versão original
                    </th>
                    <th className="border-b border-emerald-950/10 py-2">
                      Esta disciplina
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
            Eles não foram enviados por moradores e não representam medições de
            temperatura.
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
