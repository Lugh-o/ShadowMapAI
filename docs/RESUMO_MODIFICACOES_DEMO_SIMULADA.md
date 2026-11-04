# Resumo das modificações — demonstração simulada sem login

> Data: 04/11/2026
> Escopo: transformar a aplicação em uma amostra visual do mapa de ilhas de
> calor de Salvador, com dados explicitamente simulados, cadastro de ponto
> apenas demonstrativo e remoção completa do login.

## 1. Login removido

Foram removidos:

- `apps/web/auth.ts`
- `apps/web/auth.config.ts`
- `apps/web/proxy.ts`
- `apps/web/components/SessionProvider.tsx`
- `apps/web/app/(auth)/login/page.tsx`
- `apps/web/app/(auth)/register/page.tsx`
- `apps/web/app/api/auth/*`
- `apps/web/app/admin/page.tsx`
- `apps/web/app/api/admin/*`
- `apps/web/lib/admin.ts`
- `apps/web/components/AssistantChat.tsx`
- `apps/web/app/api/assistant/*`
- `apps/web/components/PointFeedbackModal.tsx`
- `apps/web/app/api/feedback/route.ts`

Também foram removidas as dependências `next-auth`, `@auth/prisma-adapter`,
`bcryptjs` e `@types/bcryptjs` de `apps/web/package.json`, com o lockfile
atualizado.

O `layout.tsx` não envolve mais a aplicação em `SessionProvider`, e a Navbar
não exibe mais sessão, botão de entrar/sair ou nome de usuário.

## 2. Mapa com dados simulados de Salvador

- `apps/web/app/page.tsx` não consulta mais o Prisma. Ele lê
  `apps/web/data/points.json` e `apps/web/data/heatZones.json`, aplica
  `dataOrigin: "simulated"` e passa os dados para o dashboard.
- Os dados foram reduzidos a Salvador:
  - 10 pontos simulados em bairros como Brotas, Itapuã, Cajazeiras, Liberdade,
    Comércio, Rio Vermelho, Periperi, Barra, Pau da Lima e Stella Maris.
  - 5 zonas ilustrativas de calor: Miolo de Brotas, Corredor Cajazeiras, Centro
    Histórico, Liberdade e Subúrbio Ferroviário.
- O mapa centraliza em Salvador (`-12.9718, -38.5011`, zoom 12) e abre com os
  dados simulados visíveis por padrão.
- O texto de simulação aparece em vários pontos da interface:
  - faixa fixa no topo do mapa;
  - selo "Demo · dados simulados" na Navbar;
  - legenda e popups dos pontos;
  - tooltip das zonas de calor;
  - painel lateral e modal "Mais info";
  - painel de dashboard.

## 3. Cadastro de ponto apenas demonstrativo

- O formulário continua abrindo pelo botão "Simular novo ponto" ou por clique
  no mapa.
- Ao enviar, `ShadowMapDashboard` cria um `PointFeature` local com
  `dataOrigin: "simulated"`, adiciona ao estado do React, seleciona o novo
  marcador e mostra a mensagem de sucesso.
- O ponto desaparece ao recarregar a página. Não há `fetch`, não há banco e não
  há moderação.
- A rota `POST /api/points` também foi mantida como simulação: valida o payload
  e devolve o ponto criado, mas não grava nada. `GET /api/points` devolve os
  dados simulados de Salvador.
- Textos do formulário e do painel deixam explícito que nada será salvo.

## 4. Mapa e chave de API

O mapa usava esta camada do CARTO:

```text
https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png
```

Essa URL passou a retornar o placeholder `API KEY REQUIRED` do
`carto.com/basemaps/apikeu`. A camada foi trocada por OpenStreetMap:

```text
https://tile.openstreetmap.org/{z}/{x}/{y}.png
```

**Nenhuma chave de API é necessária para a demonstração atual.**

Se for necessário voltar ao CARTO, será preciso criar uma conta em
[carto.com](https://carto.com/) e fornecer uma **API key do CARTO**. O
OpenStreetMap não exige chave, mas pede atribuição — que já está configurada no
`TileLayer`.

## 5. Painel demonstrativo

- `apps/web/lib/dashboard.ts` não consulta mais o Prisma. Ele usa os mesmos
  pontos simulados de `data/points.json`, com datas geradas para preencher o
  gráfico diário.
- A origem padrão do painel passou a ser "Coletados + simulados".
- O painel não tem mais painel de admin, exportação CSV, pilotos ou métricas de
  IA.
- Os textos e métricas foram ajustados para dizer que todos os números são
  simulados.

## 6. Outros ajustes

- `apps/web/app/privacidade/page.tsx` foi reescrita como "Sobre esta
  demonstração", explicando ausência de login, dados simulados, cadastro sem
  persistência e a troca de CARTO por OpenStreetMap.
- `README.md` foi atualizado para refletir a demonstração, o que foi removido e
  a questão da chave de API.
- `apps/web/.env.example` foi simplificado: nenhuma variável é obrigatória para
  o mapa, e não há mais variáveis de Auth.js.
- A dependência de banco continua no monorepo para trabalhos futuros, mas a
  página do mapa e o painel não a utilizam.

## 7. Assistente fictício com respostas pré-prontas

- `apps/web/components/SimulatedChat.tsx` adiciona um botão flutuante e um
  painel de conversa disponível em todas as páginas.
- O assistente não é uma IA real: `apps/web/lib/chatbot/knowledge.ts` guarda os
  assuntos, palavras-chave e respostas pré-escritas. A mensagem é classificada
  localmente, sem chamada de rede, banco de dados ou API de IA.
- A interface deixa explícito que o assistente é **fictício**, mostra sugestões
  de perguntas, indicador de digitação, opção de reiniciar a conversa e aviso de
  que nada é salvo.
- A conversa existe apenas no estado do React e recomeça ao recarregar a página.
- O antigo assistente com Gemini (`AssistantChat.tsx` e
  `app/api/assistant/*`) continua removido.

## 8. Verificações executadas

- `pnpm install --ignore-scripts` — lockfile atualizado após remover as
  dependências de autenticação.
- `pnpm lint` — sem erros.
- `pnpm build` — concluído com sucesso.
- Servidor de produção em porta alternativa:
  - `/` → `200`
  - `/dashboard` → `200`
  - `/privacidade` → `200`
  - `/login` → `404` (rota removida)
  - `/api/points` → `200`
  - `POST /api/points` → `201` com `dataOrigin: "simulated"` e sem persistência.

## 9. Observação final

A demonstração não exige banco, login, chave do Gemini ou chave de mapa. Para
rodar:

```bash
pnpm install
pnpm dev
```

Acesse `http://localhost:3000`.
