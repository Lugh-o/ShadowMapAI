import { prisma } from "@/lib/db";
import {
  CITY_OPTIONS,
  getHeatLevelLabel,
  getIssueTypeLabel,
  getShadeLevelLabel,
  HEAT_LEVEL_OPTIONS,
  ISSUE_OPTIONS,
  SHADE_LEVEL_OPTIONS,
} from "@/lib/utils";
import type {
  City,
  HeatLevel,
  IssueType,
  Priority,
  ShadeLevel,
} from "@shadowmap/types";

export type DashboardOrigin = "collected" | "all";
export type DashboardPeriod = 7 | 30 | "all";

export interface DashboardParams {
  origin: DashboardOrigin;
  city: City | "all";
  days: DashboardPeriod;
  includePending?: boolean;
}

export interface DashboardTotals {
  approved: number;
  highCritical: number;
  neighborhoods: number;
  aiAssistedPercent: number;
  pending: number | null;
}

export interface NeighborhoodRank {
  key: string;
  name: string;
  city: City;
  count: number;
  highCritical: number;
  score: number;
  smallSample: boolean;
}

export interface DistributionRow {
  key: string;
  label: string;
  count: number;
}

export interface DailyRow {
  date: string;
  count: number;
}

export interface RecentPoint {
  id: string;
  neighborhood: string;
  city: City;
  issueType: IssueType;
  priority: Priority;
  createdAt: string;
  dataOrigin: "collected" | "simulated";
}

export interface DashboardData {
  params: Omit<DashboardParams, "includePending">;
  totals: DashboardTotals;
  collectedCount: number;
  ranking: NeighborhoodRank[];
  distributions: {
    issueType: DistributionRow[];
    heatLevel: DistributionRow[];
    shadeLevel: DistributionRow[];
  };
  daily: DailyRow[];
  recent: RecentPoint[];
}

const PRIORITY_WEIGHTS: Record<Priority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const DAY_MS = 24 * 60 * 60 * 1000;

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function toDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseDashboardParams(values: {
  origin?: string | null;
  city?: string | null;
  days?: string | null;
}): DashboardParams {
  const origin: DashboardOrigin =
    values.origin === "all" ? "all" : "collected";

  const city = CITY_OPTIONS.includes(values.city as City)
    ? (values.city as City)
    : "all";

  const days: DashboardPeriod =
    values.days === "7" ? 7 : values.days === "30" ? 30 : "all";

  return { origin, city, days };
}

function mostFrequentSpelling(spellings: Map<string, number>): string {
  return [...spellings.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0], "pt-BR");
  })[0][0];
}

export async function getDashboardData(
  input: DashboardParams,
): Promise<DashboardData> {
  const { origin, city, days, includePending = false } = input;

  const cityFilter = city === "all" ? {} : { city };
  const originFilter =
    origin === "collected" ? { dataOrigin: "collected" } : {};

  const [points, collectedCount, pending] = await Promise.all([
    prisma.pointFeature.findMany({
      where: {
        moderationStatus: "approved",
        ...cityFilter,
        ...originFilter,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        city: true,
        neighborhood: true,
        issueType: true,
        heatLevel: true,
        shadeLevel: true,
        priority: true,
        dataOrigin: true,
        aiAssisted: true,
        createdAt: true,
      },
    }),
    prisma.pointFeature.count({
      where: {
        moderationStatus: "approved",
        dataOrigin: "collected",
        ...cityFilter,
      },
    }),
    includePending
      ? prisma.pointFeature.count({ where: { moderationStatus: "pending" } })
      : Promise.resolve(null),
  ]);

  const cutoff =
    days === "all" ? null : new Date(Date.now() - days * DAY_MS);

  const filteredPoints = cutoff
    ? points.filter((point) => point.createdAt >= cutoff)
    : points;

  const groups = new Map<
    string,
    {
      city: City;
      spellings: Map<string, number>;
      count: number;
      highCritical: number;
      score: number;
    }
  >();

  for (const point of filteredPoints) {
    const normalized = normalizeText(point.neighborhood);
    const key = `${point.city}|${normalized}`;
    const priority = point.priority as Priority;
    const group = groups.get(key) ?? {
      city: point.city as City,
      spellings: new Map<string, number>(),
      count: 0,
      highCritical: 0,
      score: 0,
    };

    const spelling = point.neighborhood.trim();
    group.spellings.set(spelling, (group.spellings.get(spelling) ?? 0) + 1);
    group.count += 1;
    group.score += PRIORITY_WEIGHTS[priority] ?? 1;

    if (priority === "critical" || priority === "high") {
      group.highCritical += 1;
    }

    groups.set(key, group);
  }

  const ranking: NeighborhoodRank[] = [...groups.entries()]
    .map(([key, group]) => ({
      key,
      name: mostFrequentSpelling(group.spellings),
      city: group.city,
      count: group.count,
      highCritical: group.highCritical,
      score: group.score,
      smallSample: group.count < 3,
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name, "pt-BR");
    })
    .slice(0, 10);

  const highCritical = filteredPoints.filter(
    (point) => point.priority === "critical" || point.priority === "high",
  ).length;
  const aiAssistedCount = filteredPoints.filter(
    (point) => point.aiAssisted,
  ).length;

  const distribution = <T extends string>(
    options: T[],
    values: T[],
    labeler: (value: T) => string,
  ): DistributionRow[] =>
    options.map((option) => ({
      key: option,
      label: labeler(option),
      count: values.filter((value) => value === option).length,
    }));

  const dailyMap = new Map<string, number>();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const dailyStart = new Date(today.getTime() - 29 * DAY_MS);

  for (const point of points) {
    if (point.createdAt < dailyStart) continue;

    const key = toDayKey(point.createdAt);
    dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1);
  }

  const daily: DailyRow[] = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(dailyStart.getTime() + index * DAY_MS);
    const key = toDayKey(date);

    return { date: key, count: dailyMap.get(key) ?? 0 };
  });

  return {
    params: { origin, city, days },
    totals: {
      approved: filteredPoints.length,
      highCritical,
      neighborhoods: groups.size,
      aiAssistedPercent:
        filteredPoints.length > 0
          ? Math.round((aiAssistedCount / filteredPoints.length) * 100)
          : 0,
      pending,
    },
    collectedCount,
    ranking,
    distributions: {
      issueType: distribution(
        ISSUE_OPTIONS,
        filteredPoints.map((point) => point.issueType as IssueType),
        getIssueTypeLabel,
      ),
      heatLevel: distribution(
        HEAT_LEVEL_OPTIONS,
        filteredPoints.map((point) => point.heatLevel as HeatLevel),
        getHeatLevelLabel,
      ),
      shadeLevel: distribution(
        SHADE_LEVEL_OPTIONS,
        filteredPoints.map((point) => point.shadeLevel as ShadeLevel),
        getShadeLevelLabel,
      ),
    },
    daily,
    recent: filteredPoints.slice(0, 10).map((point) => ({
      id: point.id,
      neighborhood: point.neighborhood,
      city: point.city as City,
      issueType: point.issueType as IssueType,
      priority: point.priority as Priority,
      createdAt: point.createdAt.toISOString(),
      dataOrigin:
        point.dataOrigin === "collected" ? "collected" : "simulated",
    })),
  };
}
