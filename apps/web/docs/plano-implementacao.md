> ⚠️ **Documento histórico — substituído por `docs/SPEC_MVP_SHADOWMAP_AI.md`.**
> O escopo, as decisões e o status atual do MVP estão na spec. Este arquivo é
> mantido apenas como registro da Fase 1.

# ShadowMap AI — Plano de Implementação e Contexto

> Documento de referência técnica gerado a partir da análise do repositório `shadowmap-main` (MVP em Next.js) e do escopo definido na Fase 1 do projeto de extensão *Tecnologias e Inteligências Artificiais* (UCSAL).

---

## 1. Contexto

### 1.1 O problema

Salvador apresenta distribuição desigual de cobertura vegetal: bairros periféricos e densamente povoados sofrem mais com ilhas de calor urbanas (ICUs) do que áreas de maior renda e orla, configurando um caso de injustiça climática. Isso agrava consumo de energia, doenças respiratórias e cardiovasculares, proliferação de vetores (dengue) e saúde mental. A causa estrutural é a falta de dado granular em escala de bairro e a baixa participação comunitária nas decisões de plantio.

### 1.2 O projeto

**ShadowMap AI** é a adaptação do projeto ShadowMap (originalmente da disciplina Natureza, Ciência e Sociedade) para a disciplina Tecnologias e Inteligências Artificiais, incorporando um componente real de IA — o que faltava na versão original, que dependia apenas de mapeamento colaborativo manual (VGI) e curadoria humana.

**Objetivo geral:** desenvolver, com apoio de inteligência artificial, uma solução que mapeie, analise e priorize áreas de vácuo vegetal e calor excessivo em bairros periféricos de Salvador, orientando de forma mais justa e eficiente a implementação de projetos de arborização urbana.

**Objetivos específicos:**
- Classificar automaticamente cobertura vegetal por imagem de satélite.
- Construir um índice de prioridade climática por microrregião.
- Usar NLP para apoiar triagem de relatos e educação ambiental.
- Disponibilizar dashboard de dados para gestores públicos e ONGs.
- Avaliar criticamente limites e riscos éticos do uso de IA no contexto.

### 1.3 Exigência da disciplina: piloto com usuários reais

O plano de trabalho da disciplina prevê, na Fase 2 — Etapa "Testes e Implementação": *"Validação das soluções junto às comunidades e parceiros"* e *"Ajustes e melhorias baseados no feedback recebido"*. Isso também é critério de avaliação (item 8 do plano). Portanto, o projeto precisa de contato real com pessoas fora do grupo, mesmo que em escala pequena e supervisionada (não é necessário lançamento público em massa).

### 1.4 Estado atual do código (diagnóstico)

Repositório: `shadowmap-main` — Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4 + Leaflet/react-leaflet, deploy-alvo Vercel.

O que já existe:
- Mapa interativo funcional com zonas de calor e marcadores de pontos.
- Filtros por cidade, tipo de ocorrência e criticidade.
- Formulário de cadastro de ponto com captura de coordenadas por clique no mapa.
- Tour guiado e modal com a base acadêmica do projeto.

O que **não** existe (gaps críticos):
- **Sem backend/API routes**: nenhuma rota em `app/api/*`. Os dados vêm de `data/points.json` e `data/heatZones.json`, importados estaticamente em build time (`app/page.tsx`).
- **Sem persistência real**: `handlePointSubmit` em `ShadowMapDashboard.tsx` apenas atualiza estado React (`setPoints`). Ao recarregar a página, todo cadastro feito pelo usuário é perdido.
- **Zero componente de IA**: `heatLevel`, `shadeLevel` e `priority` são campos de formulário preenchidos manualmente pelo cidadão em `PointForm.tsx`. O "índice de prioridade" (`getCriticalityScore` em `lib/utils.ts`) é apenas uma soma ponderada de valores categóricos escolhidos manualmente — não há classificação de imagem, modelo preditivo ou NLP.
- **Zonas de calor hardcoded**: os polígonos em `heatZones.json` foram desenhados manualmente, não derivados de dado real de satélite/temperatura de superfície.
- **Sem moderação/anti-spam**: qualquer pessoa pode enviar qualquer conteúdo, sem validação de duplicidade nem fila de revisão.

### 1.5 Estrutura de repositório: monorepo

O repositório passa a seguir estrutura de **monorepo**, já que o projeto deixa de ser só o app Next.js e passa a incluir também o job Python de sensoriamento remoto e pacotes compartilhados (tipos, schema do banco). Gerenciador sugerido: **pnpm workspaces** (leve, já compatível com o Next.js do projeto e sem necessidade de ferramentas adicionais como Turborepo nesta escala).

```
shadowmap-ai/
├── apps/
│   ├── web/                 # app Next.js atual (dashboard, mapa, API routes)
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── ...
│   └── vegetation-job/       # job Python de classificação de cobertura vegetal
│       ├── src/
│       └── requirements.txt
├── packages/
│   ├── db/                   # schema Prisma/Drizzle + client compartilhado
│   ├── types/                # tipos TypeScript compartilhados (City, PointFeature, etc.)
│   └── species-data/         # base de espécies nativas usada pelo recomendador
├── pnpm-workspace.yaml
└── package.json
```

- `apps/web` herda diretamente o conteúdo atual de `shadowmap-main` (app, components, lib, data migram para cá).
- `apps/vegetation-job` roda isolado (Python, sem dependência do Node), publicando resultados direto no banco compartilhado — não é importado pelo `web`, apenas escreve na mesma base de dados que a API do `web` lê.
- `packages/types` centraliza os tipos hoje definidos em `types/index.ts`, para serem reaproveitados tanto pela API quanto (futuramente) por outros apps do monorepo.
- `packages/db` concentra schema e migrations do Postgres/PostGIS, evitando duplicar definição de tabelas entre o app web e o job de satélite.

---

## 2. Mudanças de código necessárias (base, antes da IA)

Pré-requisito para qualquer piloto real — sem isso, os dados dos participantes se perdem.

| # | Mudança | Onde | Motivo |
|---|---|---|---|
| 1 | Criar banco de dados real (Postgres + PostGIS) e schema em `packages/db` | novo | JSON estático não suporta escrita concorrente de usuários reais |
| 2 | Criar rotas de API (`apps/web/app/api/points/route.ts`, etc.) | novo | hoje não existe nenhuma rota; tudo é import estático em build time |
| 3 | `handlePointSubmit` deve chamar `POST /api/points` em vez de só `setPoints` | `apps/web/components/ShadowMapDashboard.tsx` | persistir de fato o cadastro do cidadão |
| 4 | Buscar pontos via `fetch`/Server Component em vez de import de JSON | `apps/web/app/page.tsx` | permitir dados dinâmicos, atualizados em tempo real |
| 5 | Moderação básica (status `pending` / `approved` no schema) | `packages/db` (schema) + `apps/web/components/PointForm.tsx` | evitar que spam/vandalismo vá direto ao mapa público |
| 6 | Rate limiting simples por IP/sessão | rota de API em `apps/web` | mitigar abuso durante o piloto |
| 7 | Mover tipos de `types/index.ts` para `packages/types`, consumidos por `apps/web` | `apps/web` + `packages/types` | evitar duplicação de tipos entre app web e job de satélite |

**Recomendação de banco de dados:** Postgres gerenciado com extensão PostGIS (Neon ou Supabase), por já se integrarem facilmente ao ecossistema Next.js/Vercel e terem free tier suficiente para um piloto acadêmico. ORM sugerido: Prisma ou Drizzle.

---

## 3. Implementação das features de IA

### 3.1 Classificação de cobertura vegetal (visão computacional)

- **Problema que resolve:** hoje `heatLevel`/`shadeLevel` são "achismo" do usuário preenchendo um dropdown.
- **Abordagem:** job que baixa recortes de imagem Sentinel-2 (via Copernicus ou Google Earth Engine) para a bounding box de cada bairro-piloto, calcula NDVI e roda um classificador (Random Forest é suficiente e mais interpretável que deep learning para essa escala) para estimar percentual de cobertura arbórea por célula de grade.
- **Onde roda:** **não** dentro do Next.js. É o pacote `apps/vegetation-job` do monorepo — script Python (scikit-learn + rasterio) executado como job agendado (GitHub Action ou função serverless com timeout maior), que grava o resultado numa tabela `vegetation_estimates` (definida em `packages/db`) — a API do `apps/web` apenas lê esse resultado.
- **Referência técnica:** estudos de classificação de cobertura arbórea urbana com Random Forest/CNN (ver seção 5 do documento da Fase 1) mostram acurácias de 80–90% dependendo da técnica, o suficiente para orientar priorização (não para decisão automática sem revisão humana).

### 3.2 Índice de prioridade climática

- **Abordagem:** não precisa ser um modelo de ML nesta fase — uma fórmula determinística é mais defensável com poucos dados de treino disponíveis.
- **Implementação:** endpoint `app/api/priority/route.ts` que cruza `vegetation_estimates` + dado do INMET + relatos dos cidadãos e devolve um score por microrregião. Evolui a lógica que já existe em `getCriticalityScore` (`lib/utils.ts`), mas passa a ser alimentada por dado real em vez de campo manual escolhido pelo usuário.

### 3.3 Assistente comunitário (NLP)

- **Abordagem:** componente de chat simples chamando a **API do Google AI Studio, modelo Gemini 1.5 Flash**, a partir de `app/api/assistant/route.ts`, com prompt de sistema restrito ao domínio (espécies nativas, como cadastrar um ponto, o que é uma ilha de calor).
- **Por que Gemini 1.5 Flash:** modelo de baixa latência e baixo custo, adequado a um chatbot de triagem/educação com volume de piloto (poucas dezenas de usuários), e a API do Google AI Studio tem free tier generoso o suficiente para não gerar custo no piloto acadêmico.
- **Implementação:** chave de API armazenada como variável de ambiente (`GOOGLE_AI_API_KEY`), chamada via SDK oficial `@google/generative-ai` a partir da rota de API do Next.js — o front-end nunca expõe a chave diretamente.
- **Escopo:** orquestração sobre modelo de terceiros — não envolve treinar nada do zero.

### 3.4 Recomendador de espécies nativas

- **Abordagem:** tabela `native_species` (nome, clima, tipo de solo, porte) e função de *matching* por regras contra os atributos do ponto cadastrado.
- **Nota de honestidade acadêmica:** classificar isso como "sistema de recomendação baseado em regras" (e não como um modelo de ML) é preciso e é o que já foi proposto na Fase 1.

### 3.5 Ordem de prioridade sugerida (dado o tempo de disciplina)

1. Índice de prioridade climática — mais fácil de implementar, mais visível no dashboard.
2. Recomendador de espécies nativas.
3. Assistente comunitário via NLP.
4. Classificação de cobertura vegetal por satélite — a mais cara em tempo e dado; pode ficar restrita a um único bairro-piloto em vez de cobrir toda a base.

---

## 4. Infraestrutura para rodar o piloto

Piloto restrito e supervisionado (não lançamento público em massa), portanto a infraestrutura pode ser enxuta e de custo zero:

| Necessidade | Solução recomendada |
|---|---|
| Hosting do app | Vercel, apontado para `apps/web` do monorepo (build root configurável no painel da Vercel; free tier cobre o volume de um piloto) |
| Banco de dados | Neon ou Supabase (Postgres + PostGIS), free tier |
| Job de processamento de satélite | GitHub Actions agendado rodando `apps/vegetation-job` (ou função serverless com timeout maior), gravando resultado no Postgres — não precisa de servidor dedicado |
| Assistente comunitário (NLP) | API do Google AI Studio (Gemini 1.5 Flash) — free tier suficiente para o volume de um piloto acadêmico |
| Autenticação | Para piloto pequeno, token de sessão simples por dispositivo/nome já reduz spam sem criar barreira de entrada alta para moradores |
| Moderação | Painel simples (ex.: rota `/admin` protegida por senha básica) para aprovar pontos antes de irem ao mapa público |
| Observabilidade | Vercel Analytics (gratuito) é suficiente para essa escala |
| Gerenciador de monorepo | pnpm workspaces (sem necessidade de Turborepo/Nx nesta escala de projeto) |
| Custo estimado | Zero, usando os free tiers acima — relevante para o item de sustentabilidade financeira já documentado na Fase 1 |

---

## 5. Desenho do piloto (Fase 2 — Etapa "Testes e Implementação")

Formas viáveis de cumprir a exigência de validação com usuários reais dentro do prazo de uma disciplina:

- **Piloto restrito:** testar o cadastro de pontos e o protótipo com um grupo pequeno (10–20 moradores de um bairro, ou uma turma de escola parceira), mediado presencialmente.
- **Sessão de validação institucional:** apresentar o protótipo funcional a um parceiro (SECIS, ONG ambiental ou escola), coletar feedback estruturado.
- **Teste de usabilidade guiado:** sessões supervisionadas em que o feedback é observado e registrado diretamente, em vez de deixar o app "solto" na comunidade sem acompanhamento — mais controlável dentro do prazo da disciplina.

O ponto-chave: precisa existir contato real com pessoas fora do grupo do projeto avaliando a solução, gerando ajustes documentados. A escala pode e deve ser pequena e coordenada pelo próprio grupo.