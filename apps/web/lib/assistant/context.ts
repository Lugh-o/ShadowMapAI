import { nativeSpecies } from "@shadowmap/species-data";
import type { NativeSpecies } from "@shadowmap/types";

import { prisma } from "@/lib/db";

export interface ReportAggregates {
  total: number;
  topNeighborhoods: Array<{ neighborhood: string; count: number }>;
  issueTypes: Array<{ issueType: string; count: number }>;
}

export interface AssistantContext {
  species: NativeSpecies[];
  reports: ReportAggregates;
}

export async function loadAssistantContext(): Promise<AssistantContext> {
  // Espécies sem fonte revisada ficam fora do prompt.
  const species = nativeSpecies.filter((item) => item.source.trim().length > 0);

  const points = await prisma.pointFeature.findMany({
    where: { moderationStatus: "approved", dataOrigin: "collected" },
    select: { neighborhood: true, issueType: true },
  });

  const neighborhoodCounts = new Map<string, number>();
  const issueTypeCounts = new Map<string, number>();

  for (const point of points) {
    neighborhoodCounts.set(
      point.neighborhood,
      (neighborhoodCounts.get(point.neighborhood) ?? 0) + 1,
    );
    issueTypeCounts.set(
      point.issueType,
      (issueTypeCounts.get(point.issueType) ?? 0) + 1,
    );
  }

  return {
    species,
    reports: {
      total: points.length,
      topNeighborhoods: [...neighborhoodCounts.entries()]
        .sort((first, second) => second[1] - first[1])
        .slice(0, 5)
        .map(([neighborhood, count]) => ({ neighborhood, count })),
      issueTypes: [...issueTypeCounts.entries()]
        .sort((first, second) => second[1] - first[1])
        .map(([issueType, count]) => ({ issueType, count })),
    },
  };
}
