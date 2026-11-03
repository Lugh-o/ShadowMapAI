import ShadowMapDashboard from "@/components/ShadowMapDashboard";
import heatZonesData from "@/data/heatZones.json";
import { prisma } from "@/lib/db";
import type {
  HeatLevel,
  HeatZone,
  IssueType,
  PointFeature,
  Priority,
  ShadeLevel,
} from "@shadowmap/types";

// A página lê o banco a cada requisição: não deve ser pré-renderizada no build.
export const dynamic = "force-dynamic";

async function getApprovedPoints(): Promise<PointFeature[]> {
  const points = await prisma.pointFeature.findMany({
    where: { moderationStatus: "approved" },
    orderBy: { createdAt: "desc" },
  });

  // Regra de ouro: só é "collected" o que declara explicitamente essa origem.
  return points.map((point) => ({
    id: point.id,
    city: point.city as PointFeature["city"],
    neighborhood: point.neighborhood,
    lat: point.lat,
    lng: point.lng,
    heatLevel: point.heatLevel as HeatLevel,
    shadeLevel: point.shadeLevel as ShadeLevel,
    issueType: point.issueType as IssueType,
    description: point.description,
    priority: point.priority as Priority,
    moderationStatus: point.moderationStatus as PointFeature["moderationStatus"],
    dataOrigin: point.dataOrigin === "collected" ? "collected" : "simulated",
    ref: point.ref,
    aiAssisted: point.aiAssisted,
    submittedAt: point.submittedAt.toISOString(),
  }));
}

export default async function Home() {
  const points = await getApprovedPoints();

  return (
    <ShadowMapDashboard
      initialHeatZones={heatZonesData as HeatZone[]}
      initialPoints={points}
    />
  );
}
