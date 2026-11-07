import { GUIDE_ACTIONS } from "@/lib/guide-actions";
import type { GuideAction, GuideActionId } from "@/lib/guide-actions";

/**
 * Base de conhecimento do assistente SIMULADO do ShadowMap.
 *
 * Nada aqui consulta IA, banco de dados ou serviços externos: são apenas
 * respostas pré-escritas associadas a palavras-chave. O componente de chat
 * escolhe a resposta com maior pontuação de correspondência.
 */

export interface ChatbotTopic {
  id: string;
  label: string;
  summary: string;
  related: string[];
  actionIds?: GuideActionId[];
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
    label: "Sobre o projeto",
    summary:
      "O ShadowMap é um projeto da UCSAL sobre calor urbano e arborização em Salvador.",
    related: ["dados-simulados", "equipe", "mapa"],
    actionIds: ["project"],
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
    label: "Sobre os dados",
    summary:
      "Os pontos e as zonas são exemplos de demonstração. Eles não representam medições nem relatos reais.",
    related: ["selo", "uso-dados", "cidades"],
    actionIds: ["show-map"],
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
    label: "Usar o mapa",
    summary:
      "Arraste para navegar e use +/− para dar zoom. Toque em um marcador para abrir seus detalhes.",
    related: ["legenda", "filtros", "cadastro"],
    actionIds: ["show-map"],
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
    label: "Usar filtros",
    summary:
      "Use cidade, ocorrência e criticidade para filtrar pontos. As zonas de calor acompanham a cidade escolhida.",
    related: ["cidades", "prioridade", "mapa"],
    actionIds: ["show-map"],
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
    label: "Criar um ponto",
    summary:
      "Abra “Novo ponto”, preencha os campos e escolha o local no mapa. O cadastro aparece apenas nesta sessão.",
    related: ["privacidade", "prioridade", "mapa"],
    actionIds: ["new-point"],
    question: "Como simular um cadastro?",
    keywords: [
      "cadastrar",
      "cadastro",
      "novo ponto",
      "criar ponto",
      "criar um ponto",
      "adicionar ponto",
      "adicionar um ponto",
      "cadastrar um ponto",
      "registrar",
      "formulario",
      "simular cadastro",
      "enviar ponto",
      "salvar ponto",
    ],
    answer:
      "Para simular um cadastro:\n\n1. Toque em “Novo ponto” para abrir o formulário no painel lateral.\n2. Preencha bairro, cidade, tipo de ocorrência, níveis de calor e sombra. A prioridade é calculada automaticamente.\n3. Envie o formulário.\n\nO ponto fica disponível no mapa e no painel durante a navegação. Os pontos adicionados e rascunhos são descartados ao recarregar a página. Nada é enviado para um servidor, gravado em banco ou compartilhado.",
  },
  {
    id: "criar-zona",
    label: "Criar uma zona",
    summary:
      "Use “Nova zona” no mapa, marque o contorno e conclua a área para preencher os dados. A zona é simulada e dura nesta sessão.",
    related: ["ilhas-de-calor", "legenda", "dados-simulados"],
    actionIds: ["show-map"],
    question: "Como criar uma zona?",
    keywords: ["criar zona", "criar uma zona", "nova zona", "desenhar zona", "desenhar area", "editar zona", "excluir zona", "contorno", "poligono"],
    answer:
      "No mapa, use “Nova zona”. Marque pelo menos três vértices e arraste os marcadores para ajustar o contorno. Use “Desfazer” se errar e “Concluir área” para abrir os dados no painel.\n\nInforme nome, cidade e intensidade ilustrativa do calor. Depois de criar, selecione a zona no mapa ou na lista “Zonas nesta sessão” para editar ou excluir. A exclusão pode ser desfeita pelo aviso.\n\nZonas criadas são simuladas e duram até recarregar a página. Durante o desenho, os cliques ficam reservados à zona; conclua ou cancele para voltar a criar pontos.",
  },
  {
    id: "prioridade",
    label: "Calcular prioridade",
    summary:
      "Calor extremo ou alto sem sombra gera prioridade crítica. As outras faixas seguem o nível de calor.",
    related: ["legenda", "arborizacao", "dados-simulados"],
    actionIds: ["show-legend"],
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
    label: "Ilhas de calor",
    summary:
      "Asfalto, concreto e pouca vegetação podem deixar áreas urbanas mais quentes que o entorno.",
    related: ["arborizacao", "legenda", "dados-simulados"],
    actionIds: ["show-legend"],
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
    label: "Arborização",
    summary:
      "Árvores oferecem sombra e ajudam a reduzir o calor nas ruas. Os níveis de sombra deste mapa são ilustrativos.",
    related: ["especies", "prioridade", "ilhas-de-calor"],
    actionIds: [],
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
    label: "Espécies nativas",
    summary:
      "A demonstração tem conteúdo educativo sobre árvores nativas. Para escolher uma espécie, procure orientação local.",
    related: ["arborizacao", "equipe", "sobre"],
    actionIds: ["project"],
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
    label: "Ver estatísticas",
    summary:
      "Veja totais, rankings de bairros e distribuições dos pontos. Os gráficos usam os dados simulados da amostra.",
    related: ["filtros", "prioridade", "dados-simulados"],
    actionIds: ["dashboard"],
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
    label: "Cidades atendidas",
    summary:
      "A amostra inclui pontos de Salvador. As outras cidades podem ser escolhidas no filtro ou em um cadastro local.",
    related: ["filtros", "cadastro", "dados-simulados"],
    actionIds: ["show-map"],
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
      "Os dados iniciais da amostra são de Salvador. Camaçari, Lauro de Freitas e Simões Filho estão disponíveis nos filtros e no cadastro, mas começam sem pontos. Você pode adicionar exemplos locais durante esta sessão.",
  },
  {
    id: "privacidade",
    label: "Privacidade",
    summary:
      "O cadastro não pede dados pessoais nem usa o GPS. Os pontos adicionados ficam apenas na sessão atual.",
    related: ["cadastro", "login", "dados-simulados"],
    actionIds: ["project"],
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
    label: "Acesso ao mapa",
    summary: "Você pode explorar o mapa e simular pontos sem criar conta.",
    related: ["cadastro", "privacidade", "gratuito"],
    actionIds: ["show-map"],
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
    label: "Mapa base",
    summary:
      "O mapa base usa OpenStreetMap. Se os blocos não carregarem, confira a conexão e tente recarregar a página.",
    related: ["mapa", "dados-simulados", "filtros"],
    actionIds: ["show-map"],
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
    label: "Sobre a ajuda",
    summary:
      "Sou um guia com respostas prontas sobre o ShadowMap. Posso explicar tarefas e abrir recursos da interface.",
    related: ["mapa", "cadastro", "ajuda"],
    actionIds: [],
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
      "Esta ajuda usa respostas prontas, escolhidas por assunto. Não consulta uma IA generativa nem serviços externos. A conversa fica apenas nesta página e recomeça ao recarregar.",
  },
  {
    id: "gratuito",
    label: "Uso gratuito",
    summary:
      "A demonstração é gratuita e faz parte de um projeto acadêmico da UCSAL.",
    related: ["sobre", "login", "equipe"],
    actionIds: [],
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
    label: "Equipe do projeto",
    summary:
      "O projeto é desenvolvido na extensão da UCSAL. A página do projeto reúne informações sobre a demonstração.",
    related: ["sobre", "uso-dados", "especies"],
    actionIds: ["project"],
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
    label: "Uso dos dados",
    summary:
      "Você pode apresentar a interface como exemplo. Os dados simulados não servem como evidência ambiental.",
    related: ["dados-simulados", "equipe", "sobre"],
    actionIds: ["project"],
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
    label: "Selo Simulado",
    summary:
      "O selo “Simulado” identifica exemplos criados para a demonstração.",
    related: ["dados-simulados", "legenda", "uso-dados"],
    actionIds: ["show-legend"],
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
    label: "Outros assuntos",
    summary:
      "Escolha um assunto para continuar. Posso explicar o mapa, as cores, o cadastro e os dados.",
    related: ["mapa", "legenda", "cadastro", "dados-simulados"],
    actionIds: [],
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
      "Escolha um assunto para continuar. Posso explicar o mapa, as cores, o cadastro e os dados.",
  },
  {
    id: "saudacao",
    label: "Começar",
    summary: "Olá! O que você quer fazer no mapa?",
    related: ["mapa", "cadastro", "dados-simulados"],
    actionIds: [],
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
    answer: "Olá! O que você quer fazer no mapa?",
  },
  {
    id: "agradecimento",
    label: "Continuar",
    summary: "Por nada! Quer explorar outro assunto?",
    related: ["mapa", "legenda", "cadastro"],
    actionIds: [],
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
    answer: "Por nada! Quer explorar outro assunto?",
  },
  {
    id: "legenda",
    label: "Entender as cores",
    summary:
      "Amarelo indica calor baixo; vermelho escuro, extremo. Nos pontos, a cor do contorno mostra a prioridade.",
    related: ["prioridade", "dados-simulados", "ilhas-de-calor"],
    actionIds: ["show-legend"],
    question: "O que significam as cores do mapa?",
    keywords: [
      "legenda",
      "cores",
      "cor",
      "cores do mapa",
      "entender as cores",
      "entender a legenda",
      "mostrar legenda",
    ],
    answer:
      "Nas zonas ilustrativas, amarelo indica calor baixo, laranja indica médio, vermelho indica alto e vermelho escuro indica extremo.\n\nOs pontos simulados têm preenchimento cinza e contorno tracejado. A cor do contorno indica prioridade: verde para baixa, amarelo para média, laranja para alta e vermelho para crítica. A prioridade é calculada a partir de calor e sombra.",
  },
];

export interface ChatbotSuggestion {
  topicId: string;
  label: string;
  question: string;
}

export interface ChatbotReply {
  text: string;
  topicId: string | null;
  details?: string;
  suggestions: ChatbotSuggestion[];
  actions: GuideAction[];
}

export const STARTER_TASKS = [
  { topicId: "mapa", label: "Como usar o mapa?" },
  { topicId: "legenda", label: "O que significam as cores?" },
  { topicId: "cadastro", label: "Como criar um ponto?" },
  { topicId: "dados-simulados", label: "Os dados são reais?" },
];

export const WELCOME_MESSAGE =
  "Olá! Sou o assistente do ShadowMap. Posso conversar com você sobre o mapa, os pontos e os dados do projeto. O que você gostaria de saber?";

export function normalizeChatText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function suggestionsFor(ids: string[]): ChatbotSuggestion[] {
  return [...new Set(ids)].flatMap((id) => {
    const topic = CHATBOT_TOPICS.find((candidate) => candidate.id === id);
    return topic
      ? [{ topicId: topic.id, label: topic.label, question: topic.question }]
      : [];
  });
}

export function getTopicReply(topicId: string): ChatbotReply {
  const topic = CHATBOT_TOPICS.find((candidate) => candidate.id === topicId);
  if (!topic) return fallbackReply([]);

  const related =
    topic.id === "ajuda"
      ? topic.related
      : [...topic.related.filter((id) => id !== "ajuda").slice(0, 2), "ajuda"];

  return {
    text: topic.summary,
    topicId: topic.id,
    details: topic.answer === topic.summary ? undefined : topic.answer,
    suggestions: suggestionsFor(related),
    actions: (topic.actionIds ?? []).map((id) => GUIDE_ACTIONS[id]),
  };
}

function fallbackReply(related: string[]): ChatbotReply {
  return {
    text: "Ainda não reconheci essa pergunta. Você quis falar de algum destes assuntos?",
    topicId: null,
    suggestions: suggestionsFor(
      related.length ? related : ["mapa", "legenda", "cadastro"],
    ),
    actions: [],
  };
}

function keywordScore(message: string, keyword: string): number {
  const normalized = normalizeChatText(keyword);
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!normalized || !new RegExp(`(^|\\s)${escaped}(\\s|$)`).test(message))
    return 0;
  return (
    12 + normalized.split(" ").length * 8 + Math.min(normalized.length, 24)
  );
}

function similarWord(left: string, right: string): boolean {
  if (left.length < 4 || right.length < 4) return false;
  const limit = Math.min(left.length, right.length) >= 7 ? 2 : 1;
  if (Math.abs(left.length - right.length) > limit) return false;

  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i++) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= right.length; j++) {
      const old = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        previous + Number(left[i - 1] !== right[j - 1]),
      );
      previous = old;
    }
  }
  return row[right.length] <= limit;
}

export function getChatbotReply(message: string): ChatbotReply {
  const normalized = normalizeChatText(message);
  const exact = CHATBOT_TOPICS.find(
    (topic) => normalizeChatText(topic.question) === normalized,
  );
  if (exact) return getTopicReply(exact.id);

  const ranked = CHATBOT_TOPICS.map((topic) => ({
    topic,
    score: Math.max(
      0,
      ...topic.keywords.map((keyword) => keywordScore(normalized, keyword)),
    ),
  })).sort((first, second) => second.score - first.score);

  if (ranked[0]?.score > 0) return getTopicReply(ranked[0].topic.id);

  const ignored = new Set([
    "como",
    "para",
    "sobre",
    "quero",
    "posso",
    "pode",
    "saber",
    "ajuda",
    "voce",
    "isso",
    "esse",
    "essa",
    "qual",
    "esta",
    "mais",
    "tenho",
    "preciso",
  ]);
  const words = normalized
    .split(" ")
    .filter((word) => word.length >= 4 && !ignored.has(word));
  const closest = CHATBOT_TOPICS.filter(
    (topic) => !["saudacao", "agradecimento", "ajuda"].includes(topic.id),
  )
    .map((topic) => {
      const keywords = [
        ...new Set(normalizeChatText(topic.keywords.join(" ")).split(" ")),
      ];
      return {
        id: topic.id,
        score: words.filter((word) =>
          keywords.some((keyword) => similarWord(word, keyword)),
        ).length,
      };
    })
    .filter((topic) => topic.score > 0)
    .sort((first, second) => second.score - first.score)
    .slice(0, 3)
    .map((topic) => topic.id);

  return fallbackReply(closest);
}
