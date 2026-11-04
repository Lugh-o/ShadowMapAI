/**
 * Base de conhecimento do assistente SIMULADO do ShadowMap.
 *
 * Nada aqui consulta IA, banco de dados ou serviços externos: são apenas
 * respostas pré-escritas associadas a palavras-chave. O componente de chat
 * escolhe a resposta com maior pontuação de correspondência.
 */

export interface ChatbotTopic {
  id: string;
  /** Pergunta sugerida exibida como atalho no chat. */
  question: string;
  /** Palavras/frases usadas para encontrar o assunto. Sem acentos. */
  keywords: string[];
  /** Resposta pré-pronta. Quebras de linha são preservadas na interface. */
  answer: string;
}

export const CHATBOT_TOPICS: ChatbotTopic[] = [
  {
    id: "sobre",
    question: "O que é o ShadowMap?",
    keywords: [
      "shadowmap",
      "shadow map",
      "o que e o shadowmap",
      "o que e shadowmap",
      "sobre o projeto",
      "sobre o app",
      "o que esse site faz",
      "para que serve",
      "projeto",
      "plataforma",
      "aplicativo",
    ],
    answer:
      "O ShadowMap é um projeto de extensão da UCSAL sobre ilhas de calor e arborização urbana em Salvador.\n\nEsta versão é uma demonstração visual: o mapa e o painel mostram pontos e zonas de calor SIMULADOS para apresentar a interface. Não há login, cadastro real, moderação ou persistência de dados.",
  },
  {
    id: "dados-simulados",
    question: "Os dados são reais?",
    keywords: [
      "dados reais",
      "dados sao reais",
      "dados verdadeiros",
      "e real",
      "sao reais",
      "simulado",
      "simulados",
      "simulacao",
      "medicao",
      "medicoes",
      "temperatura real",
      "dados",
      "confiavel",
      "posso confiar",
      "fake",
    ],
    answer:
      "Não. Todos os pontos e zonas exibidos nesta versão são simulados.\n\nEles não vieram de moradores, não representam medições de temperatura e não devem ser usados como diagnóstico ambiental. O selo “Simulado” aparece junto aos dados justamente para deixar isso explícito.",
  },
  {
    id: "mapa",
    question: "Como usar o mapa?",
    keywords: [
      "como usar o mapa",
      "usar o mapa",
      "mapa",
      "marcador",
      "marcadores",
      "ponto no mapa",
      "selecionar ponto",
      "clicar no mapa",
      "navegar",
      "zoom",
      "camada",
      "camadas",
    ],
    answer:
      "No mapa você pode arrastar, aplicar zoom e tocar em um marcador para ver os detalhes do ponto no painel lateral.\n\nTambém é possível tocar em qualquer área do mapa para capturar latitude e longitude e abrir o formulário de cadastro simulado. O mapa usa OpenStreetMap e não exige chave de API.",
  },
  {
    id: "filtros",
    question: "Como funcionam os filtros?",
    keywords: [
      "filtro",
      "filtros",
      "filtrar",
      "cidade",
      "tipo de ocorrencia",
      "criticidade",
      "prioridade do filtro",
      "esconder dados",
      "mostrar dados",
    ],
    answer:
      "Os filtros rápidos permitem reduzir o conjunto exibido por:\n\n• Cidade — Salvador, Camaçari, Lauro de Freitas ou Simões Filho;\n• Tipo de ocorrência — ilha de calor, baixa arborização, ponto de ônibus exposto, área pavimentada ou rota escolar;\n• Criticidade — crítica, alta, média ou baixa.\n\nHá também o botão para mostrar ou ocultar os dados simulados. Como a demonstração usa apenas dados simulados, ocultá-los deixa o mapa vazio.",
  },
  {
    id: "cadastro",
    question: "Como simular um cadastro?",
    keywords: [
      "cadastrar",
      "cadastro",
      "novo ponto",
      "criar ponto",
      "adicionar ponto",
      "registrar",
      "formulario",
      "simular cadastro",
      "enviar ponto",
      "salvar ponto",
    ],
    answer:
      "Para simular um cadastro:\n\n1. Toque em “Simular novo ponto” ou clique em um local do mapa.\n2. Preencha bairro, cidade, tipo de ocorrência, níveis de calor e sombra.\n3. Envie o formulário.\n\nO ponto aparece apenas no estado local da página, durante a sessão atual do navegador. Nada é enviado para um servidor, gravado em banco ou compartilhado.",
  },
  {
    id: "prioridade",
    question: "Como a prioridade é calculada?",
    keywords: [
      "prioridade",
      "criticidade",
      "calculo",
      "como e calculado",
      "regra",
      "critico",
      "critica",
      "alta",
      "media",
      "baixa",
      "nivel de prioridade",
    ],
    answer:
      "A prioridade segue uma regra determinística, sem participação de IA:\n\n• Crítica — calor extremo ou calor alto sem nenhuma sombra;\n• Alta — calor alto;\n• Média — calor médio;\n• Baixa — calor baixo.\n\nO nível de sombra também aparece nos detalhes do ponto, mas a classificação principal usa o calor conforme a regra acima.",
  },
  {
    id: "ilhas-de-calor",
    question: "O que são ilhas de calor?",
    keywords: [
      "ilha de calor",
      "ilhas de calor",
      "calor urbano",
      "zona de calor",
      "zonas de calor",
      "temperatura",
      "aquecimento",
      "calor",
    ],
    answer:
      "Ilhas de calor são áreas urbanas que ficam mais quentes que o entorno por causa da grande quantidade de asfalto e concreto, da pouca vegetação e da concentração de edificações.\n\nNo ShadowMap, as zonas de calor são ilustrativas e coloridas por intensidade (baixa, média, alta e extrema). Elas servem para demonstrar a leitura visual do mapa, não para indicar temperaturas reais.",
  },
  {
    id: "arborizacao",
    question: "Qual a importância da arborização?",
    keywords: [
      "arvore",
      "arvores",
      "arborizacao",
      "sombra",
      "vegetacao",
      "cobertura verde",
      "plantar",
      "verde",
    ],
    answer:
      "A arborização ajuda a reduzir a sensação de calor, amplia a sombra em ruas e calçadas e melhora a qualidade do ar e do convívio nos espaços públicos.\n\nNesta demonstração, os níveis de sombra de cada ponto são apenas ilustrativos. Para qualquer ação real de plantio, a recomendação é procurar a equipe do projeto e a prefeitura do município.",
  },
  {
    id: "especies",
    question: "O ShadowMap recomenda espécies nativas?",
    keywords: [
      "especie",
      "especies",
      "especies nativas",
      "que arvore plantar",
      "qual arvore",
      "recomendacao de arvore",
      "muda",
      "mudas",
      "nativa",
      "nativas",
    ],
    answer:
      "O projeto possui uma base de espécies nativas, mas esta demonstração não faz recomendação agronômica.\n\nO módulo de espécies serve como apoio educativo. Antes de plantar, considere o porte da árvore, o espaço disponível, a fiação elétrica e a orientação de um profissional ou da equipe municipal.",
  },
  {
    id: "painel",
    question: "O que tem no painel?",
    keywords: [
      "painel",
      "dashboard",
      "estatistica",
      "estatisticas",
      "grafico",
      "graficos",
      "ranking",
      "numeros",
      "resumo",
      "distribuicao",
    ],
    answer:
      "O painel apresenta agregados dos pontos simulados:\n\n• total de pontos e de ocorrências críticas/altas;\n• bairros representados;\n• ranking de bairros por criticidade;\n• distribuições por tipo de ocorrência, calor e sombra;\n• gráfico diário e os últimos pontos simulados.\n\nEle também pode ser filtrado por origem, cidade e período.",
  },
  {
    id: "cidades",
    question: "Quais cidades aparecem?",
    keywords: [
      "quais cidades",
      "cidades",
      "salvador",
      "camacari",
      "lauro de freitas",
      "simoes filho",
      "regiao metropolitana",
      "onde",
      "localizacao",
    ],
    answer:
      "A amostra do mapa é focada em Salvador.\n\nO conjunto de dados também inclui exemplos de Camaçari, Lauro de Freitas e Simões Filho, que aparecem nas opções de filtro e no painel. Tudo é ilustrativo e não representa um levantamento de campo.",
  },
  {
    id: "privacidade",
    question: "O que é coletado sobre mim?",
    keywords: [
      "privacidade",
      "dados pessoais",
      "lgpd",
      "coleta",
      "coletam",
      "meus dados",
      "cookie",
      "cookies",
      "rastreamento",
      "localizacao do dispositivo",
      "gps",
    ],
    answer:
      "Esta demonstração não cria contas e não pede nome, e-mail, telefone ou senha. Nada é gravado em banco de dados.\n\nO mapa não solicita a localização do dispositivo: as coordenadas vêm do clique no mapa ou dos dados simulados. O ponto criado no formulário existe apenas na memória da página durante a sessão.",
  },
  {
    id: "login",
    question: "Preciso criar uma conta?",
    keywords: [
      "login",
      "entrar",
      "conta",
      "cadastro de usuario",
      "senha",
      "autenticacao",
      "google",
      "e-mail",
      "email",
      "preciso me cadastrar",
    ],
    answer:
      "Não. Esta versão é pública e abre direto na demonstração, sem login ou criação de conta.\n\nA versão completa do projeto previa autenticação, mas ela foi removida desta amostra para simplificar a apresentação da interface.",
  },
  {
    id: "openstreetmap",
    question: "Por que o mapa usa OpenStreetMap?",
    keywords: [
      "openstreetmap",
      "osm",
      "carto",
      "api key",
      "chave de api",
      "mapa nao carrega",
      "mapa esta cinza",
      "provedor do mapa",
    ],
    answer:
      "O mapa usa as camadas públicas do OpenStreetMap, que não exigem chave de API.\n\nA versão anterior usava as camadas do CARTO, que passaram a exibir o aviso “API KEY REQUIRED” quando acessadas sem uma chave própria. A troca deixou a demonstração mais simples de executar.",
  },
  {
    id: "assistente",
    question: "Você é uma IA de verdade?",
    keywords: [
      "voce e real",
      "voce e uma ia",
      "inteligencia artificial",
      "ia",
      "chatbot",
      "bot",
      "assistente",
      "como voce funciona",
      "voce aprende",
      "respostas prontas",
      "resposta pronta",
      "gemini",
    ],
    answer:
      "Sou um assistente fictício criado para esta demonstração.\n\nNão sou uma IA generativa e não consulto nenhum serviço externo. Minhas respostas são pré-escritas e escolhidas por palavras-chave. Também não aprendo com a conversa nem guardo histórico: ao recarregar a página, a conversa recomeça.",
  },
  {
    id: "gratuito",
    question: "O ShadowMap é gratuito?",
    keywords: [
      "gratuito",
      "gratis",
      "pago",
      "preco",
      "custo",
      "assinatura",
      "premium",
    ],
    answer:
      "Esta demonstração é gratuita e acadêmica. Ela existe para apresentar o projeto de extensão da UCSAL sobre calor urbano e arborização.\n\nNão há assinatura, anúncio ou cobrança dentro da amostra.",
  },
  {
    id: "equipe",
    question: "Quem faz o projeto?",
    keywords: [
      "quem fez",
      "quem faz",
      "equipe",
      "ucsal",
      "universidade",
      "projeto de extensao",
      "autores",
      "desenvolvedores",
      "contato",
      "falar com",
    ],
    answer:
      "O ShadowMap AI é um projeto de extensão da UCSAL. Esta versão é uma amostra visual preparada para demonstrar a interface.\n\nPara dúvidas sobre o projeto, procure a equipe do projeto de extensão da UCSAL. A página “Sobre a demonstração” do site também resume o escopo da amostra.",
  },
  {
    id: "uso-dados",
    question: "Posso usar os dados em um trabalho?",
    keywords: [
      "posso usar",
      "usar os dados",
      "trabalho",
      "escola",
      "faculdade",
      "pesquisa",
      "citar",
      "referencia",
      "academico",
    ],
    answer:
      "Como os dados são simulados, eles não devem ser usados como evidência de temperatura ou de arborização real.\n\nVocê pode citar a demonstração como exemplo de interface, mas qualquer conclusão ambiental precisa de dados medidos e de fontes oficiais. Para uso acadêmico, fale com a equipe da UCSAL.",
  },
  {
    id: "selo",
    question: "O que significa o selo “Simulado”?",
    keywords: [
      "selo",
      "etiqueta",
      "significa simulado",
      "por que simulado",
      "badge",
    ],
    answer:
      "O selo “Simulado” indica que aquele ponto ou zona foi criado apenas para demonstrar a interface.\n\nEle não representa um relato de morador, uma medição de temperatura ou um registro oficial. O selo aparece para evitar que os dados sejam confundidos com informações reais.",
  },
  {
    id: "ajuda",
    question: "O que posso perguntar?",
    keywords: [
      "ajuda",
      "o que posso perguntar",
      "opcoes",
      "tópicos",
      "topicos",
      "menu",
      "nao entendi",
      "como funciona o chat",
    ],
    answer:
      "Você pode perguntar sobre:\n\n• o que é o ShadowMap e se os dados são reais;\n• como usar o mapa, os filtros e o cadastro simulado;\n• como a prioridade dos pontos é calculada;\n• ilhas de calor, arborização e espécies nativas;\n• painel, cidades atendidas, privacidade e login;\n• o próprio assistente e a equipe do projeto.\n\nToque em uma das sugestões abaixo ou escreva sua pergunta.",
  },
  {
    id: "saudacao",
    question: "Oi!",
    keywords: [
      "oi",
      "ola",
      "bom dia",
      "boa tarde",
      "boa noite",
      "eai",
      "e ai",
      "tudo bem",
      "hey",
      "hello",
    ],
    answer:
      "Olá! Eu sou o assistente simulado do ShadowMap.\n\nPosso explicar o projeto, os dados simulados, o mapa, os filtros e a prioridade dos pontos. O que você quer saber?",
  },
  {
    id: "agradecimento",
    question: "Obrigado!",
    keywords: [
      "obrigado",
      "obrigada",
      "valeu",
      "agradeco",
      "muito bom",
      "ajudou",
      "era isso",
      "tchau",
      "ate mais",
      "adeus",
    ],
    answer:
      "De nada! Lembre-se: esta é uma demonstração com dados simulados e respostas pré-escritas.\n\nSe quiser, posso explicar outro tópico do ShadowMap.",
  },
];

export const SUGGESTED_QUESTIONS = [
  "O que é o ShadowMap?",
  "Os dados são reais?",
  "Como simular um cadastro?",
  "Como a prioridade é calculada?",
];

export const WELCOME_MESSAGE =
  "Olá! Eu sou o assistente simulado do ShadowMap.\n\nPosso responder perguntas sobre o projeto, os dados simulados, o mapa e o painel. Minhas respostas são pré-escritas — nenhuma IA real é consultada.";

/** Remove acentos, pontuação e diferenças de caixa para facilitar a busca. */
export function normalizeChatText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreKeyword(normalizedMessage: string, keyword: string): number {
  const normalizedKeyword = normalizeChatText(keyword);
  if (!normalizedKeyword) return 0;

  // Exige correspondência por palavra/frase inteira para evitar falsos positivos.
  const pattern = new RegExp(`(^|\\s)${escapeRegExp(normalizedKeyword)}(\\s|$)`);
  if (!pattern.test(normalizedMessage)) return 0;

  const wordCount = normalizedKeyword.split(" ").length;
  return 12 + wordCount * 8 + Math.min(normalizedKeyword.length, 24);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface ChatbotReply {
  text: string;
  topicId: string | null;
}

/**
 * Retorna uma resposta pré-pronta para a mensagem. Quando nada corresponde,
 * devolve um texto de fallback com os assuntos disponíveis.
 */
export function getChatbotReply(message: string): ChatbotReply {
  const normalizedMessage = normalizeChatText(message);

  if (!normalizedMessage) {
    return {
      text: "Escreva uma pergunta sobre o ShadowMap para eu tentar ajudar.",
      topicId: null,
    };
  }

  let bestTopic: ChatbotTopic | null = null;
  let bestScore = 0;

  for (const topic of CHATBOT_TOPICS) {
    const score = topic.keywords.reduce(
      (total, keyword) => total + scoreKeyword(normalizedMessage, keyword),
      0,
    );

    if (score > bestScore) {
      bestScore = score;
      bestTopic = topic;
    }
  }

  if (bestTopic) {
    return { text: bestTopic.answer, topicId: bestTopic.id };
  }

  return {
    text:
      "Não encontrei uma resposta pré-pronta para essa pergunta.\n\nPosso falar sobre: o que é o ShadowMap, dados simulados, mapa, filtros, cadastro simulado, prioridade dos pontos, ilhas de calor, arborização, espécies nativas, painel, privacidade, login e a equipe do projeto.\n\nTente reformular a pergunta ou toque em uma das sugestões abaixo.",
    topicId: null,
  };
}
