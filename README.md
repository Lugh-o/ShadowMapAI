# ShadowMap AI

Plataforma de mapeamento de ilhas de calor urbanas e arborização em Salvador/BA, com inteligência artificial para classificação de cobertura vegetal, recomendação de espécies nativas e assistente comunitário.

## Estrutura do Monorepo

```
shadowmap-ai/
├── apps/
│   ├── web/                 # App Next.js (dashboard, mapa, API routes)
│   └── vegetation-job/      # Job Python de classificação de cobertura vegetal
├── packages/
│   ├── db/                  # Schema Prisma/Drizzle + client compartilhado
│   ├── types/               # Tipos TypeScript compartilhados
│   └── species-data/        # Base de espécies nativas
├── pnpm-workspace.yaml
└── package.json
```

## Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Leaflet/react-leaflet
- **Backend:** Next.js API Routes, Prisma ORM
- **Banco de dados:** PostgreSQL + PostGIS (Neon ou Supabase)
- **IA:** Google AI Studio (Gemini 1.5 Flash) para assistente comunitário
- **Gerenciador:** pnpm workspaces

## Funcionalidades

### Dashboard e Mapa
- Mapa interativo com zonas de calor e marcadores de pontos
- Filtros por cidade, tipo de ocorrência e criticidade
- Formulário de cadastro de ponto com captura de coordenadas
- Tour guiado e modal com base acadêmica

### Backend e Persistência
- API REST para CRUD de pontos (`/api/points`)
- Índice de prioridade climática (`/api/priority`)
- Assistente comunitário via NLP (`/api/assistant`)
- Recomendador de espécies nativas (`/api/species`)
- Rate limiting por IP
- Moderação de pontos (pendente/aprovado/rejeitado)

### Painel de Moderação
- Acesso em `/admin` com autenticação por senha
- Listagem de pontos pendentes
- Aprovação, rejeição ou exclusão de pontos

### IA e Análise
- Classificação de cobertura vegetal por satélite (Sentinel-2 + NDVI)
- Índice de prioridade climática por microrregião
- Assistente comunitário com Gemini 1.5 Flash
- Recomendador de espécies nativas baseado em regras

## Configuração

### 1. Instalar dependências

```bash
pnpm install
```

### 2. Configurar banco de dados

Crie um arquivo `.env` em `apps/web/`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/shadowmap"
GOOGLE_AI_API_KEY="sua-chave-aqui"
ADMIN_PASSWORD="sua-senha-admin"
```

### 3. Rodar migrations

```bash
pnpm db:generate
pnpm db:push
```

### 4. Seed do banco (opcional)

```bash
pnpm db:seed
```

### 5. Iniciar desenvolvimento

```bash
pnpm dev
```

A aplicação ficará disponível em `http://localhost:3000`.

## API Routes

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/points` | GET | Listar pontos aprovados |
| `/api/points` | POST | Cadastrar novo ponto |
| `/api/priority` | GET | Índice de prioridade climática |
| `/api/species` | GET | Recomendar espécies nativas |
| `/api/assistant` | POST | Chat com assistente comunitário |
| `/api/admin` | GET | Listar todos os pontos (admin) |
| `/api/admin` | PATCH | Atualizar status de moderação |
| `/api/admin` | DELETE | Excluir ponto |

## Deploy

### Vercel

1. Conecte o repositório ao Vercel
2. Configure o **Root Directory** como `apps/web`
3. Adicione as variáveis de ambiente no painel
4. Deploy automático

### Banco de dados

Recomendado: Neon ou Supabase (Postgres + PostGIS), free tier suficiente para piloto acadêmico.

## Licença

Projeto acadêmico - UCSAL
