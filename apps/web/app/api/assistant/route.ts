import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { AssistantMessage } from "@shadowmap/types";

const SYSTEM_PROMPT = `Você é o assistente comunitário do ShadowMap AI, uma plataforma de mapeamento de ilhas de calor urbanas em Salvador e região metropolitana.

Suas responsabilidades:
- Ajudar cidadãos a cadastrar pontos de calor excessivo e baixa arborização
- Explicar o que são ilhas de calor urbanas e seus impactos na saúde
- Recomendar espécies nativas para plantio
- Orientar sobre como participar do projeto
- Responder perguntas sobre o meio ambiente urbano em Salvador

Diretrizes:
- Responda em português brasileiro
- Seja acessível e use linguagem simples
- Foque em espécies nativas da Bahia e Mata Atlântica
- Não dê diagnósticos médicos - encaminhe para profissionais de saúde
- Para dados técnicos precisos, sugira consultar fontes oficiais (INMET, IBGE)
- Seja breve e direto nas respostas

Espécies recomendadas para Salvador:
- Castanheira (Bertholletia excelsa) - grande sombra
- Ipê-amarelo (Handroanthus albus) - tolerante à seca
- Pau-brasil (Paubrasilia echinata) - símbolo nacional
- Cajueiro (Anacardium occidentale) - fruto comestível
- Imbaúba (Cecropia peltata) - crescimento rápido
- Ingá (Inga edulis) - fixa nitrogênio no solo
- Jatobá (Hymenaea courbaril) - madeira resistente

Como cadastrar um ponto:
1. Clique no mapa para selecionar a localização
2. Preencha o formulário com os dados do local
3. Descreva a situação observada
4. Envie para análise da equipe

Obrigado por participar do ShadowMap AI!`;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Assistant not configured" },
      { status: 503 }
    );
  }

  let body: { messages: AssistantMessage[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: "Messages array required" }, { status: 400 });
  }

  const lastMessage = body.messages[body.messages.length - 1];
  if (lastMessage.role !== "user") {
    return NextResponse.json({ error: "Last message must be from user" }, { status: 400 });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    const chat = model.startChat({
      history: body.messages.slice(0, -1).map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      })),
    });

    const result = await chat.sendMessage(lastMessage.content);
    const response = result.response.text();

    return NextResponse.json({ content: response });
  } catch (error) {
    console.error("Assistant error:", error);
    return NextResponse.json(
      { error: "Failed to get response from assistant" },
      { status: 500 }
    );
  }
}
