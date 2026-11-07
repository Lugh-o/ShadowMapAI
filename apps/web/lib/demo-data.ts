import pointsData from "@/data/points.json";
import type { PointFeature } from "@shadowmap/types";

export function createDemoPoints(now = new Date()): PointFeature[] {
  return (pointsData as PointFeature[]).map((point, index) => ({
    ...point,
    dataOrigin: "simulated",
    moderationStatus: "approved",
    submittedAt: new Date(now.getTime() - index * 2 * 86_400_000).toISOString(),
  }));
}
