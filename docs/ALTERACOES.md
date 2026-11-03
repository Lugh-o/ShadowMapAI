# ShadowMap AI — Alterações e Configuração

## Alterações Realizadas

### Estrutura de Monorepo

O projeto foi reestruturado de um app Next.js único para um **pnpm monorepo**:

```
shadowmap-ai/
├── apps/
│   ├── web/                 # App Next.js 16 (movido da raiz)
│   └── vegetation-job/      # Job Python (placeholder para futuro)
├── packages/
│   ├── db/                  # Schema Prisma + PostGIS
│   ├── types/               # Tipos TypeScript compartilhados
│   └── species-data/        # Base de espécies nativas
├── pnpm-workspace.yaml
└── package.json
```

### Arquivos Movidos (raiz → `apps/web/`)

- `app/`, `components/`, `lib/`, `data/`, `docs/`, `public/`
- `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`
- `next-env.d.ts`, `.gitignore`

### Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| `pnpm-workspace.yaml` | Configuração de workspaces do pnpm |
| `packages/types/src/index.ts` | Tipos compartilhados (City, PointFeature, HeatZone, NativeSpecies, etc.) |
| `packages/db/prisma/schema.prisma` | Schema do banco com PostGIS |
| `packages/db/src/index.ts` | Cliente Prisma compartilhado |
| `packages/species-data/src/index.ts` | 15 espécies nativas da Bahia |
| `apps/web/app/api/points/route.ts` | API CRUD para pontos |
| `apps/web/app/api/priority/route.ts` | Índice de prioridade climática |
| `apps/web/app/api/assistant/route.ts` | Assistente comunitário (Gemini 1.5 Flash) |
| `apps/web/app/api/species/route.ts` | Recomendador de espécies nativas |
| `apps/web/app/api/admin/route.ts` | API de moderação |
| `apps/web/app/admin/page.tsx` | Painel de moderação |
| `apps/web/components/AssistantChat.tsx` | Componente de chat flutuante |
| `apps/web/lib/db.ts` | Cliente Prisma para o app web |
| `apps/web/lib/rate-limit.ts` | Rate limiting por IP |
| `apps/web/prisma/seed.ts` | Seed do banco com dados iniciais |
| `apps/web/.env.example` | Exemplo de variáveis de ambiente |

### Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `apps/web/app/page.tsx` | Busca dados via API com fallback para JSON estático |
| `apps/web/components/ShadowMapDashboard.tsx` | `handlePointSubmit` chama `POST /api/points`; importa `AssistantChat` |
| `apps/web/components/PointForm.tsx` | Importa tipos de `@shadowmap/types` |
| `apps/web/components/FiltersBar.tsx` | Importa tipos de `@shadowmap/types` |
| `apps/web/components/HeatZoneLayer.tsx` | Importa tipos de `@shadowmap/types` |
| `apps/web/components/PointMarkers.tsx` | Importa tipos de `@shadowmap/types` |
| `apps/web/components/Sidebar.tsx` | Importa tipos de `@shadowmap/types` |
| `apps/web/components/MapView.tsx` | Importa tipos de `@shadowmap/types` |
| `apps/web/lib/utils.ts` | Importa tipos de `@shadowmap/types` |
| `apps/web/next.config.ts` | Adiciona `transpilePackages` para pacotes do monorepo |
| `apps/web/package.json` | Dependências workspace, Prisma, Gemini SDK |

### Features Implementadas

#### Backend e Persistência

- **API REST** com rotas para CRUD de pontos, prioridade, espécies e assistente
- **Schema Prisma** com tabelas: PointFeature, HeatZone, VegetationEstimate, PriorityScore, NativeSpecies, AssistantConversation
- **PostGIS** para geometria espacial (campo `location` do tipo `geometry(Point, 4326)`)

#### Moderação

- Status `pending` / `approved` / `rejected` nos pontos
- Painel admin em `/admin` com autenticação Basic (senha via `ADMIN_PASSWORD`)
- Aprovação, rejeição ou exclusão de pontos

#### Rate Limiting

- Limite de requisições por IP (configurável via `RATE_LIMIT_MAX_REQUESTS` e `RATE_LIMIT_WINDOW_MS`)
- Default: 30 requisições por minuto

#### Assistente Comunitário (NLP)

- Integração com Google AI Studio (Gemini 1.5 Flash)
- Prompt de sistema restrito ao domínio (espécies nativas, ilhas de calor, cadastro)
- Componente de chat flutuante (`AssistantChat.tsx`)
- Chave de API via variável de ambiente `GOOGLE_AI_API_KEY`

#### Recomendador de Espécies

- 15 espécies nativas da Bahia com dados de clima, solo, porte, sombra e tolerância à seca
- Algoritmo de matching por regras (não ML)
- Endpoint `GET /api/species?city=X&soilType=Y&priority=Z`

#### Índice de Prioridade Climática

- Fórmula determinística que cruza: cobertura vegetal, intensidade de calor, densidade populacional, relatos de cidadãos
- Endpoint `GET /api/priority?city=X`

---

## O que Precisa para Rodar

### 1. Instalar o pnpm

```bash
npm install -g pnpm
```

### 2. Instalar dependências

Na raiz do projeto:

```bash
pnpm install
```

### 3. Configurar banco de dados

Criar arquivo `apps/web/.env` (copiar de `apps/web/.env.example`):

```env
DATABASE_URL="postgresql://user:password@host:5432/shadowmap?schema=public"
GOOGLE_AI_API_KEY="sua-chave-do-google-ai-studio"
ADMIN_PASSWORD="sua-senha-admin"
RATE_LIMIT_MAX_REQUESTS=30
RATE_LIMIT_WINDOW_MS=60000
```

#### Opções de banco (free tier)

- **Neon** (recomendado): https://neon.tech — Postgres + PostGIS
- **Supabase**: https://supabase.com — Postgres + PostGIS

### 4. Gerar cliente Prisma

```bash
pnpm db:generate
```

### 5. Criar tabelas no banco

```bash
pnpm db:push
```

### 6. Popular dados iniciais (opcional)

```bash
pnpm db:seed
```

### 7. Iniciar desenvolvimento

```bash
pnpm dev
```

A aplicação ficará disponível em `http://localhost:3000`.

### 8. Acessar painel de admin

- URL: `http://localhost:3000/admin`
- Senha: valor de `ADMIN_PASSWORD` no `.env`

---

## Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim | URL de conexão com o Postgres (Neon/Supabase) |
| `GOOGLE_AI_API_KEY` | Não | Chave da API do Google AI Studio (Gemini 1.5 Flash) |
| `ADMIN_PASSWORD` | Não | Senha para o painel de moderação (default: `shadowmap-admin`) |
| `RATE_LIMIT_MAX_REQUESTS` | Não | Máximo de requisições por janela (default: `30`) |
| `RATE_LIMIT_WINDOW_MS` | Não | Janela de tempo em ms (default: `60000`) |

---

## Deploy na Vercel

1. Conectar o repositório ao Vercel
2. Configurar **Root Directory** como `apps/web`
3. Configurar **Build Command** como `cd ../.. && pnpm install && pnpm --filter @shadowmap/web build`
4. Adicionar variáveis de ambiente no painel da Vercel
5. Deploy automático a cada push

---

## Estrutura de Rotas da API

| Rota | Método | Autenticação | Descrição |
|------|--------|--------------|-----------|
| `/api/points` | GET | Não | Lista pontos aprovados |
| `/api/points` | POST | Não | Cadastra novo ponto (pendente) |
| `/api/priority` | GET | Não | Índice de prioridade climática |
| `/api/species` | GET | Não | Recomenda espécies nativas |
| `/api/assistant` | POST | Não | Chat com assistente comunitário |
| `/api/admin` | GET | Basic Auth | Lista todos os pontos |
| `/api/admin` | PATCH | Basic Auth | Atualiza status de moderação |
| `/api/admin` | DELETE | Basic Auth | Exclui ponto |

---

## Pendências / Próximos Passos

- [ ] Configurar banco Neon/Supabase e rodar `pnpm db:push`
- [ ] Obter chave de API do Google AI Studio
- [ ] Implementar `apps/vegetation-job` (classificação de cobertura vegetal com Sentinel-2)
- [ ] Integrar dados reais de temperatura (INMET) no cálculo de prioridade
- [ ] Adicionar autenticação de sessão para cidadãos (anti-spam)
- [ ] Deploy na Vercel com banco conectado
- [ ] Teste piloto com 10-20 moradores
