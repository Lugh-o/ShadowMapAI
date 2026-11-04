import ShadowMapDashboard from "@/components/ShadowMapDashboard";
import heatZonesData from "@/data/heatZones.json";
import pointsData from "@/data/points.json";
import type { HeatZone, PointFeature } from "@shadowmap/types";

// Dados de demonstração: nada é lido do banco e nenhum cadastro é persistido.
const simulatedPoints: PointFeature[] = (pointsData as PointFeature[]).map(
  (point, index) => ({
    ...point,
    dataOrigin: "simulated",
    moderationStatus: "approved",
    submittedAt: new Date(
      Date.UTC(2026, 10, 4, 12 - index),
    ).toISOString(),
  }),
);

const salvadorHeatZones = (heatZonesData as HeatZone[]).filter(
  (zone) => zone.city === "Salvador",
);

export default function Home() {
  return (
    <ShadowMapDashboard
      initialHeatZones={salvadorHeatZones}
      initialPoints={simulatedPoints}
    />
  );
}
