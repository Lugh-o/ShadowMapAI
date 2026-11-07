"use client";

import L from "leaflet";
import type { Marker as LeafletMarker } from "leaflet";
import { useEffect, useRef } from "react";
import { Marker, Polygon, Polyline, useMap } from "react-leaflet";

import { getHeatZoneColor } from "@/lib/utils";
import { getZoneGeometryError } from "@/lib/zone-geometry";
import type { ZoneCoordinate, ZoneDraft } from "@/lib/zone-geometry";

const vertexIcon = L.divIcon({
  className: "zone-vertex",
  html: '<span aria-hidden="true"></span>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

interface ZoneDrawingLayerProps {
  draft: ZoneDraft;
  onMoveVertex: (index: number, coordinate: ZoneCoordinate) => void;
}

export default function ZoneDrawingLayer({
  draft,
  onMoveVertex,
}: ZoneDrawingLayerProps) {
  const map = useMap();
  const initialCoordinates = useRef(draft.coordinates);
  const error = getZoneGeometryError(draft.coordinates);
  const color =
    error && draft.coordinates.length >= 3
      ? "#be123c"
      : getHeatZoneColor(draft.intensity);

  useEffect(() => {
    const doubleClickZoomEnabled = map.doubleClickZoom.enabled();
    map.doubleClickZoom.disable();
    return () => {
      if (doubleClickZoomEnabled) map.doubleClickZoom.enable();
    };
  }, [map]);

  useEffect(() => {
    if (!initialCoordinates.current.length) return;
    map.fitBounds(L.latLngBounds(initialCoordinates.current), {
      paddingTopLeft: [40, 120],
      paddingBottomRight: [40, 80],
      maxZoom: 15,
      animate: false,
    });
  }, [map]);

  useEffect(() => {
    map.closePopup();
    if (draft.stage === "drawing")
      map.getContainer().focus({ preventScroll: true });
  }, [map, draft.stage, draft.editingId]);

  return (
    <>
      {draft.coordinates.length >= 3 ? (
        <Polygon
          positions={draft.coordinates}
          interactive={false}
          className="zone-draft-polygon"
          pathOptions={{
            color,
            weight: 3,
            fillColor: color,
            fillOpacity: 0.22,
            dashArray: "6 4",
          }}
        />
      ) : draft.coordinates.length === 2 ? (
        <Polyline
          positions={draft.coordinates}
          interactive={false}
          pathOptions={{ color, weight: 3, dashArray: "6 4" }}
        />
      ) : null}
      {draft.coordinates.map((coordinate, index) => (
        <Marker
          key={index}
          position={coordinate}
          icon={vertexIcon}
          draggable
          autoPan
          keyboard
          bubblingMouseEvents={false}
          title={`Vértice ${index + 1}. Arraste ou use as setas para ajustar.`}
          alt={`Vértice ${index + 1}`}
          eventHandlers={{
            click: (event) => L.DomEvent.stopPropagation(event.originalEvent),
            drag: (event) => {
              const location = map.wrapLatLng(
                (event.target as LeafletMarker).getLatLng(),
              );
              onMoveVertex(index, [location.lat, location.lng]);
            },
            keydown: (event) => {
              const key = event.originalEvent.key;
              const offsets: Record<string, [number, number]> = {
                ArrowLeft: [-10, 0],
                ArrowRight: [10, 0],
                ArrowUp: [0, -10],
                ArrowDown: [0, 10],
              };
              if (!(key in offsets)) return;
              event.originalEvent.preventDefault();
              event.originalEvent.stopPropagation();
              const point = map.project(coordinate, map.getZoom());
              const location = map.wrapLatLng(
                map.unproject(point.add(offsets[key]), map.getZoom()),
              );
              onMoveVertex(index, [location.lat, location.lng]);
            },
          }}
        />
      ))}
    </>
  );
}
