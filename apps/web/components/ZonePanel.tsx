"use client";

import { ArrowLeft, Check, Pencil, Shapes, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";

import {
  CITY_OPTIONS,
  getHeatLevelLabel,
  getHeatZoneColor,
  HEAT_LEVEL_OPTIONS,
} from "@/lib/utils";
import { formatZoneArea, getZoneGeometryError } from "@/lib/zone-geometry";
import type { ZoneDraft } from "@/lib/zone-geometry";
import type { City, HeatLevel, HeatZone } from "@shadowmap/types";

interface ZonePanelProps {
  draft: ZoneDraft | null;
  zone: HeatZone | null;
  onDraftChange: (draft: ZoneDraft) => void;
  onComplete: () => void;
  onAdjust: () => void;
  onCancel: () => void;
  onSave: () => void;
  onEdit: (zone: HeatZone) => void;
  onDelete: (zone: HeatZone) => void;
  onBack: () => void;
}

const fieldClassName =
  "mt-1 h-10 w-full min-w-0 rounded-lg border border-emerald-950/15 bg-white px-2 text-emerald-950 outline-none focus:border-emerald-700 focus-visible:ring-1 focus-visible:ring-emerald-700";
const secondaryButtonClassName =
  "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-emerald-950/10 bg-white px-2 text-emerald-950 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-emerald-700";

export default function ZonePanel({
  draft,
  zone,
  onDraftChange,
  onComplete,
  onAdjust,
  onCancel,
  onSave,
  onEdit,
  onDelete,
  onBack,
}: ZonePanelProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const error = draft ? getZoneGeometryError(draft.coordinates) : null;
  const title = draft
    ? draft.editingId
      ? "Editar zona"
      : "Nova zona simulada"
    : "Detalhes da zona";

  useEffect(() => {
    if (
      draft?.stage === "drawing" ||
      !window.matchMedia("(min-width: 64rem)").matches
    )
      return;
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.scrollIntoView({ block: "nearest" });
  }, [draft?.stage, zone?.id]);

  return (
    <aside className="map-sidebar glass-panel flex min-w-0 flex-col gap-2 rounded-[22px] p-2.5">
      <header className="hidden items-center justify-between gap-2 px-3 py-2 lg:flex">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-sm font-semibold outline-none"
        >
          {title}
        </h2>
        <button
          type="button"
          onClick={draft ? onCancel : onBack}
          aria-label={draft ? "Cancelar edição da zona" : "Voltar aos pontos"}
          className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-emerald-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="text-xs">Voltar</span>
        </button>
      </header>

      {draft ? (
        <section className="card-strong min-w-0 rounded-2xl p-3">
          {draft.stage === "drawing" ? (
            <>
              <h3 className="flex items-center gap-2 font-display text-sm font-semibold">
                <Shapes className="h-4 w-4" aria-hidden="true" />
                Desenhe o contorno
              </h3>
              <ol className="mt-3 list-inside list-decimal space-y-2 text-xs leading-5 text-emerald-950/75">
                <li>Marque pelo menos três vértices no mapa.</li>
                <li>Arraste os marcadores para ajustar a área.</li>
                <li>Conclua a área para preencher os dados.</li>
              </ol>
              <p className="mt-3 rounded-lg bg-emerald-50 p-2 text-xs">
                {draft.coordinates.length} vértices marcados
                {!error ? ` · ${formatZoneArea(draft.coordinates)} aprox.` : ""}
              </p>
              {draft.coordinates.length >= 3 && error ? (
                <p
                  role="alert"
                  className="mt-2 text-xs leading-5 text-rose-700"
                >
                  {error}
                </p>
              ) : null}
              <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <button
                  type="button"
                  onClick={onComplete}
                  disabled={Boolean(error)}
                  className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg bg-emerald-900 px-2 text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-emerald-700 disabled:opacity-40"
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                  <span className="text-xs font-semibold">Concluir área</span>
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  className={secondaryButtonClassName}
                >
                  <span className="text-xs">Cancelar</span>
                </button>
              </div>
              <p className="mt-3 text-[11px] leading-5 text-emerald-950/60">
                Teclado: com o mapa em foco, use as setas para mover e Enter
                para marcar o centro. Nos vértices, use as setas para ajustar.
                Esc cancela o desenho.
              </p>
            </>
          ) : (
            <form
              aria-label="Dados da zona"
              className="space-y-3 text-sm"
              onSubmit={(event) => {
                event.preventDefault();
                onSave();
              }}
            >
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs leading-5 text-amber-950">
                Zona simulada · removida ao recarregar a página.
              </p>
              <label className="block min-w-0 text-xs font-medium">
                Nome da zona
                <input
                  required
                  maxLength={80}
                  value={draft.name}
                  onChange={(event) =>
                    onDraftChange({ ...draft, name: event.target.value })
                  }
                  placeholder="Ex.: Entorno da praça"
                  className={fieldClassName}
                />
              </label>
              <label className="block min-w-0 text-xs font-medium">
                Cidade da zona
                <select
                  value={draft.city}
                  onChange={(event) =>
                    onDraftChange({
                      ...draft,
                      city: event.target.value as City,
                    })
                  }
                  className={fieldClassName}
                >
                  {CITY_OPTIONS.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block min-w-0 text-xs font-medium">
                Intensidade ilustrativa do calor
                <select
                  value={draft.intensity}
                  onChange={(event) =>
                    onDraftChange({
                      ...draft,
                      intensity: event.target.value as HeatLevel,
                    })
                  }
                  className={fieldClassName}
                >
                  {HEAT_LEVEL_OPTIONS.map((intensity) => (
                    <option key={intensity} value={intensity}>
                      {getHeatLevelLabel(intensity)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-emerald-50 p-2 text-xs">
                <span>
                  {draft.coordinates.length} vértices
                  {!error
                    ? ` · ${formatZoneArea(draft.coordinates)} aprox.`
                    : ""}
                </span>
                <button
                  type="button"
                  onClick={onAdjust}
                  className="inline-flex min-h-8 items-center gap-1 rounded-lg px-1 font-semibold text-emerald-800 hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-emerald-700"
                >
                  <Pencil className="h-3 w-3" aria-hidden="true" />
                  <span className="text-xs">Ajustar no mapa</span>
                </button>
              </div>
              {error ? (
                <p role="alert" className="text-xs leading-5 text-rose-700">
                  {error}
                </p>
              ) : null}
              <details className="rounded-lg border border-emerald-950/10 p-2 text-xs">
                <summary className="cursor-pointer rounded font-medium focus-visible:outline-2 focus-visible:outline-emerald-700">
                  Vértices do contorno
                </summary>
                <ol className="mt-1 divide-y divide-emerald-950/10">
                  {draft.coordinates.map(([lat, lng], index) => (
                    <li
                      key={index}
                      className="flex min-w-0 items-center justify-between gap-1 py-1"
                    >
                      <span className="min-w-0 break-words text-[11px]">
                        {index + 1}. {lat.toFixed(5)}, {lng.toFixed(5)}
                      </span>
                      <button
                        type="button"
                        aria-label={`Remover vértice ${index + 1}`}
                        onClick={() =>
                          onDraftChange({
                            ...draft,
                            coordinates: draft.coordinates.filter(
                              (_, i) => i !== index,
                            ),
                          })
                        }
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-rose-700 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-rose-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ol>
              </details>
              <p className="text-[11px] leading-5 text-emerald-950/60">
                Confira a cidade: o contorno não é ajustado aos limites
                municipais.
              </p>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <button
                  type="submit"
                  disabled={Boolean(error) || !draft.name.trim()}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-900 px-2 text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-emerald-700 disabled:opacity-40"
                >
                  <span className="text-xs font-semibold">
                    {draft.editingId ? "Salvar alterações" : "Criar zona"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  className={secondaryButtonClassName}
                >
                  <span className="text-xs">Cancelar</span>
                </button>
              </div>
            </form>
          )}
        </section>
      ) : zone ? (
        <section className="card-strong min-w-0 rounded-2xl p-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-950/55">
            Zona de calor
          </p>
          <h3 className="mt-1 break-words font-display text-base font-semibold">
            {zone.name}
          </h3>
          <p className="mt-1 text-[11px] text-emerald-950/65">
            {zone.createdInSession
              ? "Criada nesta sessão · simulada"
              : "Exemplo da demonstração · simulado"}
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-emerald-50 p-2.5 text-xs">
            <div className="min-w-0">
              <dt className="text-[10px] text-emerald-950/55">Cidade</dt>
              <dd className="mt-1 font-medium">{zone.city}</dd>
            </div>
            <div>
              <dt className="text-[10px] text-emerald-950/55">
                Calor ilustrativo
              </dt>
              <dd className="mt-1 flex items-center gap-1.5 font-medium">
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: getHeatZoneColor(zone.intensity) }}
                />
                {getHeatLevelLabel(zone.intensity)}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] text-emerald-950/55">
                Área aproximada
              </dt>
              <dd className="mt-1 font-medium">
                {formatZoneArea(zone.coordinates)}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] text-emerald-950/55">Vértices</dt>
              <dd className="mt-1 font-medium">{zone.coordinates.length}</dd>
            </div>
          </dl>
          {zone.createdInSession ? (
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => onEdit(zone)}
                className={secondaryButtonClassName}
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="text-xs font-semibold">Editar zona</span>
              </button>
              <button
                type="button"
                onClick={() => onDelete(zone)}
                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2 text-rose-700 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-rose-700"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="text-xs font-semibold">Excluir zona</span>
              </button>
            </div>
          ) : (
            <p className="mt-3 text-xs leading-5 text-emerald-950/65">
              Este exemplo é fixo. Use “Nova zona” no mapa para desenhar e
              editar sua própria área.
            </p>
          )}
          <button
            type="button"
            onClick={onBack}
            className="mt-3 inline-flex min-h-10 items-center gap-1 rounded-lg px-1 text-emerald-800 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-emerald-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="text-xs font-semibold">Voltar aos pontos</span>
          </button>
        </section>
      ) : null}
    </aside>
  );
}
