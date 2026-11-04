import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { csvResponse, toCsv, type CsvValue } from "@/lib/csv";
import { prisma } from "@/lib/db";

type ExportType = "points" | "feedback" | "conversations";

const EXPORT_TYPES: ExportType[] = ["points", "feedback", "conversations"];

function anonymousUser(userId: string | null): string {
  if (!userId) return "anon";

  return `u_${createHash("sha256").update(userId).digest("hex").slice(0, 8)}`;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const admin = await requireAdmin();

  if (!admin.ok) {
    return admin.response;
  }

  const type = new URL(request.url).searchParams.get("type");

  if (!type || !EXPORT_TYPES.includes(type as ExportType)) {
    return NextResponse.json(
      { error: "Tipo de exportação inválido. Use points, feedback ou conversations." },
      { status: 400 },
    );
  }

  try {
    if (type === "points") {
      const points = await prisma.pointFeature.findMany({
        orderBy: { createdAt: "desc" },
        select: {
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
          ref: true,
          aiAssisted: true,
          submittedAt: true,
          createdAt: true,
        },
      });

      const rows: CsvValue[][] = points.map((point) => [
        point.id,
        point.city,
        point.neighborhood,
        point.lat,
        point.lng,
        point.heatLevel,
        point.shadeLevel,
        point.issueType,
        point.description,
        point.priority,
        point.moderationStatus,
        point.dataOrigin,
        point.ref ?? "",
        point.aiAssisted,
        point.submittedAt.toISOString(),
        point.createdAt.toISOString(),
      ]);

      return csvResponse(
        `shadowmap-relatos-${todayKey()}.csv`,
        toCsv(
          [
            "id",
            "cidade",
            "bairro",
            "lat",
            "lng",
            "calor",
            "sombra",
            "tipo",
            "descricao",
            "prioridade",
            "moderacao",
            "origem",
            "ref",
            "apoio_ia",
            "enviado_em",
            "criado_em",
          ],
          rows,
        ),
      );
    }

    if (type === "feedback") {
      const feedback = await prisma.feedback.findMany({
        orderBy: { createdAt: "desc" },
      });

      const rows: CsvValue[][] = feedback.map((item) => [
        item.id,
        item.targetType,
        item.targetId ?? "",
        item.rating,
        item.comment ?? "",
        item.ref ?? "",
        anonymousUser(item.userId),
        item.createdAt.toISOString(),
      ]);

      return csvResponse(
        `shadowmap-feedback-${todayKey()}.csv`,
        toCsv(
          [
            "id",
            "tipo_alvo",
            "id_alvo",
            "nota",
            "comentario",
            "ref",
            "usuario_anonimo",
            "criado_em",
          ],
          rows,
        ),
      );
    }

    const conversations = await prisma.assistantConversation.findMany({
      orderBy: { createdAt: "desc" },
    });

    const rows: CsvValue[][] = [];

    for (const conversation of conversations) {
      const messages = Array.isArray(conversation.messages)
        ? conversation.messages
        : [];

      if (messages.length === 0) {
        rows.push([
          conversation.id,
          anonymousUser(conversation.userId),
          conversation.ref ?? "",
          "",
          "",
          "",
          "",
          conversation.createdAt.toISOString(),
          conversation.updatedAt.toISOString(),
        ]);
        continue;
      }

      messages.forEach((message, index) => {
        const record =
          typeof message === "object" && message !== null
            ? (message as Record<string, unknown>)
            : {};

        rows.push([
          conversation.id,
          anonymousUser(conversation.userId),
          conversation.ref ?? "",
          index + 1,
          typeof record.role === "string" ? record.role : "",
          typeof record.content === "string" ? record.content : "",
          typeof record.createdAt === "string" ? record.createdAt : "",
          conversation.createdAt.toISOString(),
          conversation.updatedAt.toISOString(),
        ]);
      });
    }

    return csvResponse(
      `shadowmap-conversas-${todayKey()}.csv`,
      toCsv(
        [
          "conversa_id",
          "usuario_anonimo",
          "ref",
          "mensagem_indice",
          "papel",
          "conteudo",
          "mensagem_em",
          "conversa_criada_em",
          "conversa_atualizada_em",
        ],
        rows,
      ),
    );
  } catch {
    return NextResponse.json(
      { error: "Não foi possível gerar a exportação agora." },
      { status: 503 },
    );
  }
}
