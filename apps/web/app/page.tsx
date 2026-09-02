import ShadowMapDashboard from "@/components/ShadowMapDashboard";
import heatZonesData from "@/data/heatZones.json";
import pointsData from "@/data/points.json";
import type { HeatZone, PointFeature } from "@shadowmap/types";

async function fetchPoints(): Promise<PointFeature[]> {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const response = await fetch(`${baseUrl}/api/points`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return pointsData as PointFeature[];
    }

    const data = await response.json();
    return data.length > 0 ? data : (pointsData as PointFeature[]);
  } catch {
    return pointsData as PointFeature[];
  }
}

export default async function Home() {
  const points = await fetchPoints();

  return (
    <ShadowMapDashboard
      initialHeatZones={heatZonesData as HeatZone[]}
      initialPoints={points}
    />
  );
}
