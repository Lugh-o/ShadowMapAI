"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import type {
  FiltersState,
  HeatZone,
  PointFeature,
} from "@shadowmap/types";
import type { PointFormDraft } from "@/lib/point-validation";
import type { DashboardParams } from "@/lib/dashboard";
import type { ZoneDraft } from "@/lib/zone-geometry";
import {
  DEFAULT_MAP_CENTER,
  derivePriority,
  inferCityFromCoordinates,
} from "@/lib/utils";

export interface MapLocation {
  lat: number;
  lng: number;
}

interface DemoSession {
  points: PointFeature[];
  createdZones: HeatZone[];
  zoneDraft: ZoneDraft | null;
  selectedZoneId: string | null;
  filters: FiltersState;
  dashboardFilters: DashboardParams;
  selectedPointId: string | null;
  draftLocation: MapLocation | null;
  draftValues: PointFormDraft | null;
  isFormOpen: boolean;
  showSimulated: boolean;
  isLegendExpanded: boolean | null;
}

interface DemoSessionContextValue {
  session: DemoSession;
  setSession: Dispatch<SetStateAction<DemoSession>>;
}

const DemoSessionContext = createContext<DemoSessionContextValue | null>(null);

export function createPointDraft(location?: MapLocation): PointFormDraft {
  return {
    city: location
      ? inferCityFromCoordinates(location.lat, location.lng)
      : "Salvador",
    neighborhood: "",
    lat: location?.lat ?? DEFAULT_MAP_CENTER[0],
    lng: location?.lng ?? DEFAULT_MAP_CENTER[1],
    heatLevel: "high",
    shadeLevel: "low",
    issueType: "low_tree_cover",
    description: "",
    priority: derivePriority("high", "low"),
  };
}

export default function DemoSessionProvider({
  children,
  initialPoints,
}: {
  children: ReactNode;
  initialPoints: PointFeature[];
}) {
  const [session, setSession] = useState<DemoSession>(() => ({
    points: initialPoints,
    createdZones: [],
    zoneDraft: null,
    selectedZoneId: null,
    filters: { city: "Salvador", issueType: "all", priority: "all" },
    dashboardFilters: { city: "all", days: "all" },
    selectedPointId: initialPoints[0]?.id ?? null,
    draftLocation: null,
    draftValues: null,
    isFormOpen: false,
    showSimulated: true,
    isLegendExpanded: null,
  }));
  const value = useMemo(() => ({ session, setSession }), [session]);
  return <DemoSessionContext value={value}>{children}</DemoSessionContext>;
}

export function useDemoSession() {
  const context = useContext(DemoSessionContext);
  if (!context) throw new Error("useDemoSession requires DemoSessionProvider");
  return context;
}
