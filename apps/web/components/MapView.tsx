"use client";

import L from "leaflet";
import { useEffect, useState } from "react";
import { Crosshair, LoaderCircle, RefreshCw } from "lucide-react";
import {
  CircleMarker,
  MapContainer,
  Tooltip,
  useMap,
  useMapEvents,
  ZoomControl,
} from "react-leaflet";

import HeatZoneLayer from "@/components/HeatZoneLayer";
import BaseMapTiles from "@/components/BaseMapTiles";
import PointMarkers from "@/components/PointMarkers";
import {
  CITY_CENTERS,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
} from "@/lib/utils";
import type { FiltersState, HeatZone, PointFeature } from "@shadowmap/types";
import type { BaseMapStatus, PointFocusRequest } from "@/lib/map-view";

interface MapViewProps {
  city: FiltersState["city"];
  points: PointFeature[];
  visibleHeatZones: HeatZone[];
  selectedPointId: string | null;
  draftLocation: { lat: number; lng: number } | null;
  onSelectPoint: (pointId: string) => void;
  onMapPick: (location: { lat: number; lng: number }) => void;
  focusRequest: PointFocusRequest | null;
  recenterRequest: number;
  onRecenter: () => void;
  baseMapStatus: BaseMapStatus;
  onBaseMapStatusChange: (status: BaseMapStatus) => void;
}

export default function MapView({
  city,
  points,
  visibleHeatZones,
  selectedPointId,
  draftLocation,
  onSelectPoint,
  onMapPick,
  focusRequest,
  recenterRequest,
  onRecenter,
  baseMapStatus,
  onBaseMapStatusChange,
}: MapViewProps) {
  const [tileAttempt, setTileAttempt] = useState(0);
  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden rounded-2xl">
      <MapContainer
        center={DEFAULT_MAP_CENTER}
        zoom={DEFAULT_MAP_ZOOM}
        zoomControl={false}
        doubleClickZoom
        dragging
        scrollWheelZoom
        touchZoom
        className="h-full w-full"
      >
        <BaseMapTiles
          key={tileAttempt}
          onStatusChange={onBaseMapStatusChange}
        />

        <ZoomControl position="topright" />
        <MapSizeObserver />
        <MapInteractions onMapPick={onMapPick} />
        <FitToVisibleData
          city={city}
          points={points}
          zones={visibleHeatZones}
          recenterRequest={recenterRequest}
        />

        <HeatZoneLayer zones={visibleHeatZones} />
        <PointMarkers
          points={points}
          selectedPointId={selectedPointId}
          onSelectPoint={onSelectPoint}
          focusRequest={focusRequest}
          popupTopPadding={baseMapStatus === "ready" ? 12 : 88}
        />

        {draftLocation ? (
          <CircleMarker
            center={[draftLocation.lat, draftLocation.lng]}
            radius={12}
            pathOptions={{
              color: "#064E3B",
              weight: 3,
              fillColor: "#34D399",
              fillOpacity: 0.45,
              dashArray: "4 4",
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} permanent>
              Novo ponto
            </Tooltip>
          </CircleMarker>
        ) : null}
      </MapContainer>
      <button
        type="button"
        onClick={onRecenter}
        aria-label="Recentrar mapa"
        title="Recentrar mapa"
        className="absolute right-2.5 top-20 z-[500] inline-flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-950/15 bg-white/95 text-emerald-950 shadow-sm hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-emerald-700"
      >
        <Crosshair className="h-4 w-4" aria-hidden="true" />
      </button>
      {baseMapStatus !== "ready" ? (
        <div
          role={baseMapStatus === "loading" ? "status" : "alert"}
          className="absolute left-3 right-14 top-3 z-[500] flex max-w-sm flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-emerald-950/10 bg-white/95 px-3 py-2 text-xs text-emerald-950 shadow-sm"
        >
          {baseMapStatus === "loading" ? (
            <>
              <LoaderCircle
                className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
              <span>Carregando mapa base…</span>
            </>
          ) : (
            <>
              <p>
                {baseMapStatus === "partial-error"
                  ? "Mapa base incompleto."
                  : "Mapa base indisponível."}
              </p>
              <button
                type="button"
                onClick={() => {
                  onBaseMapStatusChange("loading");
                  setTileAttempt((value) => value + 1);
                }}
                className="inline-flex min-h-7 items-center gap-1 rounded-lg px-1 font-semibold text-emerald-800 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-emerald-700"
              >
                <RefreshCw className="h-3 w-3" aria-hidden="true" />
                <span>Tentar novamente</span>
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function MapSizeObserver() {
  const map = useMap();

  useEffect(() => {
    let frame = 0;
    const updateSize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        map.invalidateSize({ pan: false });
      });
    };

    const observer = new ResizeObserver(updateSize);
    observer.observe(map.getContainer());
    updateSize();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [map]);

  return null;
}

function MapInteractions({
  onMapPick,
}: {
  onMapPick: (location: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click(event) {
      onMapPick({
        lat: Number(event.latlng.lat.toFixed(6)),
        lng: Number(event.latlng.lng.toFixed(6)),
      });
    },
  });

  return null;
}

function FitToVisibleData({
  city,
  points,
  zones,
  recenterRequest,
}: {
  city: FiltersState["city"];
  points: PointFeature[];
  zones: HeatZone[];
  recenterRequest: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.closePopup();
    const coordinates: [number, number][] = [
      ...points.map((point) => [point.lat, point.lng] as [number, number]),
      ...zones.flatMap((zone) => zone.coordinates),
    ];

    if (!coordinates.length) {
      map.setView(
        city === "all" ? DEFAULT_MAP_CENTER : CITY_CENTERS[city],
        DEFAULT_MAP_ZOOM,
      );
      return;
    }

    if (coordinates.length === 1) {
      map.setView(coordinates[0], 13);
      return;
    }

    map.fitBounds(L.latLngBounds(coordinates), {
      padding: [36, 36],
      maxZoom: 12,
    });
  }, [map, city, points, zones, recenterRequest]);

  return null;
}
