"use client";

import Link from "next/link";
import { ArrowUpRight, Info, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

interface AboutMapPopoverProps {
  onOpenTour: () => void;
}

export default function AboutMapPopover({ onOpenTour }: AboutMapPopoverProps) {
  const popoverId = useId();
  const titleId = useId();
  const descriptionId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const popover = popoverRef.current;
    if (!trigger || !popover) return;

    const rect = trigger.getBoundingClientRect();
    if (rect.bottom <= 0 || rect.top >= window.innerHeight) {
      popover.hidePopover();
      return;
    }

    const viewportWidth = document.documentElement.clientWidth;
    const width = Math.min(320, viewportWidth - 24);
    const below = window.innerHeight - rect.bottom - 20;
    const above = rect.top - 20;
    const placeAbove = below < 240 && above > below;

    popover.style.width = `${width}px`;
    popover.style.left = `${Math.max(12, Math.min(rect.left, viewportWidth - width - 12))}px`;
    popover.style.top = placeAbove ? "auto" : `${rect.bottom + 8}px`;
    popover.style.bottom = placeAbove
      ? `${window.innerHeight - rect.top + 8}px`
      : "auto";
    popover.style.maxHeight = `${Math.max(0, placeAbove ? above : below)}px`;
  }, []);

  useEffect(() => {
    const reposition = () => {
      if (popoverRef.current?.matches(":popover-open")) updatePosition();
    };

    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [updatePosition]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        popoverTarget={popoverId}
        aria-haspopup="dialog"
        aria-label="Sobre este mapa"
        aria-expanded={isOpen}
        aria-controls={popoverId}
        onClick={updatePosition}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-emerald-950/70 transition hover:bg-emerald-100 hover:text-emerald-950 focus-visible:outline-2 focus-visible:outline-emerald-700"
      >
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden text-xs font-medium sm:inline">
          Sobre este mapa
        </span>
      </button>

      <div
        id={popoverId}
        ref={popoverRef}
        popover="auto"
        role="dialog"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onToggle={(event) => setIsOpen(event.newState === "open")}
        className="fixed inset-auto m-0 w-80 max-w-[calc(100vw-1.5rem)] overflow-y-auto overscroll-contain rounded-2xl border border-emerald-950/15 bg-white/95 p-4 text-emerald-950 shadow-xl backdrop-blur-md"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-white/95">
          <h2 id={titleId} className="text-sm font-semibold">
            Sobre este mapa
          </h2>
          <button
            type="button"
            popoverTarget={popoverId}
            popoverTargetAction="hide"
            aria-label="Fechar informações do mapa"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-emerald-950/65 transition hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-emerald-700"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <p
          id={descriptionId}
          className="mt-2 text-sm leading-5 text-emerald-950/75"
        >
          Projeto de extensão da UCSAL sobre ilhas de calor e arborização em
          Salvador.
        </p>

        <dl className="mt-3 space-y-2 text-xs leading-5">
          <div>
            <dt className="font-semibold">Dados ilustrativos</dt>
            <dd className="text-emerald-950/70">
              Pontos e zonas são simulados, sem medições reais de temperatura.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Cadastro nesta sessão</dt>
            <dd className="text-emerald-950/70">
              Os pontos adicionados ficam apenas nesta sessão, sem salvar ou
              enviar dados.
            </dd>
          </div>
        </dl>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-emerald-950/10 pt-2 text-xs">
          <Link
            href="/privacidade"
            className="inline-flex min-h-8 items-center gap-1 font-semibold text-emerald-800 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-emerald-700"
          >
            Saiba mais sobre o projeto
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={() => {
              popoverRef.current?.hidePopover();
              onOpenTour();
            }}
            className="min-h-8 rounded-lg px-2 text-emerald-950/65 transition hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-emerald-700"
          >
            Ver guia
          </button>
        </div>
      </div>
    </>
  );
}
