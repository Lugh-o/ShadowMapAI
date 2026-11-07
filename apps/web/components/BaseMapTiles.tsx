"use client";

import type { TileLayer as LeafletTileLayer } from "leaflet";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { TileLayer } from "react-leaflet";

import type { BaseMapStatus } from "@/lib/map-view";

export default function BaseMapTiles({
  onStatusChange,
}: {
  onStatusChange: (status: BaseMapStatus) => void;
}) {
  const layerRef = useRef<LeafletTileLayer>(null);
  const timerRef = useRef<number | null>(null);
  const errorsRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const hasLoadedTiles = useCallback(() => {
    const tiles = layerRef.current
      ?.getContainer()
      ?.querySelectorAll<HTMLImageElement>("img.leaflet-tile");
    return Array.from(tiles ?? []).some(
      (tile) => tile.complete && tile.naturalWidth > 0,
    );
  }, []);

  const finishLoading = useCallback(
    (timedOut = false) => {
      clearTimer();
      const hasTiles = hasLoadedTiles();
      onStatusChange(
        errorsRef.current > 0 || timedOut || !hasTiles
          ? hasTiles
            ? "partial-error"
            : "error"
          : "ready",
      );
    },
    [clearTimer, hasLoadedTiles, onStatusChange],
  );

  const beginLoading = useCallback(() => {
    clearTimer();
    errorsRef.current = 0;
    onStatusChange("loading");
    timerRef.current = window.setTimeout(() => finishLoading(true), 15_000);
  }, [clearTimer, finishLoading, onStatusChange]);

  const eventHandlers = useMemo(
    () => ({
      loading: beginLoading,
      tileerror: () => {
        errorsRef.current += 1;
      },
      load: () => finishLoading(),
    }),
    [beginLoading, finishLoading],
  );

  useEffect(() => {
    beginLoading();
    if (!layerRef.current?.isLoading()) finishLoading();
    return clearTimer;
  }, [beginLoading, finishLoading, clearTimer]);

  return (
    <TileLayer
      ref={layerRef}
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      eventHandlers={eventHandlers}
    />
  );
}
