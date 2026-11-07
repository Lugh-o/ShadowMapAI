"use client";

import type {
  CircleMarker as LeafletCircleMarker,
  Popup as LeafletPopup,
} from "leaflet";
import { useCallback, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { CircleMarker, Popup, useMap, useMapEvents } from "react-leaflet";

import {
  formatCoordinates,
  getHeatLevelLabel,
  getIssueTypeLabel,
  getPointPriorityColor,
  getPriorityLabel,
  getShadeLevelLabel,
} from "@/lib/utils";
import type { PointFeature } from "@shadowmap/types";
import type { PointFocusRequest } from "@/lib/map-view";

interface PointMarkersProps {
  points: PointFeature[];
  selectedPointId: string | null;
  onSelectPoint: (pointId: string) => void;
  focusRequest: PointFocusRequest | null;
  popupTopPadding: number;
  interactive?: boolean;
}

export default function PointMarkers({
  points,
  selectedPointId,
  onSelectPoint,
  focusRequest,
  popupTopPadding,
  interactive = true,
}: PointMarkersProps) {
  return (
    <>
      {points.map((point) => (
        <PointMarker
          key={`${point.id}-${interactive}`}
          point={point}
          isSelected={point.id === selectedPointId}
          focusToken={focusRequest?.pointId === point.id ? focusRequest.id : 0}
          onSelectPoint={onSelectPoint}
          popupTopPadding={popupTopPadding}
          interactive={interactive}
        />
      ))}
    </>
  );
}

function PointMarker({
  point,
  isSelected,
  focusToken,
  onSelectPoint,
  popupTopPadding,
  interactive,
}: {
  point: PointFeature;
  isSelected: boolean;
  focusToken: number;
  onSelectPoint: (pointId: string) => void;
  popupTopPadding: number;
  interactive: boolean;
}) {
  const markerRef = useRef<LeafletCircleMarker>(null);
  const map = useMap();
  const isSimulated = point.dataOrigin === "simulated";

  useEffect(() => {
    if (!focusToken) return;
    map.setView([point.lat, point.lng], Math.max(map.getZoom(), 14), {
      animate: false,
    });
    markerRef.current?.openPopup();
  }, [focusToken, map, point.lat, point.lng]);

  return (
    <CircleMarker
      ref={markerRef}
      interactive={interactive}
      className="map-point-marker"
      bubblingMouseEvents={false}
      center={[point.lat, point.lng]}
      radius={isSelected ? 10 : 8}
      pathOptions={{
        color: isSimulated ? getPointPriorityColor(point.priority) : "#ffffff",
        weight: isSelected ? 4 : 3,
        dashArray: isSimulated ? "4 3" : undefined,
        fillColor: isSimulated
          ? "#94A3B8"
          : getPointPriorityColor(point.priority),
        fillOpacity: isSimulated ? 0.85 : 0.95,
      }}
      eventHandlers={{
        click: () => onSelectPoint(point.id),
      }}
    >
      <PointPopup topPadding={popupTopPadding}>
        <div className="flex min-w-0 flex-col gap-2 wrap-break-word text-emerald-950">
          <div className="pr-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-950/50">
              {point.city}
            </p>
            <h3 className="font-display text-lg font-semibold">
              {point.neighborhood}
            </h3>
            {isSimulated ? (
              <span className="mt-1 inline-flex rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-700">
                Simulado
              </span>
            ) : null}
          </div>

          <div className="grid gap-1 text-sm">
            <p>
              <strong>Ocorrência:</strong> {getIssueTypeLabel(point.issueType)}
            </p>
            <p>
              <strong>Prioridade:</strong> {getPriorityLabel(point.priority)}
            </p>
            <p>
              <strong>Calor:</strong> {getHeatLevelLabel(point.heatLevel)}
            </p>
            <p>
              <strong>Sombra:</strong> {getShadeLevelLabel(point.shadeLevel)}
            </p>
            <p>
              <strong>Coordenadas:</strong>{" "}
              {formatCoordinates(point.lat, point.lng)}
            </p>
          </div>

          <p className="text-sm leading-5 text-emerald-950/78">
            {point.description}
          </p>

          {isSimulated ? (
            <p className="rounded-xl bg-amber-50 px-2 py-1 text-xs leading-5 text-amber-950">
              Dado de demonstração. Não foi enviado por um morador nem
              representa medição de temperatura.
            </p>
          ) : null}
        </div>
      </PointPopup>
    </CircleMarker>
  );
}

function PointPopup({
  children,
  topPadding,
}: {
  children: ReactNode;
  topPadding: number;
}) {
  const map = useMap();
  const popupRef = useRef<LeafletPopup>(null);

  const updateSize = useCallback(() => {
    const popup = popupRef.current;
    if (!popup) return;

    const { x: width, y: height } = map.getSize();
    // Reserve space for the frame, popup tip, close button and map controls.
    const availableWidth = Math.max(1, width - 96);
    const reservedTop = Math.min(topPadding, Math.max(12, height * 0.22));
    let bottomPadding = window.matchMedia("(min-width: 64rem)").matches
      ? 24
      : 80;
    let leftPadding = 12;
    const container = map.getContainer();
    const legend = container
      .closest("section")
      ?.querySelector<HTMLElement>('[aria-label="Legenda do mapa"]');
    if (legend) {
      const mapBounds = container.getBoundingClientRect();
      const legendBounds = legend.getBoundingClientRect();
      const besideLegend = legendBounds.right - mapBounds.left + 12;
      // Keep the popup beside the legend when wide enough, or above it.
      if (width - besideLegend - 48 >= Math.min(320, availableWidth) + 40) {
        leftPadding = Math.max(12, besideLegend);
      } else {
        bottomPadding = Math.max(
          bottomPadding,
          mapBounds.bottom - legendBounds.top + 8,
        );
      }
    }
    popup.options.minWidth = Math.min(180, availableWidth);
    popup.options.maxWidth = Math.min(320, availableWidth);
    popup.options.autoPanPaddingTopLeft = [leftPadding, reservedTop];
    popup.options.autoPanPaddingBottomRight = [48, bottomPadding];
    popup.options.maxHeight = Math.max(
      1,
      height - reservedTop - bottomPadding - 64,
    );
    popup.update();
  }, [map, topPadding]);

  useMapEvents({ resize: updateSize });
  useEffect(updateSize, [updateSize]);
  useEffect(() => {
    const legend = map
      .getContainer()
      .closest("section")
      ?.querySelector('[aria-label="Legenda do mapa"]');
    if (!legend) return;
    const observer = new ResizeObserver(updateSize);
    observer.observe(legend);
    return () => observer.disconnect();
  }, [map, updateSize]);

  return (
    <Popup
      ref={popupRef}
      className="point-popup"
      autoPan
      keepInView
      autoPanPaddingTopLeft={[12, 12]}
      autoPanPaddingBottomRight={[48, 24]}
      eventHandlers={{ add: updateSize }}
    >
      {children}
    </Popup>
  );
}
