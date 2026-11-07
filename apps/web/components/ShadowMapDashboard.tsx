"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  FlaskConical,
  MapPinned,
  Trees,
  X,
} from "lucide-react";

import AboutMapPopover from "@/components/AboutMapPopover";
import {
  createPointDraft,
  useDemoSession,
} from "@/components/DemoSessionProvider";
import FiltersBar from "@/components/FiltersBar";
import InitialGuide from "@/components/InitialGuide";
import Legend from "@/components/Legend";
import { useMapGuide } from "@/components/MapGuideProvider";
import MapInfoPanel from "@/components/MapInfoPanel";
import Sidebar from "@/components/Sidebar";
import {
  cn,
  CITY_CENTERS,
  derivePriority,
  inferCityFromCoordinates,
  sortPointsByCriticality,
} from "@/lib/utils";
import type { HeatZone, PointFeature, PointFormValues } from "@shadowmap/types";
import type { BaseMapStatus, PointFocusRequest } from "@/lib/map-view";
import { useDesktopLayout } from "@/lib/use-desktop-layout";

const DynamicMapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.52)] text-sm text-emerald-950/70">
      Carregando mapa interativo...
    </div>
  ),
});

const TOUR_STORAGE_KEY = "shadowmap-tour-completed";

interface ShadowMapDashboardProps {
  initialHeatZones: HeatZone[];
}

export default function ShadowMapDashboard({
  initialHeatZones,
}: ShadowMapDashboardProps) {
  const { pendingAction, completeAction, requestAction } = useMapGuide();
  const { session, setSession } = useDemoSession();
  const {
    points,
    filters,
    selectedPointId,
    draftLocation,
    draftValues,
    isFormOpen,
    showSimulated,
    isLegendExpanded,
  } = session;
  const mapSectionRef = useRef<HTMLElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const legendToggleRef = useRef<HTMLButtonElement>(null);
  const focusIdRef = useRef(0);
  const isDesktop = useDesktopLayout();
  const isLegendOpen = isLegendExpanded ?? isDesktop;
  const [isPanelExpanded, setIsPanelExpanded] = useState(isFormOpen);
  const [panelFocusRequest, setPanelFocusRequest] = useState(0);
  const [pointFocusRequest, setPointFocusRequest] =
    useState<PointFocusRequest | null>(null);
  const [recenterRequest, setRecenterRequest] = useState(0);
  const [baseMapStatus, setBaseMapStatus] = useState<BaseMapStatus>("loading");
  const guidedEntryRef = useRef(Boolean(pendingAction));
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      let hasCompletedTour = false;
      try {
        hasCompletedTour = window.localStorage.getItem(TOUR_STORAGE_KEY) === "1";
      } catch {
        // The guide remains available when browser storage is disabled.
      }

      if (!hasCompletedTour && !guidedEntryRef.current) {
        setIsTourOpen(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const simulatedCount = points.length;

  const originPoints = showSimulated ? points : [];

  const filteredPoints = useMemo(
    () =>
      showSimulated
        ? points.filter((point) => {
            const matchesCity =
              filters.city === "all" || point.city === filters.city;
            const matchesIssue =
              filters.issueType === "all" ||
              point.issueType === filters.issueType;
            const matchesPriority =
              filters.priority === "all" || point.priority === filters.priority;

            return matchesCity && matchesIssue && matchesPriority;
          })
        : [],
    [points, showSimulated, filters.city, filters.issueType, filters.priority],
  );

  const visibleHeatZones = useMemo(
    () =>
      showSimulated
        ? initialHeatZones.filter(
            (zone) => filters.city === "all" || zone.city === filters.city,
          )
        : [],
    [initialHeatZones, showSimulated, filters.city],
  );

  const effectiveSelectedPointId = filteredPoints.some(
    (point) => point.id === selectedPointId,
  )
    ? selectedPointId
    : (filteredPoints[0]?.id ?? null);

  const selectedPoint =
    points.find((point) => point.id === effectiveSelectedPointId) ?? null;
  const criticalPoints = sortPointsByCriticality(filteredPoints).slice(0, 5);
  const criticalCount = filteredPoints.filter(
    (point) => point.priority === "critical",
  ).length;

  const scrollToWorkspace = useCallback(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    const navHeight =
      document.querySelector("nav")?.getBoundingClientRect().height ?? 0;
    window.scrollTo({
      top: Math.max(
        0,
        window.scrollY + workspace.getBoundingClientRect().top - navHeight - 8,
      ),
    });
  }, []);

  const revealPanel = useCallback(() => {
    setIsPanelExpanded(true);
    setPanelFocusRequest((value) => value + 1);
  }, []);

  const selectMapPoint = useCallback(
    (selectedPointId: string) => {
      setSession((current) => ({ ...current, selectedPointId }));
      setIsPanelExpanded(false);
    },
    [setSession],
  );

  function focusPoint(pointId: string) {
    selectMapPoint(pointId);
    setPointFocusRequest({ pointId, id: ++focusIdRef.current });
    requestAnimationFrame(scrollToWorkspace);
  }

  function clearFilters() {
    setSession((current) => ({
      ...current,
      filters: { city: "all", issueType: "all", priority: "all" },
      showSimulated: true,
    }));
    setPointFocusRequest(null);
    setRecenterRequest((value) => value + 1);
    requestAnimationFrame(() =>
      mapSectionRef.current?.focus({ preventScroll: true }),
    );
  }

  function recenterMap() {
    setPointFocusRequest(null);
    setRecenterRequest((value) => value + 1);
  }

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

    setSession((current) => ({
      ...current,
      points: [created, ...current.points],
      filters: { city: created.city, issueType: "all", priority: "all" },
      showSimulated: true,
      selectedPointId: created.id,
      draftLocation: null,
      draftValues: null,
      isFormOpen: false,
    }));
    focusPoint(created.id);
    setSubmitMessage({
      tone: "success",
      text: "Ponto simulado adicionado ao mapa desta sessão. Nenhum dado foi salvo ou enviado.",
    });
  }

  function handleMapPick(location: { lat: number; lng: number }) {
    setSession((current) => ({
      ...current,
      draftLocation: location,
      draftValues: {
        ...(current.draftValues ?? createPointDraft(location)),
        ...location,
        city: inferCityFromCoordinates(location.lat, location.lng),
      },
      isFormOpen: true,
    }));
    revealPanel();
  }

  const openManualForm = useCallback(() => {
    setSession((current) => ({
      ...current,
      draftValues:
        current.draftValues ??
        (current.filters.city === "all"
          ? createPointDraft()
          : createPointDraft({
              lat: CITY_CENTERS[current.filters.city][0],
              lng: CITY_CENTERS[current.filters.city][1],
            })),
      isFormOpen: true,
    }));
    revealPanel();
  }, [setSession, revealPanel]);

  useEffect(() => {
    if (!pendingAction) return;

    const frame = requestAnimationFrame(() => {
      if (pendingAction.action === "new-point") {
        if (!isFormOpen) openManualForm();
        else revealPanel();
        scrollToWorkspace();
      } else {
        scrollToWorkspace();
        setIsPanelExpanded(false);
        if (pendingAction.action === "show-legend") {
          setSession((current) => ({ ...current, isLegendExpanded: true }));
          legendToggleRef.current?.focus({ preventScroll: true });
        } else {
          mapSectionRef.current?.focus({ preventScroll: true });
        }
      }
      completeAction(pendingAction.id);
    });

    return () => cancelAnimationFrame(frame);
  }, [
    pendingAction,
    completeAction,
    isFormOpen,
    openManualForm,
    setSession,
    revealPanel,
    scrollToWorkspace,
  ]);

  function closeForm() {
    setSession((current) => ({
      ...current,
      draftLocation: null,
      draftValues: null,
      isFormOpen: false,
    }));
  }

  function closeTour() {
    try {
      window.localStorage.setItem(TOUR_STORAGE_KEY, "1");
    } catch {
      // Dismissing the guide must also work without browser storage.
    }
    setIsTourOpen(false);
  }

  function reopenTour() {
    setIsTourOpen(true);
  }

  return (
    <main id="conteudo-principal" tabIndex={-1} className="min-h-screen">
      <div className="mx-auto flex w-full max-w-360 min-w-0 flex-col gap-3 px-3 py-3 sm:gap-4 sm:px-5 lg:px-6">
        <header className="glass-panel rounded-3xl p-3 sm:p-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
            <div className="flex min-w-0 items-start justify-between gap-2 lg:flex-1 lg:items-center">
              <div className="min-w-0">
                <h1 className="font-display text-xl font-semibold tracking-tight text-emerald-950 sm:text-2xl">
                  Mapa de calor urbano
                </h1>
                <p className="mt-0.5 text-xs leading-4 text-emerald-950/65">
                  Calor e arborização na Grande Salvador.
                </p>
              </div>
              <AboutMapPopover onOpenTour={reopenTour} />
            </div>
            <div
              aria-label="Indicadores do mapa"
              className="grid grid-cols-3 divide-x divide-emerald-950/10 rounded-xl border border-emerald-950/8 bg-white/65 py-2 lg:min-w-80 lg:shrink-0"
            >
              <MetricCard
                icon={MapPinned}
                label="Pontos"
                value={String(filteredPoints.length)}
                tone="emerald"
              />
              <MetricCard
                icon={AlertTriangle}
                label="Críticos"
                value={String(criticalCount)}
                tone="amber"
              />
              <MetricCard
                icon={Trees}
                label="Zonas"
                value={String(visibleHeatZones.length)}
                tone="teal"
              />
            </div>
          </div>
          <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2 py-1.5 text-[11px] leading-4 text-amber-950">
            <FlaskConical
              className="mt-0.5 h-3 w-3 shrink-0"
              aria-hidden="true"
            />
            <span>
              <strong>Dados simulados.</strong> Sem medições de temperatura ou
              relatos reais.
            </span>
          </p>
        </header>

        {submitMessage ? (
          <div
            role="status"
            className={cn(
              "flex items-start justify-between gap-3 rounded-3xl border px-4 py-3 text-sm",
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

        {/* A barra de 64px e o intervalo de 8px completam 90vh com o mapa. */}
        <div
          ref={workspaceRef}
          className="relative grid min-w-0 items-start gap-2 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]"
        >
          <div className="min-w-0 lg:col-span-2">
            <FiltersBar
              filters={filters}
              totalPoints={originPoints.length}
              filteredPoints={filteredPoints.length}
              simulatedCount={simulatedCount}
              showSimulated={showSimulated}
              onShowSimulatedChange={(showSimulated) => {
                setPointFocusRequest(null);
                setSession((current) => ({ ...current, showSimulated }));
              }}
              onFiltersChange={(filters) => {
                setPointFocusRequest(null);
                setSession((current) => ({ ...current, filters }));
              }}
              onOpenForm={openManualForm}
              onClearFilters={clearFilters}
            />
          </div>

          <section
            ref={mapSectionRef}
            tabIndex={-1}
            aria-label="Mapa interativo"
            className="glass-panel relative min-h-60 min-w-0 overflow-hidden rounded-[22px]"
            style={{ height: "calc(90vh - 4.5rem)" }}
          >
            <div className="absolute inset-1.5 overflow-hidden rounded-2xl">
              <DynamicMapView
                city={filters.city}
                draftLocation={draftLocation}
                points={filteredPoints}
                selectedPointId={effectiveSelectedPointId}
                visibleHeatZones={visibleHeatZones}
                onMapPick={handleMapPick}
                onSelectPoint={selectMapPoint}
                focusRequest={pointFocusRequest}
                recenterRequest={recenterRequest}
                onRecenter={recenterMap}
                baseMapStatus={baseMapStatus}
                onBaseMapStatusChange={setBaseMapStatus}
              />
            </div>

            {filteredPoints.length === 0 ? (
              <div
                role="status"
                className={cn(
                  "absolute left-4 right-16 z-500 max-w-sm rounded-xl border border-emerald-950/10 bg-white/95 p-3 text-xs text-emerald-950 shadow-sm",
                  baseMapStatus === "ready" ? "top-4" : "top-24",
                )}
              >
                <p className="font-semibold">
                  {showSimulated
                    ? `Nenhum ponto para os filtros selecionados${filters.city === "all" ? "" : ` em ${filters.city}`}.`
                    : "Dados de demonstração ocultos."}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-2 text-[11px]">
                  {showSimulated ? (
                    <>
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="min-h-8 rounded-lg bg-emerald-900 px-2 text-white focus-visible:outline-2 focus-visible:outline-emerald-700"
                      >
                        Limpar filtros
                      </button>
                      <button
                        type="button"
                        onClick={openManualForm}
                        className="min-h-8 rounded-lg border border-emerald-950/15 px-2 text-emerald-900 focus-visible:outline-2 focus-visible:outline-emerald-700"
                      >
                        Novo ponto
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setSession((current) => ({
                          ...current,
                          showSimulated: true,
                        }))
                      }
                      className="min-h-8 rounded-lg bg-emerald-900 px-2 text-white focus-visible:outline-2 focus-visible:outline-emerald-700"
                    >
                      Mostrar dados simulados
                    </button>
                  )}
                </div>
              </div>
            ) : null}

            <div className="map-legend-position pointer-events-none absolute bottom-3 left-3 z-500 max-w-[calc(100%-1.5rem)]">
              <Legend
                expanded={isLegendOpen}
                onExpandedChange={(isLegendExpanded) =>
                  setSession((current) => ({ ...current, isLegendExpanded }))
                }
                toggleRef={legendToggleRef}
                className="pointer-events-auto"
                showSimulated={showSimulated}
              />
            </div>
          </section>

          <MapInfoPanel
            expanded={isPanelExpanded}
            onExpandedChange={setIsPanelExpanded}
            focusRequest={panelFocusRequest}
            isFormOpen={isFormOpen}
            mapRef={mapSectionRef}
            workspaceRef={workspaceRef}
          >
            <Sidebar
              criticalPoints={criticalPoints}
              draftLocation={draftLocation}
              draftValues={draftValues}
              isFormOpen={isFormOpen}
              selectedPoint={selectedPoint}
              totalPoints={originPoints.length}
              onCloseForm={closeForm}
              onSelectPoint={focusPoint}
              onDraftChange={(draftValues) =>
                setSession((current) => ({ ...current, draftValues }))
              }
              onSubmitPoint={handlePointSubmit}
            />
          </MapInfoPanel>
        </div>
      </div>

      {isTourOpen ? (
        <InitialGuide
          onClose={closeTour}
          onExplore={() => {
            closeTour();
            requestAction("show-map");
          }}
        />
      ) : null}
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
    <div className="flex min-w-0 items-center justify-center gap-1 px-1.5 sm:gap-1.5 sm:px-2">
      <Icon
        aria-hidden="true"
        className={cn(
          "h-3.5 w-3.5 shrink-0",
          tone === "amber"
            ? "text-amber-700"
            : tone === "teal"
              ? "text-teal-700"
              : "text-emerald-800",
        )}
      />
      <strong className="font-display text-base font-semibold text-emerald-950">
        {value}
      </strong>
      <span className="text-[10px] text-emerald-950/65 sm:text-[11px]">
        {label}
      </span>
    </div>
  );
}
