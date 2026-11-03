import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { normalizePilotRef } from "@/lib/pilot-ref";
import { loadAssistantContext } from "@/lib/assistant/context";
import {
  AssistantUnavailableError,
  generateAssistantReply,
  type GeminiHistoryMessage,
} from "@/lib/assistant/gemini";
import { consumeAssistantQuota } from "@/lib/assistant/quota";
import { buildSystemPrompt } from "@/lib/assistant/system-prompt";

const bodySchema = z.object({
  conversationId: z.string().min(1).optional(),
  message: z.string().trim().min(1).max(800),
  consent: z.literal(true).optional(),
  ref: z
    .string()
    .trim()
    .max(64)
    .regex(/^[a-z0-9_-]+$/i)
    .optional(),
});

interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

function parseStoredMessages(value: unknown): StoredMessage[] {
  if (!Array.isArray(value)) return [];

  const messages: StoredMessage[] = [];

  for (const item of value) {
    if (
      typeof item === "object" &&
      item !== null &&
      "role" in item &&
      "content" in item &&
      (item.role === "user" || item.role === "assistant") &&
      typeof item.content === "string"
    ) {
      messages.push({
        id: "id" in item && typeof item.id === "string" ? item.id : "",
        role: item.role,
        content: item.content,
        createdAt:
          "createdAt" in item && typeof item.createdAt === "string"
            ? item.createdAt
            : "",
      });
    }
  }

  return messages;
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Faça login para usar o assistente." },
      { status: 401 },
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Mensagem inválida. Use entre 1 e 800 caracteres e não envie histórico.",
      },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const userId = session.user.id;
  const pilotRef = normalizePilotRef(data.ref);

  const user = await prisma.user
    .findUnique({
      where: { id: userId },
      select: { assistantConsentAt: true },
    })
    .catch(() => null);

  if (!user) {
    return NextResponse.json(
      {
        code: "ASSISTANT_UNAVAILABLE",
        error: "O assistente está indisponível no momento.",
      },
      { status: 503 },
    );
  }

  if (!user.assistantConsentAt && data.consent !== true) {
    return NextResponse.json(
      {
        code: "CONSENT_REQUIRED",
        error:
          "É necessário concordar com o aviso do assistente antes de continuar.",
      },
      { status: 403 },
    );
  }

  if (data.consent === true && !user.assistantConsentAt) {
    const consentSaved = await prisma.user
      .update({
        where: { id: userId },
        data: { assistantConsentAt: new Date() },
      })
      .then(() => true)
      .catch(() => false);

    if (!consentSaved) {
      return NextResponse.json(
        {
          code: "ASSISTANT_UNAVAILABLE",
          error: "O assistente está indisponível no momento.",
        },
        { status: 503 },
      );
    }
  }

  let conversation = null;

  if (data.conversationId) {
    conversation = await prisma.assistantConversation
      .findFirst({
        where: { id: data.conversationId, userId },
      })
      .catch(() => null);

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversa não encontrada." },
        { status: 404 },
      );
    }
  }

  const quota = await consumeAssistantQuota(userId);

  if (!quota.ok) {
    if (quota.reason === "UNAVAILABLE") {
      return NextResponse.json(
        {
          code: "ASSISTANT_UNAVAILABLE",
          error: "O assistente está indisponível no momento.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        code: quota.reason,
        error:
          quota.reason === "USER_LIMIT"
            ? "Você atingiu o limite diário de mensagens."
            : "O limite diário do assistente foi atingido.",
      },
      { status: 429 },
    );
  }

  let context;

  try {
    context = await loadAssistantContext();
  } catch (error) {
    console.error(
      "Falha ao carregar contexto do assistente:",
      error instanceof Error ? error.name : "erro desconhecido",
    );

    return NextResponse.json(
      {
        code: "ASSISTANT_UNAVAILABLE",
        error: "O assistente está indisponível no momento.",
      },
      { status: 503 },
    );
  }

  const storedMessages = conversation
    ? parseStoredMessages(conversation.messages)
    : [];

  const history: GeminiHistoryMessage[] = storedMessages
    .slice(-12)
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));

  let content: string;

  try {
    content = await generateAssistantReply({
      systemPrompt: buildSystemPrompt(context),
      history,
      message: data.message,
    });
  } catch (error) {
    if (!(error instanceof AssistantUnavailableError)) {
      console.error(
        "Erro inesperado no assistente:",
        error instanceof Error ? error.name : "erro desconhecido",
      );
    }

    return NextResponse.json(
      {
        code: "ASSISTANT_UNAVAILABLE",
        error: "O assistente está indisponível no momento.",
      },
      { status: 503 },
    );
  }

  const now = new Date().toISOString();
  const userMessage: StoredMessage = {
    id: crypto.randomUUID(),
    role: "user",
    content: data.message,
    createdAt: now,
  };
  const assistantMessage: StoredMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    content,
    createdAt: now,
  };
  const messages = [...storedMessages, userMessage, assistantMessage];

  let conversationId: string;

  try {
    if (conversation) {
      await prisma.assistantConversation.update({
        where: { id: conversation.id },
        data: {
          messages: messages as unknown as Prisma.InputJsonValue,
          ref: pilotRef ?? conversation.ref,
        },
      });

      conversationId = conversation.id;
    } else {
      const created = await prisma.assistantConversation.create({
        data: {
          sessionId: crypto.randomUUID(),
          userId,
          ref: pilotRef,
          messages: messages as unknown as Prisma.InputJsonValue,
        },
      });

      conversationId = created.id;
    }
  } catch (error) {
    console.error(
      "Falha ao salvar conversa do assistente:",
      error instanceof Error ? error.name : "erro desconhecido",
    );

    return NextResponse.json(
      {
        code: "ASSISTANT_UNAVAILABLE",
        error: "O assistente está indisponível no momento.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    conversationId,
    messageId: assistantMessage.id,
    content,
    quota: { userRemaining: quota.userRemaining },
  });
}
