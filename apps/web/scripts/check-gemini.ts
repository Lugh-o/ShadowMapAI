/**
 * Lista os modelos Gemini disponíveis para `generateContent` na conta configurada.
 *
 * Uso:
 *   pnpm --filter @shadowmap/web check:gemini
 *
 * Nunca imprime a chave. Se GEMINI_MODEL estiver definido, informa se ele
 * aparece na lista de modelos utilizáveis.
 */

interface GeminiModel {
  name: string;
  displayName?: string;
  supportedGenerationMethods?: string[];
}

async function main() {
  const apiKey = process.env.GOOGLE_AI_API_KEY?.trim();

  if (!apiKey || apiKey.length < 20) {
    console.error(
      "GOOGLE_AI_API_KEY não definida ou com valor de exemplo. Configure uma chave real em apps/web/.env antes de rodar.",
    );
    process.exitCode = 1;
    return;
  }

  const endpoint = new URL(
    "https://generativelanguage.googleapis.com/v1beta/models",
  );
  endpoint.searchParams.set("pageSize", "200");
  endpoint.searchParams.set("key", apiKey);

  let payload: { models?: GeminiModel[] };

  try {
    const response = await fetch(endpoint, {
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error(
        `Falha ao listar modelos (HTTP ${response.status}). ` +
          "Verifique a chave e as permissões da conta.",
      );
      if (detail) console.error(detail.slice(0, 500));
      process.exitCode = 1;
      return;
    }

    payload = (await response.json()) as { models?: GeminiModel[] };
  } catch {
    console.error(
      "Não foi possível falar com a API do Gemini. Verifique a conexão.",
    );
    process.exitCode = 1;
    return;
  }

  const usableModels = (payload.models ?? []).filter((model) =>
    (model.supportedGenerationMethods ?? []).includes("generateContent"),
  );

  const flashModels = usableModels.filter((model) =>
    model.name.toLowerCase().includes("flash"),
  );

  console.log(
    `Modelos disponíveis para generateContent: ${usableModels.length}`,
  );

  if (usableModels.length === 0) {
    console.error(
      "Nenhum modelo com generateContent foi encontrado para esta chave.",
    );
    process.exitCode = 1;
    return;
  }

  console.log("\nModelos com 'flash' no nome:");
  for (const model of flashModels) {
    console.log(`- ${model.name.replace(/^models\//, "")}`);
  }

  const configuredModel = process.env.GEMINI_MODEL?.trim();

  if (configuredModel) {
    const normalized = configuredModel.replace(/^models\//, "");
    const found = usableModels.some(
      (model) => model.name.replace(/^models\//, "") === normalized,
    );

    console.log(
      `\nGEMINI_MODEL="${normalized}" ${
        found ? "está disponível" : "NÃO está na lista de modelos utilizáveis"
      }.`,
    );

    if (!found) process.exitCode = 1;
  } else {
    console.log(
      "\nGEMINI_MODEL não definido. Escolha um dos modelos acima e configure no .env.",
    );
  }
}

void main();
