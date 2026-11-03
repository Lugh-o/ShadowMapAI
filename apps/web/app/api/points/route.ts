import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { haversineMeters, isInsideBBox } from "@/lib/geo";
import { prisma } from "@/lib/db";
import { normalizePilotRef } from "@/lib/pilot-ref";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { derivePriority } from "@/lib/utils";
import { pointSubmissionSchema } from "@/lib/validation";
import type { ModerationStatus } from "@shadowmap/types";

const DUPLICATE_RADIUS_METERS = 30;
const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;
const DUPLICATE_PREFILTER_DEGREES = 0.001;
const USER_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const USER_HOURLY_LIMIT = Number.parseInt(
  process.env.POINTS_PER_USER_PER_HOUR || "10",
  10,
);

const publicPointSelect = {
  id: true,
  city: true,
  neighborhood: true,
  lat: true,
  lng: true,
  heatLevel: true,
  shadeLevel: true,
  issueType: true,
  description: true,
  priority: true,
  moderationStatus: true,
  dataOrigin: true,
  aiAssisted: true,
  submittedAt: true,
} as const;

export async function GET(request: Request) {
  // Rate limit em memória: melhor esforço. Em serverless cada instância tem
  // seu próprio Map, então não substitui um limite distribuído.
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(ip);

  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  const origin = searchParams.get("origin");

  const where: {
    moderationStatus: ModerationStatus;
    city?: string;
    dataOrigin?: string;
  } = {
    moderationStatus: "approved",
  };

  if (city && city !== "all") {
    where.city = city;
  }

  if (origin === "collected" || origin === "simulated") {
    where.dataOrigin = origin;
  }

  const points = await prisma.pointFeature.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: publicPointSelect,
  });

  return NextResponse.json(points);
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Faça login para enviar um relato." },
      { status: 401 },
    );
  }

  // Rate limit em memória: melhor esforço, apenas por IP e sem persistência.
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(ip);

  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = pointSubmissionSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Dados inválidos.",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const data = parsed.data;

  if (!isInsideBBox(data.lat, data.lng)) {
    return NextResponse.json(
      {
        code: "OUT_OF_REGION",
        error:
          "Este local está fora da região do projeto. Marque um ponto em Salvador, Camaçari, Lauro de Freitas ou Simões Filho.",
      },
      { status: 422 },
    );
  }

  const since = new Date(Date.now() - DUPLICATE_WINDOW_MS);

  const nearbyCandidates = await prisma.pointFeature.findMany({
    where: {
      issueType: data.issueType,
      moderationStatus: { not: "rejected" },
      createdAt: { gte: since },
      lat: {
        gte: data.lat - DUPLICATE_PREFILTER_DEGREES,
        lte: data.lat + DUPLICATE_PREFILTER_DEGREES,
      },
      lng: {
        gte: data.lng - DUPLICATE_PREFILTER_DEGREES,
        lte: data.lng + DUPLICATE_PREFILTER_DEGREES,
      },
    },
    select: { lat: true, lng: true },
  });

  const isDuplicate = nearbyCandidates.some(
    (candidate) =>
      haversineMeters(data.lat, data.lng, candidate.lat, candidate.lng) <=
      DUPLICATE_RADIUS_METERS,
  );

  if (isDuplicate) {
    return NextResponse.json(
      {
        code: "DUPLICATE",
        error:
          "Já existe um relato parecido muito perto deste local nas últimas 24 horas.",
      },
      { status: 409 },
    );
  }

  const recentPoints = await prisma.pointFeature.count({
    where: {
      submittedBy: session.user.id,
      createdAt: { gte: new Date(Date.now() - USER_LIMIT_WINDOW_MS) },
    },
  });

  if (recentPoints >= USER_HOURLY_LIMIT) {
    return NextResponse.json(
      {
        error:
          "Você atingiu o limite de relatos por hora. Tente novamente mais tarde.",
      },
      { status: 429 },
    );
  }

  const point = await prisma.pointFeature.create({
    data: {
      city: data.city,
      neighborhood: data.neighborhood,
      lat: data.lat,
      lng: data.lng,
      heatLevel: data.heatLevel,
      shadeLevel: data.shadeLevel,
      issueType: data.issueType,
      description: data.description,
      priority:
        data.priority ?? derivePriority(data.heatLevel, data.shadeLevel),
      moderationStatus: "pending",
      dataOrigin: "collected",
      aiAssisted: data.aiAssisted ?? false,
      ref: normalizePilotRef(data.ref),
      submittedBy: session.user.id,
    },
    select: publicPointSelect,
  });

  return NextResponse.json(point, { status: 201 });
}
