import ShadowMapDashboard from "@/components/ShadowMapDashboard";
import heatZonesData from "@/data/heatZones.json";
import type { HeatZone } from "@shadowmap/types";

const salvadorHeatZones = (heatZonesData as HeatZone[]).filter(
  (zone) => zone.city === "Salvador",
);

export default function Home() {
  return <ShadowMapDashboard initialHeatZones={salvadorHeatZones} />;
}
