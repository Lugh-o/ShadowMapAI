import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

const moderationStatusSchema = z.enum(["pending", "approved", "rejected"]);

const patchSchema = z.object({
  id: z.string().min(1),
  status: moderationStatusSchema,
});

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");

  if (statusParam !== null) {
    const parsedStatus = moderationStatusSchema.safeParse(statusParam);

    if (!parsedStatus.success) {
      return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    }
  }

  const points = await prisma.pointFeature.findMany({
    where: statusParam ? { moderationStatus: statusParam } : {},
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(points);
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Id e status válidos são obrigatórios." },
      { status: 400 },
    );
  }

  const existing = await prisma.pointFeature.findUnique({
    where: { id: parsed.data.id },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Ponto não encontrado." },
      { status: 404 },
    );
  }

  const point = await prisma.pointFeature.update({
    where: { id: parsed.data.id },
    data: { moderationStatus: parsed.data.status },
  });

  return NextResponse.json(point);
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Id obrigatório." }, { status: 400 });
  }

  const existing = await prisma.pointFeature.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Ponto não encontrado." },
      { status: 404 },
    );
  }

  await prisma.pointFeature.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
