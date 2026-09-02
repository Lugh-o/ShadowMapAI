import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { ModerationStatus } from "@shadowmap/types";

function verifyAdmin(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const password = process.env.ADMIN_PASSWORD || "shadowmap-admin";

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return false;
  }

  const token = authHeader.slice(6);
  const decoded = atob(token);
  return decoded === password;
}

export async function GET(request: Request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as ModerationStatus | null;

  const where: Record<string, unknown> = {};
  if (status) {
    where.moderationStatus = status;
  }

  const points = await prisma.pointFeature.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(points);
}

export async function PATCH(request: Request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { id: string; status: ModerationStatus };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.id || !body.status) {
    return NextResponse.json({ error: "Id and status required" }, { status: 400 });
  }

  if (!["approved", "rejected", "pending"].includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const point = await prisma.pointFeature.update({
    where: { id: body.id },
    data: { moderationStatus: body.status },
  });

  return NextResponse.json(point);
}

export async function DELETE(request: Request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Id required" }, { status: 400 });
  }

  await prisma.pointFeature.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
