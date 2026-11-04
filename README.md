# ShadowMap AI

Plataforma de mapeamento colaborativo de ilhas de calor e baixa arborização na
Região Metropolitana de Salvador, com assistente de IA e painel de análise
transparente. Projeto de extensão da UCSAL (disciplina Tecnologias e
Inteligências Artificiais).

## Status

Este README descreve apenas o que existe no repositório. Funcionalidades
planejadas ficam explicitamente marcadas como tal.

| Status | O que é |
|---|---|
| **Implementado** | Mapa interativo com filtros, cadastro de pontos com moderação, autenticação (e-mail/senha e Google), painel de moderação, separação entre dados coletados e simulados, validação geográfica e anti-duplicidade, assistente de IA (Gemini) com consentimento e cotas, rascunho de ponto por linguagem natural, dashboard público, instrumentação do piloto (`ref`, feedback), exportação CSV, página de privacidade |
| **Pré-requisito da demo** | `GOOGLE_AI_API_KEY` e `GEMINI_MODEL` válidos no `.env` (confirme com `check:gemini`); `ADMIN_EMAILS` com o e-mail da conta que vai moderar |
| **Planejado (trabalho futuro)** | Classificação de cobertura vegetal por satélite/NDVI, índice com temperatura de superfície, recomendação de espécies por aprendizado de máquina, PWA/modo offline, upload de fotos, notificações |

> **Importante:** não há classificação por satélite nem NDVI implementados. A
> pasta `apps/vegetation-job` não contém código funcional e está fora do escopo
> deste MVP.

## Estrutura do monorepo

```
shadowmap-ai/
├── apps/
│   └── web/                 # Next.js 16 (mapa, dashboard, API routes)
├── packages/
│   ├── db/                  # Schema Prisma e client compartilhado
│   ├── types/               # Tipos TypeScript compartilhados
│   └── species-data/        # Base de espécies nativas revisada
├── docs/
│   └── SPEC_MVP_SHADOWMAP_AI.md
├── pnpm-workspace.yaml
└── package.json
```

## Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4,
  Leaflet/react-leaflet
- **Backend:** Route Handlers do Next.js, Prisma ORM
- **Banco:** PostgreSQL + PostGIS (Neon ou Supabase)
- **IA:** Gemini (modelo configurado por `GEMINI_MODEL`)
- **Gerenciador:** pnpm workspaces

## Configuração

1. Instale as dependências:

   ```bash
   pnpm install
   ```

2. Copie `apps/web/.env.example` para `apps/web/.env` e preencha os valores.
   Gere o `AUTH_SECRET` com `openssl rand -base64 32`.

3. Gere o client do Prisma e aplique o schema:

   ```bash
   pnpm db:generate
   pnpm db:push
   ```

4. (Opcional, apenas para demonstração) Popule dados **simulados**:

   ```bash
   pnpm db:seed
   ```

   O seed cria pontos marcados como `simulated`. Nunca rode o seed no banco do
   piloto sem essa marcação — e prefira não rodar.

5. Inicie o servidor:

   ```bash
   pnpm dev
   ```

6. Confirme o modelo Gemini disponível para a sua chave:

   ```bash
   pnpm --filter @shadowmap/web check:gemini
   ```

## Variáveis de ambiente

Todas estão documentadas em `apps/web/.env.example`. Nunca commite o `.env`
real. Se um `.env` foi compartilhado por engano, **gire todas as chaves**
(`GOOGLE_AI_API_KEY`, `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET`, senha do banco).

## API

| Rota | Método | Descrição |
|---|---|---|
| `/api/points` | GET | Lista pontos aprovados (público) |
| `/api/points` | POST | Cadastra ponto (login obrigatório, moderação pendente) |
| `/api/assistant` | POST | Assistente de IA (login + consentimento + cota) |
| `/api/assistant/draft-point` | POST | Transforma relato em rascunho de ponto |
| `/api/feedback` | POST | Feedback do piloto |
| `/api/species` | GET | Recomendador de espécies por regras |
| `/api/admin` | GET/PATCH/DELETE | Moderação (somente e-mails em `ADMIN_EMAILS`) |
| `/api/admin/export` | GET | Exportação CSV (somente admin) |
| `/api/dashboard/summary` | GET | Dados agregados do dashboard |
| `/api/config` | GET | Configuração pública do piloto |

Rotas removidas: `/api/priority` (dependia de dados de satélite inexistentes) e
`/api/auth/verify` (verificação de senha passou para dentro do Auth.js).

## Deploy

1. Conecte o repositório à Vercel.
2. Configure o **Root Directory** como `apps/web`.
3. Adicione as variáveis de ambiente no painel.
4. Deploy automático.

## Licença

Projeto acadêmico — UCSAL.
