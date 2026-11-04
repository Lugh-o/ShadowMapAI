# ShadowMap AI — demonstração visual

Amostra visual do ShadowMap AI, projeto de extensão da UCSAL sobre ilhas de
calor e arborização urbana em Salvador. Esta versão foi reduzida a uma
demonstração de interface: **não há login, cadastro real nem persistência de
dados**.

## O que esta versão faz

- Exibe um mapa de Salvador com **pontos e zonas de calor simulados**.
- Marca explicitamente os dados como **SIMULADO** no mapa, na legenda, nos
  popups e nos painéis.
- Permite **simular o cadastro de um novo ponto**: o marcador aparece apenas no
  estado local da página e some ao recarregar. Nada é enviado nem salvo.
- Usa **OpenStreetMap** como camada base, sem chave de API.
- Mantém um painel demonstrativo com agregados dos mesmos dados simulados.
- Oferece um **assistente fictício** no canto da tela: ele responde com textos
  pré-prontos sobre o projeto, sem chamar nenhuma IA ou serviço externo.

## O que foi removido

- Login por e-mail/senha e Google (Auth.js/NextAuth).
- Páginas de login e cadastro de conta.
- Painel de moderação e rotas administrativas.
- Assistente de IA real (Gemini), feedback do piloto e exportações CSV.
  Em seu lugar há um chat simulado com respostas pré-escritas.
- Leitura/gravação de pontos no banco de dados a partir do mapa.

O schema Prisma e os pacotes compartilhados continuam no repositório, mas a
demonstração não depende deles para funcionar.

## Mapa e chave de API

A camada base agora é o **OpenStreetMap**, que não exige chave de API:

```
https://tile.openstreetmap.org/{z}/{x}/{y}.png
```

A versão anterior usava as camadas do **CARTO**, que passaram a retornar um
placeholder com o texto `API KEY REQUIRED` quando acessadas sem chave. Se for
necessário voltar ao CARTO, será preciso criar uma conta em
[carto.com](https://carto.com/) e fornecer uma **API key do CARTO** (além de
configurar a URL do tile com o token). Para esta demonstração, nenhuma chave é
necessária.

## Como rodar

```bash
pnpm install
pnpm dev
```

Acesse `http://localhost:3000`.

Para gerar a versão de produção:

```bash
pnpm build
pnpm start
```

## Estrutura relevante

```
apps/web/
├── app/
│   ├── page.tsx                 # mapa demonstrativo
│   ├── dashboard/page.tsx       # painel com dados simulados
│   ├── privacidade/page.tsx     # explica a demonstração
│   └── api/points/route.ts      # GET simulado e POST sem persistência
├── components/                  # mapa, filtros, formulário, painéis e chat
│   └── SimulatedChat.tsx        # assistente fictício com respostas prontas
├── lib/chatbot/knowledge.ts     # base de respostas e busca por palavras-chave
├── data/
│   ├── points.json              # pontos simulados de Salvador
│   └── heatZones.json           # zonas de calor simuladas de Salvador
└── lib/
```

## Variáveis de ambiente

A demonstração não exige variáveis obrigatórias. Veja
`apps/web/.env.example`. O mapa funciona sem chave; o banco e as integrações
antigas são opcionais e não são usados por esta versão.

## Licença

Projeto acadêmico — UCSAL.
