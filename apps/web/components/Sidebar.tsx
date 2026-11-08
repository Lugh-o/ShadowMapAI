"use client";

import { ArrowLeft, Flame, MapPin, Pentagon } from "lucide-react";
import { useEffect, useRef } from "react";

import PointForm from "@/components/PointForm";
import {
  formatCoordinates,
  getHeatLevelLabel,
  getIssueTypeLabel,
  getPriorityLabel,
  getShadeLevelLabel,
} from "@/lib/utils";
import type { HeatZone, PointFeature, PointFormValues } from "@shadowmap/types";
import type { PointFormDraft } from "@/lib/point-validation";

interface SidebarProps {
  selectedPoint: PointFeature | null;
  criticalPoints: PointFeature[];
  draftLocation: { lat: number; lng: number } | null;
  draftValues: PointFormDraft | null;
  aiAssisted?: boolean;
  totalPoints: number;
  isFormOpen: boolean;
  onCloseForm: () => void;
  onSelectPoint: (pointId: string) => void;
  onSubmitPoint: (values: PointFormValues, aiAssisted: boolean) => void;
  onDraftChange: (values: PointFormDraft) => void;
  createdZones: HeatZone[];
  onSelectZone: (zoneId: string) => void;
}

export default function Sidebar({
  selectedPoint,
  criticalPoints,
  draftLocation,
  draftValues,
  aiAssisted = false,
  totalPoints,
  isFormOpen,
  onCloseForm,
  onSelectPoint,
  onSubmitPoint,
  onDraftChange,
  createdZones,
  onSelectZone,
}: SidebarProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousModeRef = useRef(false);

  useEffect(() => {
    if (previousModeRef.current === isFormOpen) return;
    previousModeRef.current = isFormOpen;

    const frame = requestAnimationFrame(() => {
      if (!window.matchMedia("(min-width: 64rem)").matches) return;
      const heading = headingRef.current;
      if (!heading) return;
      heading.focus({ preventScroll: true });

      heading.scrollIntoView({ block: "nearest" });
    });

    return () => cancelAnimationFrame(frame);
  }, [isFormOpen]);

  return (
    <aside className="map-sidebar glass-panel flex min-w-0 flex-col gap-2 rounded-[22px] p-2.5 [overflow-wrap:anywhere]">
      <header className="hidden px-3 py-2 lg:block">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-sm font-semibold text-emerald-950 outline-none"
          >
            {isFormOpen ? "Novo ponto simulado" : "Amostra de dados"}
          </h2>
          {isFormOpen ? (
            <button
              type="button"
              onClick={onCloseForm}
              aria-label="Voltar à exploração"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-emerald-950 transition hover:bg-emerald-100"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Voltar
            </button>
          ) : (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-900">
              {totalPoints} simulados
            </span>
          )}
        </div>
        {!isFormOpen ? (
          <p className="mt-1 text-xs leading-4 text-emerald-950/65">
            Selecione um ponto no mapa para ver os detalhes.
          </p>
        ) : null}
      </header>

      {isFormOpen ? (
        <section className="card-strong rounded-2xl p-3">
          {draftValues ? (
            <PointForm
              draftLocation={draftLocation}
              values={draftValues}
              onValuesChange={onDraftChange}
              aiAssisted={aiAssisted}
              onCancel={onCloseForm}
              onSubmit={onSubmitPoint}
            />
          ) : null}
        </section>
      ) : (
        <>
          {createdZones.length ? (
            <section className="card-strong rounded-2xl p-3">
              <h3 className="flex items-center justify-between gap-2 font-display text-sm font-semibold text-emerald-950">
                Zonas nesta sessão
                <Pentagon className="h-4 w-4" aria-hidden="true" />
              </h3>
              <ul className="mt-1 divide-y divide-emerald-950/10">
                {createdZones.slice(0, 3).map((zone) => (
                  <li key={zone.id}>
                    <button
                      type="button"
                      onClick={() => onSelectZone(zone.id)}
                      className="w-full rounded-lg px-1 py-2 text-left hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-emerald-700"
                    >
                      <span className="block break-words text-xs font-semibold">
                        {zone.name}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-emerald-950/65">
                        {zone.city} · {getHeatLevelLabel(zone.intensity)} ·
                        Simulada
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {createdZones.length > 3 ? (
                <details className="mt-1 text-xs">
                  <summary className="cursor-pointer rounded-lg py-2 text-emerald-800 focus-visible:outline-2 focus-visible:outline-emerald-700">
                    Ver mais {createdZones.length - 3} zonas
                  </summary>
                  <ul className="divide-y divide-emerald-950/10">
                    {createdZones.slice(3).map((zone) => (
                      <li key={zone.id}>
                        <button
                          type="button"
                          onClick={() => onSelectZone(zone.id)}
                          className="w-full rounded-lg px-1 py-2 text-left hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-emerald-700"
                        >
                          <span className="block break-words text-xs font-semibold">
                            {zone.name}
                          </span>
                          <span className="block text-[11px] text-emerald-950/65">
                            {zone.city} · {getHeatLevelLabel(zone.intensity)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </section>
          ) : null}

          <section className="card-strong rounded-2xl p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-950/55">
                  Detalhes do ponto
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <h3 className="min-w-0 font-display text-base font-semibold leading-5 text-emerald-950">
                    {selectedPoint
                      ? selectedPoint.neighborhood
                      : "Nenhum ponto ativo"}
                  </h3>
                  {selectedPoint?.dataOrigin === "simulated" ? (
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                      Simulado
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="shrink-0 rounded-lg bg-emerald-50 p-1.5 text-emerald-900">
                <MapPin className="h-4 w-4" />
              </div>
            </div>

            {selectedPoint ? (
              <div className="mt-2 space-y-2">
                <dl className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-xl bg-emerald-50/65 p-2.5 text-emerald-950/78">
                  <InfoBadge label="Cidade" value={selectedPoint.city} />
                  <InfoBadge
                    label="Ocorrência"
                    value={getIssueTypeLabel(selectedPoint.issueType)}
                  />
                  <InfoBadge
                    label="Prioridade"
                    value={getPriorityLabel(selectedPoint.priority)}
                  />
                  <InfoBadge
                    label="Calor"
                    value={getHeatLevelLabel(selectedPoint.heatLevel)}
                  />
                  <InfoBadge
                    label="Sombra"
                    value={getShadeLevelLabel(selectedPoint.shadeLevel)}
                  />
                  <InfoBadge
                    label="Coordenadas"
                    value={formatCoordinates(
                      selectedPoint.lat,
                      selectedPoint.lng,
                    )}
                  />
                </dl>

                <p className="text-xs leading-4.5 text-emerald-950/78">
                  {selectedPoint.description}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-xs leading-4 text-emerald-950/72">
                Selecione um marcador para ver suas informações.
              </p>
            )}
          </section>

          <section className="card-strong rounded-2xl p-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-sm font-semibold text-emerald-950">
                Pontos mais críticos
              </h3>
              <Flame className="h-4 w-4 shrink-0 text-emerald-900" />
            </div>

            <div className="mt-1 divide-y divide-emerald-950/10">
              {criticalPoints.length ? (
                criticalPoints.map((point) => (
                  <button
                    key={point.id}
                    type="button"
                    aria-pressed={selectedPoint?.id === point.id}
                    onClick={() => onSelectPoint(point.id)}
                    className="w-full rounded-lg px-1 py-2 text-left transition hover:bg-emerald-50 aria-pressed:bg-emerald-50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="min-w-0 text-xs font-semibold leading-4 text-emerald-950">
                        {point.neighborhood}
                      </p>
                      <span className="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                        {getPriorityLabel(point.priority)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] leading-4 text-emerald-950/65">
                      {point.city} · {getIssueTypeLabel(point.issueType)}
                      {point.dataOrigin === "simulated" ? " · Simulado" : ""}
                    </p>
                  </button>
                ))
              ) : (
                <div className="py-2 text-xs leading-4 text-emerald-950/72">
                  Nenhum ponto encontrado com os filtros atuais.
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </aside>
  );
}

interface InfoBadgeProps {
  label: string;
  value: string;
}

function InfoBadge({ label, value }: InfoBadgeProps) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold text-emerald-950/55">{label}</dt>
      <dd className="mt-0.5 break-words text-xs font-medium leading-4 text-emerald-950">
        {value}
      </dd>
    </div>
  );
}
