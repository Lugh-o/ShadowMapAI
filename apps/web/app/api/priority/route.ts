import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { PriorityScore, City } from "@shadowmap/types";

function calculatePriorityScore(params: {
  vegetationCoverage: number;
  heatIntensity: number;
  populationDensity: number;
  citizenReports: number;
}): number {
  const vegetationFactor = Math.max(0, 100 - params.vegetationCoverage) * 0.35;
  const heatFactor = params.heatIntensity * 0.30;
  const densityFactor = Math.min(params.populationDensity / 100, 1) * 0.20;
  const reportsFactor = Math.min(params.citizenReports * 10, 100) * 0.15;

  return Math.round((vegetationFactor + heatFactor + densityFactor + reportsFactor) * 10) / 10;
}

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") as City | null;

  const where: Record<string, unknown> = {};
  if (city && city !== "all") {
    where.city = city;
  }

  const [vegetationEstimates, pointCounts] = await Promise.all([
    prisma.vegetationEstimate.findMany({
      where,
      orderBy: { createdAt: "desc" },
      distinct: ["regionId"],
    }),
    prisma.pointFeature.groupBy({
      by: ["neighborhood", "city"],
      where: { moderationStatus: "approved", ...where },
      _count: { id: true },
    }),
  ]);

  const reportCountMap = new Map<string, number>();
  for (const pc of pointCounts) {
    const key = `${pc.city}-${pc.neighborhood}`;
    reportCountMap.set(key, pc._count.id);
  }

  const scores: PriorityScore[] = vegetationEstimates.map((ve) => {
    const key = `${ve.city}-${ve.regionName}`;
    const citizenReports = reportCountMap.get(key) || 0;

    const heatIntensity = Math.min(100, (ve.ndviMean ? (1 - ve.ndviMean) * 100 : 50));
    const populationDensity = 50;

    const score = calculatePriorityScore({
      vegetationCoverage: ve.vegetationCoverage,
      heatIntensity,
      populationDensity,
      citizenReports,
    });

    return {
      regionId: ve.regionId,
      regionName: ve.regionName,
      city: ve.city as City,
      score,
      vegetationCoverage: ve.vegetationCoverage,
      heatIntensity,
      populationDensity,
      citizenReports,
      factors: {
        vegetation: Math.max(0, 100 - ve.vegetationCoverage) * 0.35,
        heat: heatIntensity * 0.30,
        density: (populationDensity / 100) * 100 * 0.20,
        reports: Math.min(citizenReports * 10, 100) * 0.15,
      },
    };
  });

  scores.sort((a, b) => b.score - a.score);

  return NextResponse.json(scores);
}
