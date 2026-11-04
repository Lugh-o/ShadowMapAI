"use client";

import L from "leaflet";
import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
  ZoomControl,
} from "react-leaflet";

import HeatZoneLayer from "@/components/HeatZoneLayer";
import PointMarkers from "@/components/PointMarkers";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "@/lib/utils";
import type { HeatZone, PointFeature } from "@shadowmap/types";

interface MapViewProps {
  points: PointFeature[];
  visibleHeatZones: HeatZone[];
  selectedPointId: string | null;
  draftLocation: { lat: number; lng: number } | null;
  onSelectPoint: (pointId: string) => void;
  onMapPick: (location: { lat: number; lng: number }) => void;
}

export default function MapView({
  points,
  visibleHeatZones,
  selectedPointId,
  draftLocation,
  onSelectPoint,
  onMapPick,
}: MapViewProps) {
  return (
    <div className="h-full min-h-[64svh] overflow-hidden rounded-[26px] md:min-h-[62vh]">
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
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ZoomControl position="topright" />
        <MapInteractions onMapPick={onMapPick} />
        <FitToVisibleData points={points} zones={visibleHeatZones} />

        <HeatZoneLayer zones={visibleHeatZones} />
        <PointMarkers
          points={points}
          selectedPointId={selectedPointId}
          onSelectPoint={onSelectPoint}
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
    </div>
  );
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
  points,
  zones,
}: {
  points: PointFeature[];
  zones: HeatZone[];
}) {
  const map = useMap();

  useEffect(() => {
    const coordinates: [number, number][] = [
      ...points.map((point) => [point.lat, point.lng] as [number, number]),
      ...zones.flatMap((zone) => zone.coordinates),
    ];

    if (!coordinates.length) {
      map.setView(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM);
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
  }, [map, points, zones]);

  return null;
}
