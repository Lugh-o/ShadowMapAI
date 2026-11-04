# SPEC — Publicação estática do ShadowMap AI (GitHub Pages)

> **Destinatário:** agente de IA que vai alterar o repositório `eubrunocase/ShadowMapAI` (monorepo pnpm: `apps/web`, `packages/*`).
> **Objetivo:** gerar um site 100% estático (`output: "export"`) e publicá-lo no GitHub Pages por GitHub Actions, em `https://eubrunocase.github.io/ShadowMapAI/`.
> **Contexto:** o app virou uma demonstração com dados simulados (JSON importado), sem login, banco, API real nem IA. Restam no código restos dessas camadas que impedem o build de um checkout limpo.

---

## 0. Regras para o agente

1. Leia `AGENTS.md`: este Next.js (16.2.3) tem mudanças incompatíveis. Antes de mexer em `next.config.ts`, rotas ou `useSearchParams`, consulte `node_modules/next/dist/docs/` (seções de *static exports*, `basePath` e `useSearchParams`).
2. Um commit por tarefa (`P1`, `P2`, …).
3. **Não alterar o comportamento visível** do mapa, dos filtros, do formulário simulado, do chat fictício nem dos textos "SIMULADO". Esta spec muda a infraestrutura, não o produto.
4. Não mexer em `packages/*` (types, db, species-data) salvo se o build do `apps/web` falhar por causa deles.
5. Não imprimir nem commitar o conteúdo de `.env`.
6. Verificado em sandbox antes desta spec: com as tarefas P1 a P3 aplicadas, `next build` gera 4 rotas estáticas (`/`, `/dashboard`, `/privacidade`, `/_not-found`) e a pasta `out/`. As tarefas P4 em diante **não** foram testadas; valide cada uma.

---

## 1. Estado atual (diagnóstico)

| Item | Situação | Consequência |
|---|---|---|
| `app/page.tsx`, `ShadowMapDashboard.tsx` | Usam `data/*.json`; cadastro só altera estado do React | Já compatível com export estático |
| `app/dashboard/page.tsx` | `export const dynamic = "force-dynamic"` e leitura de `searchParams` no servidor | **Incompatível** com `output: "export"` |
| `lib/dashboard.ts` | Gera datas com `Date.now()` | Se renderizado no build, os filtros "7/30 dias" ficam congelados na data do build; precisa rodar no navegador |
| `app/api/*` (`points`, `config`, `species`, `dashboard/summary`) | Nenhum componente usa (`/api/config` só é chamado por `lib/use-pilot-ref.ts`, também sem uso) | Código morto; `POST` não existe em export estático |
| `lib/assistant/*`, `lib/pilot*.ts`, `lib/db.ts`, `lib/csv.ts`, `lib/rate-limit.ts`, `scripts/check-gemini.ts`, `prisma/seed.ts`, `components/dashboard/PilotPanel.tsx` | Código morto que importa `@prisma/client` e Gemini | **`next build` falha** num checkout limpo (type-check: `lib/assistant/quota.ts`, "Parameter 'tx' implicitly has an 'any' type", porque o client do Prisma não é gerado) |
| `next.config.ts` | `transpilePackages` inclui `@shadowmap/db`; sem `output` | Ajustar |
| Lockfiles | `package-lock.json` e `pnpm-lock.yaml` na raiz | Confunde plataformas de CI; o projeto usa pnpm |
| `apps/web/.env` | Presente localmente (não versionado) com valores que parecem reais | Segredos de serviços que o app não usa mais |

---

## 2. Tarefas

### P1 — Remover código morto (obrigatório)

Apagar:

```
apps/web/app/api/                         (diretório inteiro)
apps/web/lib/assistant/                   (diretório inteiro)
apps/web/lib/pilot.ts
apps/web/lib/pilot-ref.ts
apps/web/lib/use-pilot-ref.ts
apps/web/lib/db.ts
apps/web/lib/csv.ts
apps/web/lib/rate-limit.ts
apps/web/scripts/                         (diretório inteiro)
apps/web/prisma/                          (diretório inteiro)
apps/web/components/dashboard/PilotPanel.tsx
```

Antes de apagar cada arquivo, rode `grep -rn` para confirmar que nenhum código vivo o importa (`app/`, `components/`, `lib/` restantes). Se algo vivo importar, **pare e reporte** em vez de improvisar. Em especial, `components/SimulatedChat.tsx` depende de `lib/chatbot/knowledge.ts`, que **deve ficar**.

Em `apps/web/package.json`:
- remover dependências: `@prisma/client`, `@shadowmap/db`, `@shadowmap/species-data` (só se nada mais importar), `@google/generative-ai`; remover devDependencies: `prisma`, `tsx` (se nenhum script restar); remover os scripts `db:seed` e `check:gemini`.
- manter `zod` apenas se `lib/validation.ts` ainda for importado por código vivo; senão remover o arquivo e a dependência.

Na raiz, em `package.json`: remover os scripts `db:generate`, `db:push`, `db:migrate`, `db:seed` **somente se** `packages/db` deixar de ser usado; caso contrário, deixar e registrar a decisão no commit. Não apagar `packages/db`.

**Aceite:** `grep -rniE "prisma|generative-ai|next-auth|GOOGLE_AI" apps/web --include=*.ts --include=*.tsx --include=package.json` não retorna nada.

### P2 — Dashboard rodando no navegador (obrigatório)

1. Criar `apps/web/components/dashboard/DashboardView.tsx` com `"use client"` no topo. Mover para ele **todo o conteúdo** atual de `app/dashboard/page.tsx` (cabeçalho, filtros, cartões, ranking, distribuições, gráfico diário, "Últimos 10 pontos", `MetricCard`, `EmptyState`, `RecentReports`).
2. No componente, substituir a leitura de `searchParams` por `useSearchParams()` (`next/navigation`) e passar os valores a `parseDashboardParams` como já é feito hoje (`origin`, `city`, `days`).
3. Calcular os dados **só no cliente**: `useState<DashboardData | null>(null)` + `useEffect` que chama `getDashboardData(filters)` quando `origin`, `city` ou `days` mudarem. Enquanto `data` for `null`, mostrar "Carregando painel…". (Alternativa aceitável: tornar `getDashboardData` síncrona e usar `useMemo` dentro de `useEffect`/estado; o importante é não calcular com `Date.now()` no build.)
4. Remover do componente `export const dynamic`, `export const metadata`, a interface `DashboardPageProps` e `async`.
5. Reescrever `app/dashboard/page.tsx` como Server Component mínimo:

```tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import DashboardView from "@/components/dashboard/DashboardView";

export const metadata: Metadata = {
  title: "Painel | ShadowMap",
  description: "Agregados simulados de calor urbano e arborização em Salvador.",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardView />
    </Suspense>
  );
}
```

6. `DashboardFilters` continua usando `<Link href="/dashboard?...">`; confirme que clicar nos filtros atualiza a URL e os números sem recarregar a página.

**Aceite:** `/dashboard` abre sem erro; alternar origem/cidade/período muda os dados; não há `force-dynamic` no projeto.

### P3 — Configuração de export estático (obrigatório)

`apps/web/next.config.ts`:

```ts
import type { NextConfig } from "next";

// Em GitHub Pages de projeto o site fica em /<repositorio>/. Localmente e em
// outros hosts (Cloudflare, Netlify, domínio próprio) a variável fica vazia.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined,
  transpilePackages: ["@shadowmap/types"],
};

export default nextConfig;
```

- Se o código usar `next/image`, acrescentar `images: { unoptimized: true }` (export estático não tem otimizador de imagens).
- Se `@shadowmap/species-data` ou outro pacote continuar importado por código vivo, mantê-lo em `transpilePackages`.
- Substituir o script `start` (do `apps/web` e da raiz): `next start` não funciona com `output: "export"`. Remover `start` e adicionar na raiz `"preview": "pnpm --filter @shadowmap/web build && npx serve apps/web/out"`.

**Aceite:** `pnpm build` (sem `NEXT_PUBLIC_BASE_PATH`) termina com sucesso e `apps/web/out/` contém `index.html`, `dashboard/index.html`, `privacidade/index.html` e `404.html`.

### P4 — Link e assets sob subcaminho (validar)

O `basePath` só é aplicado automaticamente a `next/link`, `next/navigation` e assets do Next. Verificar:

1. `grep -rn "<a href=\"/\|src=\"/\|url(/" apps/web/app apps/web/components` — qualquer caminho absoluto fora de `next/link` deve passar a usar `Link` ou prefixar com `process.env.NEXT_PUBLIC_BASE_PATH`.
2. Ícones do Leaflet: confirmar que `PointMarkers.tsx`/`MapView.tsx` não dependem de imagens padrão do Leaflet servidas por caminho absoluto (`/marker-icon.png`). Se dependerem, trocar por `divIcon` (HTML/CSS) ou prefixar o caminho.
3. Build com `NEXT_PUBLIC_BASE_PATH=/ShadowMapAI pnpm build`, depois simular o hospedamento:

```bash
rm -rf /tmp/site && mkdir -p /tmp/site && cp -r apps/web/out /tmp/site/ShadowMapAI
npx serve /tmp/site          # abrir http://localhost:3000/ShadowMapAI/
```

Conferir em `/ShadowMapAI/`, `/ShadowMapAI/dashboard/` e `/ShadowMapAI/privacidade/`: sem 404 em `_next/*` (aba Network), mapa carrega tiles do OpenStreetMap, navegação da Navbar funciona, filtros do dashboard funcionam, "Simular novo ponto" adiciona o marcador, o chat fictício responde.

### P5 — Workflow do GitHub Actions (obrigatório)

Criar `.github/workflows/deploy-pages.yml`. Antes, adicionar `"packageManager": "pnpm@<versão>"` ao `package.json` da raiz, usando a versão do `pnpm -v` local e compatível com o cabeçalho do `pnpm-lock.yaml`.

```yaml
name: Deploy GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    env:
      NEXT_PUBLIC_BASE_PATH: /ShadowMapAI
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: touch apps/web/out/.nojekyll
      - uses: actions/upload-pages-artifact@v3
        with:
          path: apps/web/out

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- Confirmar as versões atuais das *actions* (majors) na documentação do GitHub antes de fixar.
- `pnpm build` já aponta para `@shadowmap/web`; o build baixa as fontes do Google (`next/font/google`) — funciona nos runners do GitHub.
- Só incluir uma etapa `pnpm lint` se ela já passar sem erros localmente; **não** bloquear o deploy por falhas preexistentes de lint.
- Se o nome do repositório mudar, mudar também `NEXT_PUBLIC_BASE_PATH`.

### P6 — Lockfiles e segredos (obrigatório)

1. Remover `package-lock.json` da raiz (o projeto usa pnpm). Rodar `pnpm install` para atualizar `pnpm-lock.yaml` após P1 e commitar.
2. Garantir que `.env` esteja no `.gitignore` (já está) e que `git ls-files | grep -E '(^|/)\.env$'` retorne vazio.
3. Reduzir `apps/web/.env.example` a: `NEXT_PUBLIC_BASE_PATH=` (comentado, "deixar vazio localmente") e `NEXT_PUBLIC_APP_URL`. Remover as linhas de `DATABASE_URL`, Gemini e OAuth.
4. **Não apagar nem ler `apps/web/.env`.** No resumo final, avisar ao usuário que as chaves antigas (banco, Gemini, Google OAuth, `AUTH_SECRET`) devem ser revogadas nos provedores, e que o arquivo local pode ser apagado.

### P7 — Documentação (obrigatório)

- `README.md`: substituir a seção "Como rodar" por: `pnpm install`, `pnpm dev` (desenvolvimento), `pnpm build` (gera `apps/web/out`), `pnpm preview`. Remover `pnpm start`. Adicionar seção **"Publicação"** descrevendo o workflow, a URL final e a variável `NEXT_PUBLIC_BASE_PATH`. Manter o aviso "dados simulados / sem persistência".
- Acrescentar no topo de `docs/SPEC_MVP_SHADOWMAP_AI.md` e de `apps/web/docs/plano-implementacao.md` o aviso: *"Documento histórico. Não descreve a versão estática atual (sem login, banco, API real nem IA)."*
- Não editar os demais arquivos em `docs/`.

### P8 — Passo manual do usuário (o agente apenas informa)

No GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**. Sem isso, o job `deploy` falha. O agente deve listar esse passo no resumo final.

---

## 3. Critérios de aceite globais

Executar a partir de um clone limpo (`git clone` + `rm -rf node_modules .next out`):

1. `pnpm install --frozen-lockfile` passa.
2. `pnpm build` passa, sem depender de `prisma generate` nem de variáveis de ambiente.
3. `NEXT_PUBLIC_BASE_PATH=/ShadowMapAI pnpm build` passa e o site abre corretamente em `/ShadowMapAI/` (procedimento do P4).
4. `apps/web/out` contém `index.html`, `dashboard/index.html`, `privacidade/index.html`, `404.html`.
5. `grep -rniE "prisma|generative-ai|next-auth|force-dynamic|GOOGLE_AI" apps/web --include=*.ts --include=*.tsx --include=*.json` (excluindo `node_modules` e `.next`) não retorna nada.
6. Nenhum `fetch(` para `/api/` no código.
7. O workflow roda verde em `main` e a URL `https://eubrunocase.github.io/ShadowMapAI/` responde.
8. A interface continua exibindo o selo "Demo · dados simulados" e a atribuição do OpenStreetMap.

## 4. Fora do escopo

Reativar login, banco, API ou IA · mudar o visual · trocar o provedor de mapa · domínio próprio · analytics · testes automatizados · remover `packages/*`.

## 5. Riscos

- **`useSearchParams` e prerender:** exige o `<Suspense>` do P2; sem ele o build de export falha.
- **Hospedagem em subcaminho:** o erro mais comum é 404 em `_next/*` por `basePath`/`assetPrefix` ausentes; por isso o P4 pede teste em subcaminho.
- **Tiles do OpenStreetMap:** adequado para demonstração e baixo tráfego; manter a atribuição.
- **Textos do trabalho:** se o artigo ainda cita piloto com moradores, assistente com Gemini ou persistência, ele diverge do que o app faz (fora do escopo desta spec, mas o agente deve avisar o usuário).