"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, FlaskConical, MapPinned, Trees, X } from "lucide-react";

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
import ZonePanel from "@/components/ZonePanel";
import {
  cn,
  CITY_CENTERS,
  derivePriority,
  inferCityFromCoordinates,
  sortPointsByCriticality,
} from "@/lib/utils";
import type { HeatZone, PointFeature, PointFormValues } from "@shadowmap/types";
import type {
  BaseMapStatus,
  PointFocusRequest,
  ZoneFocusRequest,
} from "@/lib/map-view";
import { useDesktopLayout } from "@/lib/use-desktop-layout";
import { parsePointForm } from "@/lib/point-validation";
import { getZoneGeometryError, MAX_ZONE_VERTICES } from "@/lib/zone-geometry";
import type { ZoneCoordinate } from "@/lib/zone-geometry";

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
    createdZones,
    zoneDraft,
    selectedZoneId,
  } = session;
  const mapSectionRef = useRef<HTMLElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const legendToggleRef = useRef<HTMLButtonElement>(null);
  const focusIdRef = useRef(0);
  const isDesktop = useDesktopLayout();
  const isLegendOpen = isLegendExpanded ?? isDesktop;
  const [isPanelExpanded, setIsPanelExpanded] = useState(
    zoneDraft
      ? zoneDraft.stage === "details"
      : isFormOpen || Boolean(selectedZoneId),
  );
  const [panelFocusRequest, setPanelFocusRequest] = useState(0);
  const [pointFocusRequest, setPointFocusRequest] =
    useState<PointFocusRequest | null>(null);
  const [recenterRequest, setRecenterRequest] = useState(0);
  const [zoneFocusRequest, setZoneFocusRequest] =
    useState<ZoneFocusRequest | null>(
      selectedZoneId ? { zoneId: selectedZoneId, id: 0 } : null,
    );
  const [removedZone, setRemovedZone] = useState<HeatZone | null>(null);
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
        hasCompletedTour =
          window.localStorage.getItem(TOUR_STORAGE_KEY) === "1";
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
        ? [...initialHeatZones, ...createdZones].filter(
            (zone) => filters.city === "all" || zone.city === filters.city,
          )
        : [],
    [initialHeatZones, createdZones, showSimulated, filters.city],
  );
  const selectedZone =
    visibleHeatZones.find((zone) => zone.id === selectedZoneId) ?? null;

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
      setSession((current) => ({
        ...current,
        selectedPointId,
        selectedZoneId: null,
      }));
      setZoneFocusRequest(null);
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
      selectedZoneId: null,
    }));
    setZoneFocusRequest(null);
    setPointFocusRequest(null);
    setRecenterRequest((value) => value + 1);
    requestAnimationFrame(() =>
      mapSectionRef.current?.focus({ preventScroll: true }),
    );
  }

  function recenterMap() {
    setPointFocusRequest(null);
    setZoneFocusRequest(null);
    setRecenterRequest((value) => value + 1);
  }

  function handlePointSubmit(
    values: PointFormValues,
    submittedWithAi: boolean,
  ) {
    const result = parsePointForm(values);
    if (!result.values) {
      setSubmitMessage({
        tone: "error",
        text: Object.values(result.errors).join(" "),
      });
      return;
    }
    setSubmitMessage(null);
    setRemovedZone(null);

    const created: PointFeature = {
      id: `sim-${Date.now()}`,
      ...result.values,
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
      selectedZoneId: null,
    }));
    focusPoint(created.id);
    setSubmitMessage({
      tone: "success",
      text: "Ponto simulado adicionado ao mapa desta sessão. Nenhum dado foi salvo ou enviado.",
    });
  }

  function handleMapPick(location: { lat: number; lng: number }) {
    if (zoneDraft) {
      if (zoneDraft.stage !== "drawing") return;
      setSession((current) =>
        current.zoneDraft?.stage === "drawing" &&
        current.zoneDraft.coordinates.length < MAX_ZONE_VERTICES
          ? {
              ...current,
              zoneDraft: {
                ...current.zoneDraft,
                coordinates: [
                  ...current.zoneDraft.coordinates,
                  [location.lat, location.lng],
                ],
              },
            }
          : current,
      );
      return;
    }
    setZoneFocusRequest(null);
    setSession((current) => ({
      ...current,
      selectedZoneId: null,
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
    if (zoneDraft) {
      setSubmitMessage({
        tone: "error",
        text: "Conclua ou cancele a zona antes de criar um ponto. Seu desenho foi preservado.",
      });
      return;
    }
    setZoneFocusRequest(null);
    setSession((current) => ({
      ...current,
      selectedZoneId: null,
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
  }, [setSession, revealPanel, zoneDraft]);

  function startZone() {
    setSubmitMessage(null);
    setRemovedZone(null);
    setPointFocusRequest(null);
    setZoneFocusRequest(null);
    setSession((current) => ({
      ...current,
      zoneDraft: {
        editingId: null,
        name: "",
        city:
          current.filters.city === "all" ? "Salvador" : current.filters.city,
        intensity: "high",
        coordinates: [],
        stage: "drawing",
      },
      selectedZoneId: null,
      isFormOpen: false,
      showSimulated: true,
    }));
    setIsPanelExpanded(false);
    requestAnimationFrame(scrollToWorkspace);
  }

  const cancelZone = useCallback(() => {
    setSession((current) => ({
      ...current,
      selectedZoneId: current.zoneDraft?.editingId ?? null,
      zoneDraft: null,
    }));
    setIsPanelExpanded(false);
    requestAnimationFrame(() =>
      mapSectionRef.current?.focus({ preventScroll: true }),
    );
  }, [setSession]);

  function completeZone() {
    if (!zoneDraft || getZoneGeometryError(zoneDraft.coordinates)) return;
    setSession((current) =>
      current.zoneDraft
        ? { ...current, zoneDraft: { ...current.zoneDraft, stage: "details" } }
        : current,
    );
    revealPanel();
  }

  function adjustZone() {
    setSession((current) =>
      current.zoneDraft
        ? { ...current, zoneDraft: { ...current.zoneDraft, stage: "drawing" } }
        : current,
    );
    setIsPanelExpanded(false);
    requestAnimationFrame(scrollToWorkspace);
  }

  function moveZoneVertex(index: number, coordinate: ZoneCoordinate) {
    setSession((current) =>
      current.zoneDraft
        ? {
            ...current,
            zoneDraft: {
              ...current.zoneDraft,
              coordinates: current.zoneDraft.coordinates.map((value, i) =>
                i === index ? coordinate : value,
              ),
            },
          }
        : current,
    );
  }

  function undoZoneVertex() {
    setSession((current) =>
      current.zoneDraft
        ? {
            ...current,
            zoneDraft: {
              ...current.zoneDraft,
              coordinates: current.zoneDraft.coordinates.slice(0, -1),
            },
          }
        : current,
    );
  }

  function selectZone(zoneId: string) {
    if (zoneDraft) return;
    setPointFocusRequest(null);
    setSession((current) => ({
      ...current,
      selectedZoneId: zoneId,
      isFormOpen: false,
    }));
    setZoneFocusRequest({ zoneId, id: ++focusIdRef.current });
    revealPanel();
  }

  function editZone(zone: HeatZone) {
    if (!zone.createdInSession) return;
    setSubmitMessage(null);
    setRemovedZone(null);
    setPointFocusRequest(null);
    setSession((current) => ({
      ...current,
      zoneDraft: {
        editingId: zone.id,
        name: zone.name,
        city: zone.city,
        intensity: zone.intensity,
        coordinates: zone.coordinates.map(([lat, lng]) => [lat, lng]),
        stage: "details",
      },
    }));
    setZoneFocusRequest({ zoneId: zone.id, id: ++focusIdRef.current });
    revealPanel();
  }

  function saveZone() {
    if (
      !zoneDraft ||
      zoneDraft.stage !== "details" ||
      !zoneDraft.name.trim() ||
      getZoneGeometryError(zoneDraft.coordinates)
    )
      return;
    if (
      zoneDraft.editingId &&
      !createdZones.some((zone) => zone.id === zoneDraft.editingId)
    )
      return;
    const zone: HeatZone = {
      id:
        zoneDraft.editingId ??
        `zone-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: zoneDraft.name.trim(),
      city: zoneDraft.city,
      intensity: zoneDraft.intensity,
      coordinates: zoneDraft.coordinates.map(([lat, lng]) => [lat, lng]),
      createdInSession: true,
    };
    setSession((current) => ({
      ...current,
      createdZones: zoneDraft.editingId
        ? current.createdZones.map((item) =>
            item.id === zone.id ? zone : item,
          )
        : [zone, ...current.createdZones],
      zoneDraft: null,
      selectedZoneId: zone.id,
      showSimulated: true,
      filters: { ...current.filters, city: zone.city },
    }));
    setRemovedZone(null);
    setSubmitMessage({
      tone: "success",
      text: zoneDraft.editingId
        ? "Zona atualizada nesta sessão."
        : "Zona simulada criada nesta sessão. Nada foi salvo ou enviado.",
    });
    setZoneFocusRequest({ zoneId: zone.id, id: ++focusIdRef.current });
    setIsPanelExpanded(false);
    requestAnimationFrame(scrollToWorkspace);
  }

  function deleteZone(zone: HeatZone) {
    if (!zone.createdInSession) return;
    setSession((current) => ({
      ...current,
      createdZones: current.createdZones.filter((item) => item.id !== zone.id),
      selectedZoneId: null,
      zoneDraft: null,
    }));
    setZoneFocusRequest(null);
    setRemovedZone(zone);
    setSubmitMessage({
      tone: "success",
      text: `Zona “${zone.name}” excluída desta sessão.`,
    });
    setIsPanelExpanded(false);
    requestAnimationFrame(scrollToWorkspace);
  }

  function undoZoneDeletion() {
    if (!removedZone) return;
    setSession((current) => ({
      ...current,
      createdZones: current.createdZones.some(
        (zone) => zone.id === removedZone.id,
      )
        ? current.createdZones
        : [removedZone, ...current.createdZones],
      selectedZoneId: removedZone.id,
      showSimulated: true,
      filters: { ...current.filters, city: removedZone.city },
    }));
    setZoneFocusRequest({ zoneId: removedZone.id, id: ++focusIdRef.current });
    setSubmitMessage({ tone: "success", text: "Exclusão da zona desfeita." });
    setRemovedZone(null);
    requestAnimationFrame(scrollToWorkspace);
  }

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
              "flex items-start justify-between gap-3 rounded-3xl border px-4 py-3 text-sm [overflow-wrap:anywhere]",
              removedZone &&
                "fixed inset-x-3 top-20 z-850 mx-auto max-w-lg shadow-lg",
              submitMessage.tone === "success"
                ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                : "border-rose-300 bg-rose-50 text-rose-900",
            )}
          >
            <div className="min-w-0">
              <p className="break-words leading-6">{submitMessage.text}</p>
              {removedZone ? (
                <button
                  type="button"
                  onClick={undoZoneDeletion}
                  className="mt-1 min-h-9 rounded-lg px-2 text-sm font-semibold underline underline-offset-2 hover:bg-white/60 focus-visible:outline-2 focus-visible:outline-emerald-700"
                >
                  Desfazer exclusão
                </button>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => {
                setSubmitMessage(null);
                setRemovedZone(null);
              }}
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
                setZoneFocusRequest(null);
                setSession((current) => ({
                  ...current,
                  showSimulated,
                  selectedZoneId: null,
                }));
              }}
              onFiltersChange={(filters) => {
                setPointFocusRequest(null);
                setZoneFocusRequest(null);
                setSession((current) => ({
                  ...current,
                  filters,
                  selectedZoneId: null,
                }));
              }}
              onOpenForm={openManualForm}
              onOpenZone={startZone}
              onClearFilters={clearFilters}
              editingZone={Boolean(zoneDraft)}
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
                zoneDraft={zoneDraft}
                selectedZoneId={selectedZoneId}
                zoneFocusRequest={zoneFocusRequest}
                onSelectZone={selectZone}
                onMoveZoneVertex={moveZoneVertex}
                onUndoZoneVertex={undoZoneVertex}
                onCompleteZone={completeZone}
                onAdjustZone={adjustZone}
                onShowZoneDetails={revealPanel}
                onCancelZone={cancelZone}
              />
            </div>

            {!zoneDraft &&
            filteredPoints.length === 0 &&
            visibleHeatZones.length === 0 ? (
              <div
                role="status"
                className={cn(
                  "absolute left-4 right-16 z-500 max-w-sm rounded-xl border border-emerald-950/10 bg-white/95 p-3 text-xs text-emerald-950 shadow-sm",
                  baseMapStatus === "ready" ? "top-16" : "top-36",
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
            panelTitle={
              zoneDraft
                ? zoneDraft.editingId
                  ? "Editar zona"
                  : "Nova zona simulada"
                : selectedZone
                  ? "Detalhes da zona"
                  : undefined
            }
            contentKey={
              zoneDraft
                ? `zone-${zoneDraft.editingId ?? "new"}-${zoneDraft.stage}`
                : selectedZone
                  ? `zone-${selectedZone.id}`
                  : undefined
            }
            onEscape={zoneDraft ? cancelZone : undefined}
            mapRef={mapSectionRef}
            workspaceRef={workspaceRef}
          >
            {zoneDraft || selectedZone ? (
              <ZonePanel
                draft={zoneDraft}
                zone={selectedZone}
                onDraftChange={(zoneDraft) =>
                  setSession((current) => ({ ...current, zoneDraft }))
                }
                onComplete={completeZone}
                onAdjust={adjustZone}
                onCancel={cancelZone}
                onSave={saveZone}
                onEdit={editZone}
                onDelete={deleteZone}
                onBack={() =>
                  setSession((current) => ({
                    ...current,
                    selectedZoneId: null,
                  }))
                }
              />
            ) : (
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
                createdZones={visibleHeatZones.filter(
                  (zone) => zone.createdInSession,
                )}
                onSelectZone={selectZone}
              />
            )}
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
