import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { PointFormValues, ModerationStatus } from "@shadowmap/types";

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as ModerationStatus | null;
  const city = searchParams.get("city");

  const where: Record<string, unknown> = {};

  if (status) {
    where.moderationStatus = status;
  } else {
    where.moderationStatus = "approved";
  }

  if (city && city !== "all") {
    where.city = city;
  }

  const points = await prisma.pointFeature.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(points);
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed, remaining } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  let body: PointFormValues;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.city || !body.neighborhood || !body.lat || !body.lng || !body.issueType || !body.description) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (body.lat < -90 || body.lat > 90 || body.lng < -180 || body.lng > 180) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const point = await prisma.pointFeature.create({
    data: {
      city: body.city,
      neighborhood: body.neighborhood,
      lat: body.lat,
      lng: body.lng,
      heatLevel: body.heatLevel || "medium",
      shadeLevel: body.shadeLevel || "moderate",
      issueType: body.issueType,
      description: body.description,
      priority: body.priority || "medium",
      moderationStatus: "pending",
      submittedBy: ip,
    },
  });

  return NextResponse.json(point, {
    status: 201,
    headers: { "X-RateLimit-Remaining": String(remaining) },
  });
}
