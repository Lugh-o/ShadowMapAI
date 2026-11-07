"use client";

import { Check, PanelRightOpen, Pencil, Undo2, X } from "lucide-react";
import { useEffect } from "react";

import { getZoneGeometryError, MAX_ZONE_VERTICES } from "@/lib/zone-geometry";
import type { ZoneDraft } from "@/lib/zone-geometry";

interface ZoneDrawingToolbarProps {
  draft: ZoneDraft;
  onUndo: () => void;
  onComplete: () => void;
  onAdjust: () => void;
  onShowDetails: () => void;
  onCancel: () => void;
}

export default function ZoneDrawingToolbar({
  draft,
  onUndo,
  onComplete,
  onAdjust,
  onShowDetails,
  onCancel,
}: ZoneDrawingToolbarProps) {
  const drawing = draft.stage === "drawing";
  const error = getZoneGeometryError(draft.coordinates);
  const geometryError = draft.coordinates.length >= 3 ? error : null;

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (
        event.key !== "Escape" ||
        event.defaultPrevented ||
        (event.target instanceof Element &&
          event.target.closest('[role="dialog"], dialog')) ||
        document.querySelector("dialog[open], [popover]:popover-open")
      )
        return;
      event.preventDefault();
      onCancel();
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onCancel]);

  return (
    <div
      role="region"
      aria-label="Ferramentas de desenho de zona"
      className="zone-drawing-toolbar rounded-xl border border-emerald-950/15 bg-white/95 p-2 text-emerald-950 shadow-sm backdrop-blur-md"
    >
      <div className="zone-tools-caption flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-xs">
        <p className="font-semibold">
          {drawing
            ? "Desenhando zona"
            : error
              ? "Ajuste o contorno"
              : "Contorno pronto"}
        </p>
        <span className="text-[10px] text-emerald-950/60" aria-live="polite">
          {draft.coordinates.length}/{MAX_ZONE_VERTICES} vértices
        </span>
      </div>
      <p className="zone-tools-instruction mt-1 text-[11px] leading-4 text-emerald-950/65">
        {drawing
          ? "Toque no mapa para marcar o contorno."
          : "Abra os dados ou ajuste os vértices no mapa."}
      </p>
      <div className="zone-tools-actions mt-1.5 flex items-center gap-1.5 text-xs">
        {drawing ? (
          <>
            <button
              type="button"
              onClick={onUndo}
              disabled={!draft.coordinates.length}
              aria-label="Desfazer último vértice"
              title="Desfazer último vértice"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-950/10 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-emerald-700 disabled:opacity-35"
            >
              <Undo2 className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onComplete}
              disabled={Boolean(error)}
              className="inline-flex min-h-9 min-w-0 flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-900 px-2 text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-emerald-700 disabled:opacity-40"
            >
              <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="text-xs font-semibold">Concluir área</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onAdjust}
              aria-label="Ajustar contorno no mapa"
              title="Ajustar contorno no mapa"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-950/10 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-emerald-700"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onShowDetails}
              className="inline-flex min-h-9 flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-900 px-2 text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-emerald-700"
            >
              <PanelRightOpen className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="text-xs font-semibold">Dados da zona</span>
            </button>
          </>
        )}
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancelar desenho de zona"
          title="Cancelar desenho (Esc)"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-emerald-950/65 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-emerald-700"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {geometryError ? (
        <p
          role="alert"
          className="zone-tools-note mt-1.5 text-[11px] leading-4 text-rose-700"
        >
          {geometryError}
        </p>
      ) : null}
      {drawing && draft.coordinates.length === MAX_ZONE_VERTICES && !error ? (
        <p
          role="status"
          className="zone-tools-note mt-1.5 text-[11px] leading-4"
        >
          Limite de vértices atingido. Conclua ou ajuste o contorno.
        </p>
      ) : null}
    </div>
  );
}
