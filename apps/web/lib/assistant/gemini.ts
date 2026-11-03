import { GoogleGenerativeAI } from "@google/generative-ai";

const TIMEOUT_MS = 20_000;
const FALLBACK_REPLY = "Não consegui responder a isso. Tente reformular.";

export const ASSISTANT_FALLBACK_REPLY = FALLBACK_REPLY;

export class AssistantUnavailableError extends Error {
  constructor() {
    super("assistant_unavailable");
    this.name = "AssistantUnavailableError";
  }
}

export interface GeminiHistoryMessage {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

interface GenerateReplyParams {
  systemPrompt: string;
  history: GeminiHistoryMessage[];
  message: string;
}

function getErrorStatus(error: unknown): number | null {
  if (typeof error !== "object" || error === null) return null;

  const candidate = error as {
    status?: unknown;
    response?: { status?: unknown };
  };

  if (typeof candidate.status === "number") return candidate.status;
  if (typeof candidate.response?.status === "number") {
    return candidate.response.status;
  }

  return null;
}

function isRetryable(error: unknown): boolean {
  const status = getErrorStatus(error);
  return status !== null && status >= 500;
}

function describeError(error: unknown): string {
  const status = getErrorStatus(error);

  if (status !== null) return `status ${status}`;
  if (error instanceof Error) return error.name;

  return "erro desconhecido";
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error("timeout"));
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

async function sendOnce(
  model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]>,
  params: GenerateReplyParams,
): Promise<string> {
  const chat = model.startChat({ history: params.history });
  const result = await withTimeout(
    chat.sendMessage(params.message),
    TIMEOUT_MS,
  );

  return result.response.text().trim() || FALLBACK_REPLY;
}

export async function generateAssistantReply(
  params: GenerateReplyParams,
): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  const modelName = process.env.GEMINI_MODEL;

  if (!apiKey || !modelName) {
    console.error(
      "Assistente indisponível: GOOGLE_AI_API_KEY ou GEMINI_MODEL não configurado.",
    );
    throw new AssistantUnavailableError();
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: params.systemPrompt,
  });

  try {
    return await sendOnce(model, params);
  } catch (error) {
    if (!isRetryable(error)) {
      console.error("Assistente falhou:", describeError(error));
      throw new AssistantUnavailableError();
    }
  }

  try {
    return await sendOnce(model, params);
  } catch (error) {
    console.error("Assistente falhou após retry:", describeError(error));
    throw new AssistantUnavailableError();
  }
}
