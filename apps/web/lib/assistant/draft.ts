import { SchemaType, type ResponseSchema } from "@google/generative-ai";
import { z } from "zod";

import {
  derivePriority,
  HEAT_LEVEL_OPTIONS,
  ISSUE_OPTIONS,
  SHADE_LEVEL_OPTIONS,
} from "@/lib/utils";
import type {
  HeatLevel,
  IssueType,
  PointDraftResult,
  ShadeLevel,
} from "@shadowmap/types";

const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_REGEX =
  /(?:\+?55[\s-]?)?(?:\(?\d{2}\)?[\s-]?)?(?:9?\d{4})[\s-]?\d{4}\b/g;

export function sanitizeDraftText(value: string): string {
  return value
    .replace(EMAIL_REGEX, "[removido]")
    .replace(PHONE_REGEX, "[removido]")
    .trim();
}

const rawDraftSchema = z.object({
  issueType: z.string().nullable().catch(null),
  heatLevel: z.string().nullable().catch(null),
  shadeLevel: z.string().nullable().catch(null),
  description: z.string().catch(""),
  missing: z.array(z.string()).catch([]),
});

export const draftGeminiSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    issueType: {
      type: SchemaType.STRING,
      format: "enum",
      enum: [...ISSUE_OPTIONS],
      nullable: true,
      description: "Tipo de ocorrência, ou null se não for possível inferir.",
    },
    heatLevel: {
      type: SchemaType.STRING,
      format: "enum",
      enum: [...HEAT_LEVEL_OPTIONS],
      nullable: true,
      description: "Nível de calor percebido, ou null se não informado.",
    },
    shadeLevel: {
      type: SchemaType.STRING,
      format: "enum",
      enum: [...SHADE_LEVEL_OPTIONS],
      nullable: true,
      description: "Nível de sombra, ou null se não informado.",
    },
    description: {
      type: SchemaType.STRING,
      description:
        "Reescrita neutra e objetiva do relato, com no máximo 300 caracteres.",
    },
    missing: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Informações que faltam para completar o cadastro.",
    },
  },
  required: ["issueType", "heatLevel", "shadeLevel", "description", "missing"],
};

export function buildDraftSystemPrompt(): string {
  return `Você transforma um relato de morador em um rascunho de ponto do ShadowMap AI, projeto de extensão da UCSAL sobre calor urbano e arborização na Região Metropolitana de Salvador.

Regras:
- Responda apenas com o JSON do schema fornecido.
- Classifique apenas o que estiver explícito ou fortemente implícito no relato.
- Se um campo não puder ser inferido com segurança, use null e inclua o nome do campo em "missing".
- Não invente local, horário, medições ou causas.
- A "description" deve ser uma reescrita neutra, objetiva e curta (no máximo 300 caracteres), sem opinião, sem nomes de pessoas, sem telefone, sem e-mail, sem placas e sem endereço completo.
- Não calcule prioridade; isso é feito pelo servidor.
- Escreva em português do Brasil.`;
}

export function buildDraftUserMessage(input: {
  text: string;
  city?: string;
  neighborhood?: string;
}): string {
  const context: string[] = [];

  if (input.city) context.push(`Cidade informada: ${input.city}.`);
  if (input.neighborhood) context.push(`Bairro informado: ${input.neighborhood}.`);

  return [
    ...context,
    "Relato do morador:",
    input.text,
  ].join("\n");
}

export function normalizeDraft(
  raw: unknown,
  originalText: string,
): PointDraftResult {
  const parsed = rawDraftSchema.safeParse(raw);
  const data = parsed.success
    ? parsed.data
    : {
        issueType: null,
        heatLevel: null,
        shadeLevel: null,
        description: "",
        missing: [] as string[],
      };

  const missing = new Set(
    (data.missing ?? [])
      .map((item) => item.trim().slice(0, 120))
      .filter(Boolean)
      .slice(0, 10),
  );

  const issueType = ISSUE_OPTIONS.includes(data.issueType as IssueType)
    ? (data.issueType as IssueType)
    : null;
  const heatLevel = HEAT_LEVEL_OPTIONS.includes(data.heatLevel as HeatLevel)
    ? (data.heatLevel as HeatLevel)
    : null;
  const shadeLevel = SHADE_LEVEL_OPTIONS.includes(data.shadeLevel as ShadeLevel)
    ? (data.shadeLevel as ShadeLevel)
    : null;

  if (!issueType) missing.add("tipo de ocorrência");
  if (!heatLevel) missing.add("nível de calor");
  if (!shadeLevel) missing.add("nível de sombra");

  let description = sanitizeDraftText(data.description ?? "").slice(0, 300);

  if (!description) {
    description = sanitizeDraftText(originalText).slice(0, 300);
  }

  if (!description) {
    missing.add("descrição");
    description = "Relato sem descrição suficiente.";
  }

  return {
    draft: {
      issueType,
      heatLevel,
      shadeLevel,
      description,
      missing: [...missing],
    },
    suggestedPriority:
      heatLevel && shadeLevel ? derivePriority(heatLevel, shadeLevel) : null,
  };
}
