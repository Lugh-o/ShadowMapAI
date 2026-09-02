"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BookOpenText,
  ChevronDown,
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

const articleSections = [
  {
    id: "tema",
    section: "Tema",
    title: "Soluções interdisciplinares para as crises ambientais",
    member: "Base central do artigo",
    contribution:
      "ShadowMap: Plataforma de Inteligência Coletiva para Mitigação de Ilhas de Calor e Arborização Urbana em Salvador/BA.",
  },
  {
    id: "gestao",
    section: "Eixo 1",
    title: "Gestão Geral",
    member: "Dantton Lavigne de Araújo Pinheiro",
    contribution:
      "Integração, formatação geral em LaTeX e revisão final do artigo.",
  },
  {
    id: "contexto",
    section: "1. Apresentação do Problema",
    title: "Contextualização e a Ação Antrópica",
    member: "Iago César Lacerda Santos",
    contribution:
      "Leitura do problema urbano e do papel da ação humana na intensificação do calor.",
  },
  {
    id: "saude",
    section: "1. Apresentação do Problema",
    title: "Impactos na Saúde Pública e no Conforto Térmico",
    member: "Beatriz Costa",
    contribution:
      "Análise dos efeitos do calor extremo sobre bem-estar, exposição e vulnerabilidade social.",
  },
  {
    id: "economia",
    section: "1. Apresentação do Problema",
    title: "Impactos Econômicos e Ambientais",
    member: "Douglas Sousa",
    contribution:
      "Levantamento dos impactos ambientais e dos custos urbanos associados à falta de sombra.",
  },
  {
    id: "objetivo-geral",
    section: "2. Objetivo",
    title: "Objetivo Geral, Inovação e Mitigação",
    member: "Henrique Souza",
    contribution:
      "Construção do objetivo central e da proposta de mitigação associada ao ShadowMap.",
  },
  {
    id: "mvp",
    section: "2. Objetivo",
    title: "Exequibilidade Técnica e Telas-Modelo",
    member: "João Victor Ramos",
    contribution:
      "Definição do MVP, das telas e da viabilidade técnica da plataforma.",
  },
  {
    id: "engajamento",
    section: "2. Objetivo",
    title: "Engajamento e Educação da Comunidade",
    member: "Patrícia Moreira de Oliveira",
    contribution:
      "Estrutura de participação comunitária e uso educativo da plataforma.",
  },
  {
    id: "financeiro",
    section: "2. Objetivo",
    title: "Sustentabilidade Financeira em Longo Prazo",
    member: "Ananda Silveira",
    contribution:
      "Caminhos para sustentação econômica e continuidade da proposta.",
  },
  {
    id: "escala",
    section: "2. Objetivo",
    title: "Escalabilidade e Replicabilidade",
    member: "Matheus Haig França Silva",
    contribution:
      "Expansão do modelo para outros territórios e replicação em novas cidades.",
  },
];

const tourSteps = [
  {
    id: "mapa",
    title: "Mapa interativo",
    description:
      "No mobile, o mapa precisa ficar livre para toque, arraste, zoom e seleção de pontos.",
  },
  {
    id: "filtros",
    title: "Filtros rápidos",
    description:
      "Use cidade, tipo de ocorrência e criticidade para reduzir o conjunto analisado.",
  },
  {
    id: "cadastro",
    title: "Clique para cadastrar",
    description:
      "Toque no mapa para capturar latitude e longitude e abrir o formulário no painel lateral.",
  },
  {
    id: "artigo",
    title: "Base acadêmica",
    description:
      "O botão ao lado do selo abre o modal com a divisão do artigo e o link para o documento.",
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
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);

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

  const filteredPoints = points.filter((point) => {
    const matchesCity = filters.city === "all" || point.city === filters.city;
    const matchesIssue =
      filters.issueType === "all" || point.issueType === filters.issueType;
    const matchesPriority =
      filters.priority === "all" || point.priority === filters.priority;

    return matchesCity && matchesIssue && matchesPriority;
  });

  const visibleHeatZones = initialHeatZones.filter(
    (zone) => filters.city === "all" || zone.city === filters.city,
  );

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

  async function handlePointSubmit(values: PointFormValues) {
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
        const error = await response.json();
        alert(error.error || "Erro ao cadastrar ponto. Tente novamente.");
        return;
      }

      const newPoint = await response.json();
      setPoints((currentPoints) => [newPoint, ...currentPoints]);
      setSelectedPointId(newPoint.id);
      setFilters(initialFilters);
      setDraftLocation(null);
      setIsFormOpen(false);

      alert("Ponto cadastrado com sucesso! Ele ficará pendente de aprovação até ser revisado pela equipe.");
    } catch {
      alert("Erro de conexão. Verifique sua internet e tente novamente.");
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
                  MVP acadêmico para visualizar zonas críticas e registrar novos
                  pontos em Salvador, Camaçari, Lauro de Freitas e Simões
                  Filho.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <MetricCard
                icon={MapPinned}
                label="Pontos monitorados"
                value={String(filteredPoints.length)}
                tone="emerald"
              />
              <MetricCard
                icon={AlertTriangle}
                label="Ocorrências críticas"
                value={String(criticalCount)}
                tone="amber"
              />
              <MetricCard
                icon={Trees}
                label="Cidades ativas"
                value="4"
                tone="teal"
              />
            </div>
          </div>
        </header>

        <FiltersBar
          filters={filters}
          totalPoints={points.length}
          filteredPoints={filteredPoints.length}
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
              <Legend className="pointer-events-auto" />
            </div>
          </section>

          <div className="md:hidden">
            <Legend className="max-w-none" />
          </div>

          <Sidebar
            criticalPoints={criticalPoints}
            draftLocation={draftLocation}
            isFormOpen={isFormOpen}
            selectedPoint={selectedPoint}
            totalPoints={points.length}
            onCloseForm={() => setIsFormOpen(false)}
            onOpenForm={() => setIsFormOpen(true)}
            onSelectPoint={setSelectedPointId}
            onSubmitPoint={handlePointSubmit}
          />
        </div>
      </div>

      <AcademicInfoModal
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

function AcademicInfoModal({
  isOpen,
  onClose,
  onOpenTour,
}: {
  isOpen: boolean;
  onClose: () => void;
  onOpenTour: () => void;
}) {
  const [openSectionId, setOpenSectionId] = useState(articleSections[0].id);

  useOverlayBodyLock(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-emerald-950/55 p-0 backdrop-blur-sm md:items-center md:p-6">
      <div className="glass-panel flex h-[100svh] w-full flex-col overflow-hidden rounded-none p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] md:h-auto md:max-h-[88svh] md:max-w-4xl md:rounded-[28px] md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-950/55">
              Referência acadêmica
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-emerald-950">
              Base do artigo e divisão dos componentes
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

        <div className="mt-5 flex-1 overflow-y-auto pr-0 md:pr-1">
          <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <section className="card-strong rounded-[24px] p-4">
              <h3 className="font-display text-lg font-semibold text-emerald-950">
                Partes usadas como base para o MVP
              </h3>
              <div className="mt-3 space-y-3 text-sm leading-6 text-emerald-950/78">
                <p>
                  <strong>Mapeamento espacial:</strong> transformação da ideia
                  do artigo em um mapa interativo com camadas de zonas de calor
                  e pontos críticos.
                </p>
                <p>
                  <strong>Leitura territorial:</strong> filtros por cidade,
                  criticidade e tipo de ocorrência para apoiar análise rápida.
                </p>
                <p>
                  <strong>Participação coletiva:</strong> fluxo de cadastro
                  manual de novos pontos para simular colaboração comunitária.
                </p>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={onOpenTour}
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
                >
                  Abrir guia do MVP
                </button>

                <Link
                  href="https://www.overleaf.com/read/hsgcyrkcgxjv#32447f"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-100 px-4 text-center text-sm font-semibold text-emerald-900 transition hover:bg-emerald-200"
                >
                  <BookOpenText className="h-4 w-4" />
                  Artigo no Overleaf
                </Link>
              </div>
            </section>

            <section className="card-strong rounded-[24px] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-950/55">
                    Estrutura interativa
                  </p>
                  <h3 className="mt-1 font-display text-lg font-semibold text-emerald-950">
                    Divisão do artigo
                  </h3>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900">
                  {articleSections.length} blocos
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {articleSections.map((section) => {
                  const isOpenSection = section.id === openSectionId;

                  return (
                    <article
                      key={section.id}
                      className={cn(
                        "overflow-hidden rounded-[22px] border transition",
                        isOpenSection
                          ? "border-emerald-400/55 bg-emerald-50"
                          : "border-emerald-950/10 bg-white/78",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOpenSectionId((currentId) =>
                            currentId === section.id ? "" : section.id,
                          )
                        }
                        className="flex min-h-14 w-full items-start justify-between gap-4 px-4 py-4 text-left"
                      >
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-950/50">
                            {section.section}
                          </p>
                          <h4 className="mt-1 font-display text-base font-semibold text-emerald-950">
                            {section.title}
                          </h4>
                          <p className="mt-2 text-sm font-medium text-emerald-900/88">
                            {section.member}
                          </p>
                        </div>
                        <ChevronDown
                          className={cn(
                            "mt-1 h-5 w-5 shrink-0 text-emerald-900 transition-transform",
                            isOpenSection && "rotate-180",
                          )}
                        />
                      </button>

                      {isOpenSection ? (
                        <div className="border-t border-emerald-950/10 px-4 py-4 text-sm leading-6 text-emerald-950/76">
                          {section.contribution}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </section>
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
