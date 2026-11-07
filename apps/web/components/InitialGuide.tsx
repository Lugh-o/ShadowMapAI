"use client";

import {
  Bot,
  ChartNoAxesCombined,
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  FlaskConical,
  Layers,
  MapPinned,
  MapPinPlus,
  MousePointer2,
  TextCursorInput,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { cn, getPointPriorityColor } from "@/lib/utils";

const steps = [
  {
    id: "mapa",
    label: "Mapa",
    icon: MapPinned,
    title: "Explore a Grande Salvador",
    description:
      "Arraste o mapa e ajuste o zoom para explorar os bairros. Selecione um ponto para abrir seus detalhes.",
    tip: "Use o botão de recentralizar para voltar ao conjunto de dados visível.",
  },
  {
    id: "filtros",
    label: "Filtros",
    icon: Filter,
    title: "Encontre o que importa",
    description:
      "Combine cidade, ocorrência e prioridade. O mapa e os indicadores acompanham a sua seleção.",
    tip: "No celular, deslize a linha de filtros. “Limpar” restaura a visualização completa.",
  },
  {
    id: "legenda",
    label: "Legenda",
    icon: Layers,
    title: "Entenda as cores do mapa",
    description:
      "O contorno indica a prioridade de cada ponto. As áreas coloridas representam zonas ilustrativas de calor.",
    tip: "Abra a legenda no canto inferior esquerdo. Use “Nova zona” no mapa para desenhar uma área simulada.",
  },
  {
    id: "cadastro",
    label: "Cadastro",
    icon: MapPinPlus,
    title: "Experimente criar um ponto",
    description:
      "Clique no mapa para escolher o local ou use “Novo ponto”. Preencha os dados e acompanhe a prioridade calculada.",
    tip: "No celular, recolha o formulário para ajustar o local. Seus pontos e rascunhos duram até recarregar a página.",
  },
  {
    id: "recursos",
    label: "Recursos",
    icon: Bot,
    title: "Continue a exploração",
    description:
      "Abra o Painel para comparar os dados ou converse com o assistente para descobrir como usar os recursos.",
    tip: "O assistente usa respostas prontas e pode abrir recursos da interface.",
  },
];

interface InitialGuideProps {
  onClose: () => void;
  onExplore: () => void;
}

export default function InitialGuide({ onClose, onExplore }: InitialGuideProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const stepTitleId = useId();
  const currentStep = steps[stepIndex];
  const Icon = currentStep.icon;
  const isLastStep = stepIndex === steps.length - 1;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${parseFloat(getComputedStyle(document.body).paddingRight) + scrollbarWidth}px`;
    }
    document.body.style.overflow = "hidden";
    dialog.showModal();
    titleRef.current?.focus({ preventScroll: true });

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;
    };
  }, []);

  function selectStep(index: number) {
    setStepIndex(index);
    contentRef.current?.scrollTo({ top: 0 });
  }

  function dismiss(explore = false) {
    dialogRef.current?.close();
    if (explore) onExplore();
    else onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-modal="true"
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>(
          "button:not(:disabled)",
        );
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === titleRef.current)
        ) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      className="fixed inset-0 m-auto max-h-[calc(100svh-1.5rem)] w-[calc(100%-1.5rem)] max-w-2xl flex-col overflow-hidden rounded-3xl border border-emerald-950/10 bg-[#f7fbf6] p-0 text-emerald-950 shadow-2xl backdrop:bg-emerald-950/50 backdrop:backdrop-blur-sm open:flex"
    >
      <header className="initial-guide-header flex shrink-0 items-center justify-between gap-3 px-4 pt-4 sm:px-6 sm:pt-5">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-950/55">
            Guia rápido · {steps.length} passos
          </p>
          <h2
            id={titleId}
            ref={titleRef}
            tabIndex={-1}
            className="initial-guide-title mt-1 font-display text-lg font-semibold tracking-tight outline-none sm:text-2xl"
          >
            Conheça o ShadowMap
          </h2>
        </div>
        <button
          type="button"
          onClick={() => dismiss()}
          aria-label="Fechar guia"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-emerald-950/65 hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-emerald-700"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>

      <ol aria-label="Etapas do guia" className="initial-guide-steps mx-4 my-3 grid shrink-0 grid-cols-5 gap-1 sm:mx-6 sm:my-4 sm:gap-2">
        {steps.map((step, index) => (
          <li key={step.id} className="min-w-0">
            <button
              type="button"
              aria-label={`Etapa ${index + 1}: ${step.title}`}
              aria-current={index === stepIndex ? "step" : undefined}
              onClick={() => selectStep(index)}
              className={cn(
                "initial-guide-step-button flex min-h-12 w-full min-w-0 flex-col items-center justify-center gap-1 rounded-xl py-1.5 focus-visible:outline-2 focus-visible:outline-emerald-700",
                index === stepIndex
                  ? "bg-emerald-100/80 text-emerald-950"
                  : "text-emerald-950/60 hover:bg-emerald-50",
              )}
            >
              <span className={cn(
                "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                index <= stepIndex ? "bg-emerald-900 text-white" : "bg-emerald-950/7",
              )} aria-hidden="true">
                {index < stepIndex ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span className="text-[10px] font-semibold sm:text-xs">{step.label}</span>
            </button>
          </li>
        ))}
      </ol>

      <p role="status" className="sr-only">
        Etapa {stepIndex + 1} de {steps.length}: {currentStep.title}
      </p>
      <div ref={contentRef} className="min-h-0 overflow-y-auto overscroll-contain px-4 [scrollbar-color:rgba(6,78,59,0.3)_transparent] [scrollbar-gutter:stable] [scrollbar-width:thin] sm:px-6">
        <section aria-labelledby={stepTitleId} className="initial-guide-current-step rounded-2xl border border-emerald-950/8 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
              <Icon className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <h3 id={stepTitleId} className="font-display text-base font-semibold sm:text-lg">
              {currentStep.title}
            </h3>
          </div>
          <p className="mt-3 text-sm leading-5 text-emerald-950/75">{currentStep.description}</p>
          <GuidePreview step={currentStep.id} />
          <p className="mt-3 text-xs leading-5 text-emerald-950/65">{currentStep.tip}</p>
        </section>
      </div>

      <footer className="initial-guide-footer mt-3 shrink-0 border-t border-emerald-950/8 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 sm:px-6 sm:pb-5">
        <p className="flex items-start gap-1.5 text-[11px] leading-4 text-amber-950/85">
          <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Dados simulados, sem medições reais de temperatura.
        </p>
        <div className="mt-2 flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => selectStep(stepIndex - 1)}
            disabled={stepIndex === 0}
            aria-label="Voltar"
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-xl border border-emerald-950/10 bg-white px-2 text-emerald-950 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-emerald-700 disabled:cursor-default disabled:opacity-35 sm:px-3"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            <span className="hidden text-sm font-semibold sm:inline">Voltar</span>
          </button>
          <button type="button" onClick={() => dismiss()} className="ml-auto min-h-11 shrink-0 rounded-xl px-2 text-emerald-950/65 hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-emerald-700">
            <span className="text-xs font-medium sm:text-sm">Agora não</span>
          </button>
          <button
            type="button"
            onClick={() => isLastStep ? dismiss(true) : selectStep(stepIndex + 1)}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1 rounded-xl bg-emerald-900 px-3 text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 sm:px-4"
          >
            <span className="text-xs font-semibold sm:text-sm">{isLastStep ? "Explorar mapa" : "Próximo"}</span>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <p className="initial-guide-reopen mt-2 text-[10px] leading-4 text-emerald-950/55 sm:text-[11px]">
          Reveja em “Sobre este mapa” → “Ver guia”.
        </p>
      </footer>
    </dialog>
  );
}

function GuidePreview({ step }: { step: string }) {
  if (step === "mapa") return (
    <div className="initial-guide-map-preview mt-3 overflow-hidden rounded-xl border border-emerald-950/8 bg-emerald-50" aria-hidden="true">
      <svg viewBox="0 0 480 100" className="h-24 w-full" preserveAspectRatio="xMidYMid slice">
        <path d="M-20 70 500 15M80 -20 145 120M305 -20 365 120" stroke="#fff" strokeWidth="18" />
        <path d="m195 24 62-9 15 50-63 11Z" fill="#E25A36" fillOpacity=".15" stroke="#E25A36" />
        <circle cx="238" cy="45" r="9" fill="#94A3B8" stroke={getPointPriorityColor("critical")} strokeWidth="3" strokeDasharray="4 3" />
        <circle cx="120" cy="78" r="7" fill="#94A3B8" stroke={getPointPriorityColor("medium")} strokeWidth="3" strokeDasharray="4 3" />
        <circle cx="362" cy="30" r="7" fill="#94A3B8" stroke={getPointPriorityColor("low")} strokeWidth="3" strokeDasharray="4 3" />
      </svg>
    </div>
  );
  if (step === "filtros") return (
    <dl className="mt-3 grid gap-2 rounded-xl bg-emerald-50 p-3 text-xs sm:grid-cols-3">
      {[["Cidade", "Salvador"], ["Ocorrência", "Baixa arborização"], ["Prioridade", "Crítica"]].map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-2 sm:block">
          <dt className="text-emerald-950/55">{label}</dt>
          <dd className="font-semibold sm:mt-1">{value}</dd>
        </div>
      ))}
    </dl>
  );
  if (step === "legenda") return (
    <div className="mt-3 grid gap-2 rounded-xl bg-emerald-50 p-3 text-xs">
      <p className="flex items-center gap-2"><span aria-hidden="true" className="h-4 w-4 shrink-0 rounded-full border-[3px] border-dashed bg-slate-400" style={{ borderColor: getPointPriorityColor("critical") }} />Ponto com prioridade crítica</p>
      <p className="flex items-center gap-2"><span aria-hidden="true" className="h-4 w-4 shrink-0 rounded-sm border border-[#E25A36] bg-[#E25A36]/20" />Zona ilustrativa de calor alto</p>
      <p className="border-t border-emerald-950/10 pt-2 text-emerald-950/65">Cinza e tracejado identificam pontos simulados.</p>
    </div>
  );
  if (step === "cadastro") return (
    <ol className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-emerald-50 p-3 text-center text-[11px] leading-4 sm:text-xs">
      {[
        { icon: MousePointer2, label: "Escolha o local" },
        { icon: TextCursorInput, label: "Descreva o ponto" },
        { icon: Check, label: "Veja no mapa" },
      ].map(({ icon: StepIcon, label }) => (
        <li key={label} className="flex min-w-0 flex-col items-center gap-2">
          <StepIcon className="h-5 w-5 text-emerald-800" aria-hidden="true" />
          <span>{label}</span>
        </li>
      ))}
    </ol>
  );
  return (
    <dl className="mt-3 grid gap-2 rounded-xl bg-emerald-50 p-3 text-xs sm:grid-cols-2 sm:gap-3">
      <div><dt className="flex items-center gap-1.5 font-semibold"><ChartNoAxesCombined className="h-4 w-4" aria-hidden="true" />Painel</dt><dd className="mt-1 leading-5 text-emerald-950/65">Compare bairros, prioridades e períodos.</dd></div>
      <div><dt className="flex items-center gap-1.5 font-semibold"><Bot className="h-4 w-4" aria-hidden="true" />Assistente</dt><dd className="mt-1 leading-5 text-emerald-950/65">Pergunte como filtrar ou criar um ponto.</dd></div>
    </dl>
  );
}
