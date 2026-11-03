import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import {
  buildDraftSystemPrompt,
  buildDraftUserMessage,
  draftGeminiSchema,
  normalizeDraft,
} from "@/lib/assistant/draft";
import {
  AssistantUnavailableError,
  generateStructuredJson,
} from "@/lib/assistant/gemini";
import { consumeAssistantQuota } from "@/lib/assistant/quota";

const bodySchema = z.object({
  text: z.string().trim().min(10).max(600),
  city: z
    .enum(["Salvador", "Camaçari", "Lauro de Freitas", "Simões Filho"])
    .optional(),
  neighborhood: z.string().trim().min(2).max(80).optional(),
  ref: z
    .string()
    .trim()
    .max(64)
    .regex(/^[a-z0-9_-]+$/i)
    .optional(),
});

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
          "Relato inválido. Use entre 10 e 600 caracteres e informe cidade/bairro válidos, se houver.",
      },
      { status: 400 },
    );
  }

  const quota = await consumeAssistantQuota(session.user.id);

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

  let raw: unknown;

  try {
    raw = await generateStructuredJson({
      systemPrompt: buildDraftSystemPrompt(),
      message: buildDraftUserMessage(parsed.data),
      responseSchema: draftGeminiSchema,
    });
  } catch (error) {
    if (!(error instanceof AssistantUnavailableError)) {
      console.error(
        "Erro inesperado no rascunho assistido:",
        error instanceof Error ? error.name : "erro desconhecido",
      );
    }

    return NextResponse.json(
      {
        code: "ASSISTANT_UNAVAILABLE",
        error: "Não consegui sugerir agora. Você pode preencher o formulário manualmente.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json(normalizeDraft(raw, parsed.data.text));
}
