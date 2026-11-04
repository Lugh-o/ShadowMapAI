# Resumo das modificações — finalização do MVP

> Data: 04/11/2026
> Escopo desta rodada: concluir o que faltava do `docs/SPEC_MVP_SHADOWMAP_AI.md`
> e destravar a aplicação para a demonstração (mapa, dashboard e assistente).

## 1. Diagnóstico inicial

- A aplicação subia, mas `/` quebrava com `PrismaClientKnownRequestError`:
  a coluna `PointFeature.dataOrigin` não existia no banco.
- O schema Prisma já estava atualizado, mas o banco não havia recebido as
  alterações.
- A chave `GOOGLE_AI_API_KEY` no `.env` ainda era um valor de exemplo e
  `GEMINI_MODEL` não estava definido, então o assistente não podia responder.
- A tarefa T10 ainda não estava concluída: o login por credenciais chamava a
  própria aplicação via HTTP (`/api/auth/verify`).
- O seed ainda continha a Castanheira (`Bertholletia excelsa`), removida na
  revisão de espécies.
- O Prisma estava configurado para logar queries em desenvolvimento, o que
  poderia expor descrições de relatos e conversas no console.

## 2. Banco de dados

- Executado `pnpm db:push` para sincronizar o schema:
  - `PointFeature.dataOrigin`, `ref` e `aiAssisted`;
  - tabela `Feedback`;
  - tabela `AssistantConversation`;
  - tabela `AssistantUserUsage`;
  - campo `User.assistantConsentAt`.
- Limpeza de dados antigos:
  - `submittedBy` foi anulado nos pontos simulados (o campo podia conter IP).
  - Removida a espécie Castanheira da tabela `NativeSpecies`.

## 3. Autenticação (T10)

Arquivos alterados:

- `apps/web/auth.ts`
- `apps/web/auth.config.ts`
- `apps/web/proxy.ts`
- `apps/web/app/api/auth/verify/route.ts` (removido)

Mudanças:

- `bcrypt.compare` + `prisma.user.findUnique` agora ficam dentro do
  `authorize` do provider de credenciais.
- E-mail é normalizado para minúsculas antes da consulta.
- Limite de 10 falhas de login por e-mail a cada 15 minutos (melhor esforço em
  memória, documentado no código).
- `proxy.ts` usa uma instância leve do Auth.js (`auth.config.ts`), sem carregar
  Prisma/bcrypt no middleware.
- A rota `/api/auth/verify` foi removida; o README já não a lista.

## 4. Assistente de IA

Arquivos alterados:

- `apps/web/lib/assistant/gemini.ts`
- `apps/web/app/api/assistant/route.ts`
- `apps/web/app/api/assistant/draft-point/route.ts`
- `apps/web/scripts/check-gemini.ts`

Mudanças:

- Criada `isAssistantConfigured()` para validar chave real e `GEMINI_MODEL`.
- Quando a integração não está configurada, as rotas retornam `503` **antes**
  de consumir a cota diária do usuário.
- O script `check:gemini` agora detecta chave ausente ou valor de exemplo e
  orienta a configurar uma chave real.

### Pendência para a IA funcionar

Ainda é necessário configurar uma `GOOGLE_AI_API_KEY` real em
`apps/web/.env` e confirmar o modelo:

```bash
pnpm --filter @shadowmap/web check:gemini
```

O valor local atual de `GEMINI_MODEL` é `gemini-3.8-flash`, mas ele precisa ser
confirmado contra a lista retornada pela chave usada na demo.

## 5. Integridade dos dados

Arquivos alterados:

- `apps/web/prisma/seed.ts`
- `apps/web/lib/db.ts`

Mudanças:

- Removida a Castanheira do seed.
- O seed agora apaga entradas antigas corrigidas na revisão de espécies:
  - `Bertholletia excelsa`
  - `Rhizophora mangle`
  - `Cocos nucifera`
  - `Caesalpinia echinata`
- O cliente Prisma não loga mais queries com parâmetros; apenas `error` e
  `warn`. Isso evita vazar conteúdo de relatos e conversas no console.

## 6. Variáveis de ambiente locais

Foram adicionadas ao `apps/web/.env` (arquivo não versionado):

```env
GEMINI_MODEL=gemini-3.8-flash
ASSISTANT_USER_DAILY_LIMIT=30
ADMIN_EMAILS=bruno.case45@gmail.com,bruno.case@ucsal.edu.br
PILOT_REFS=bruno,vitoria,davi,joao,lucas,pedro,gustavo,caio,mariana
POINTS_PER_USER_PER_HOUR=10
GEO_BBOX=-13.10,-38.75,-12.45,-38.15
NEXT_PUBLIC_SHOW_SIMULATED_DEFAULT=false
```

Observações:

- `ADMIN_EMAILS` foi preenchido com os dois e-mails já cadastrados no banco.
  Ajuste se a lista oficial for outra.
- O `packages/db/.env` deixou de ser usado; os scripts do Prisma leem
  `apps/web/.env`.
- Nenhum `.env` real está versionado.

## 7. Documentação e interface

Arquivos alterados:

- `README.md`
- `docs/ALTERACOES.md`
- `apps/web/app/globals.css`

Mudanças:

- README marca o MVP como implementado e lista os pré-requisitos da demo
  (chave do Gemini e `ADMIN_EMAILS`).
- `docs/ALTERACOES.md` recebeu aviso de documento histórico, pois ainda cita
  rotas removidas como `/api/priority`.
- Adicionada a cor `--color-muted` ao tema Tailwind para corrigir o estilo do
  painel de moderação (`text-muted`).

## 8. Verificações executadas

- `pnpm lint`: 0 erros e 1 aviso (`<img>` no Navbar).
- `pnpm build`: passou.
- `pnpm db:seed`: passou.
- Rotas públicas:
  - `/` → `200`
  - `/dashboard` → `200`
  - `/privacidade` → `200`
  - `/login` → `200`
  - `/api/config` → `200`
- Fluxo de cadastro e login por credenciais: funcionou.
- POST de ponto:
  - válido → `201`
  - duplicado → `409 DUPLICATE`
  - fora da região → `422 OUT_OF_REGION`
  - enum inválido → `400`
- Assistente sem consentimento → `403 CONSENT_REQUIRED`.
- Feedback → `201`.
- Dashboard sem relatos coletados → estado vazio correto.
- Mapa sem o toggle de simulação → nenhum ponto/zona simulado renderizado.

## 9. O que ainda falta

- Configurar a chave real do Gemini e validar o modelo escolhido.
- T11 (testes unitários com Vitest) — prioridade P2, não implementado.
- Revisão humana das dúvidas botânicas registradas em
  `docs/REVISAO_ESPECIES.md`.
- Subir um relato real, aprovar como admin e conferir o dashboard para a demo.
