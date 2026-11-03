import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { normalizePilotRef } from "@/lib/pilot-ref";

const FEEDBACK_WINDOW_MS = 60 * 60 * 1000;
const FEEDBACK_HOURLY_LIMIT = 20;

const feedbackSchema = z.object({
  targetType: z.enum(["assistant_message", "point_submitted", "app"]),
  targetId: z.string().trim().min(1).max(128).optional(),
  rating: z
    .number()
    .int()
    .refine((value) => value === -1 || (value >= 1 && value <= 5), {
      message: "A nota deve estar entre 1 e 5.",
    }),
  comment: z.string().trim().max(500).optional(),
  ref: z.string().trim().max(64).optional(),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Faça login para enviar feedback." },
      { status: 401 },
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = feedbackSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Feedback inválido. Confira a nota e o comentário." },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const userId = session.user.id;

  let recentCount: number;

  try {
    recentCount = await prisma.feedback.count({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - FEEDBACK_WINDOW_MS) },
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível registrar o feedback agora." },
      { status: 503 },
    );
  }

  if (recentCount >= FEEDBACK_HOURLY_LIMIT) {
    return NextResponse.json(
      {
        code: "FEEDBACK_LIMIT",
        error: "Você enviou muitos feedbacks na última hora. Tente mais tarde.",
      },
      { status: 429 },
    );
  }

  try {
    const feedback = await prisma.feedback.create({
      data: {
        userId,
        ref: normalizePilotRef(data.ref),
        targetType: data.targetType,
        targetId: data.targetId ?? null,
        rating: data.rating,
        comment: data.comment && data.comment.length > 0 ? data.comment : null,
      },
      select: { id: true, createdAt: true },
    });

    return NextResponse.json(feedback, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível registrar o feedback agora." },
      { status: 503 },
    );
  }
}
