import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacidade — ShadowMap",
  description:
    "Como o ShadowMap AI trata os dados de quem participa do projeto de extensão da UCSAL.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 md:px-6 md:py-12">
      <Link
        href="/"
        className="inline-flex min-h-10 items-center gap-2 rounded-full bg-emerald-100 px-4 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao mapa
      </Link>

      <header className="mt-5 glass-panel rounded-[28px] p-5 md:p-7">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-emerald-100 p-2.5 text-emerald-800">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-950/55">
              ShadowMap AI
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-emerald-950">
              Política de privacidade
            </h1>
            <p className="mt-2 text-sm leading-6 text-emerald-950/72">
              Esta página explica, em linguagem simples, quais dados o projeto
              usa e para quê. O ShadowMap AI é um projeto de extensão da UCSAL
              sobre ilhas de calor e arborização na Região Metropolitana de
              Salvador.
            </p>
          </div>
        </div>
      </header>

      <div className="mt-4 space-y-4">
        <Section title="Para que usamos os dados">
          <p>
            Usamos os dados para registrar e revisar relatos de moradores,
            montar o mapa e o painel público do projeto, responder dúvidas pelo
            assistente e avaliar o piloto com a comunidade. Também usamos as
            informações para o relatório acadêmico da disciplina.
          </p>
        </Section>

        <Section title="Quais dados tratamos">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Conta:</strong> nome e e-mail informados no cadastro (ou
              recebidos do login com Google).
            </li>
            <li>
              <strong>Relatos:</strong> cidade, bairro, tipo de problema, níveis
              de calor e sombra, descrição e o ponto marcado no mapa.
            </li>
            <li>
              <strong>Conversas com o assistente:</strong> mensagens enviadas e
              respostas geradas, para fins acadêmicos e de melhoria do serviço.
            </li>
            <li>
              <strong>Origem do convite:</strong> o código <code>ref</code> do
              link usado por cada integrante da equipe, para saber qual
              aplicador ajudou a recrutar participantes.
            </li>
            <li>
              <strong>Feedback:</strong> nota e comentário opcional sobre o uso
              do ShadowMap.
            </li>
          </ul>
        </Section>

        <Section title="O que não coletamos">
          <p>
            Não gravamos o seu endereço IP. Não fazemos rastreamento de
            localização contínua: só guardamos o ponto que você marca
            voluntariamente no mapa. Não pedimos telefone, CPF ou endereço
            completo, e pedimos que esses dados não sejam escritos no
            assistente.
          </p>
        </Section>

        <Section title="Base do tratamento e consentimento">
          <p>
            O tratamento é feito com base no seu consentimento, dado ao criar a
            conta, ao aceitar o aviso do assistente e ao enviar um relato ou
            feedback. Você pode retirar o consentimento e pedir a exclusão dos
            seus dados pelo contato abaixo.
          </p>
        </Section>

        <Section title="Por quanto tempo guardamos">
          <p>
            Guardamos os dados até o fim da disciplina, salvo pedido de exclusão
            antes disso. Depois desse prazo, os dados são removidos ou
            anonimizados para uso apenas estatístico no relatório acadêmico.
          </p>
        </Section>

        <Section title="Seus direitos (LGPD)">
          <p>
            A Lei Geral de Proteção de Dados (Lei nº 13.709/2018) garante a você
            o direito de saber quais dados temos, corrigir informações
            incorretas, pedir a exclusão e revogar o consentimento. Para
            exercer esses direitos, fale com a equipe.
          </p>
        </Section>

        <Section title="Aviso sobre o assistente de IA">
          <p>
            O assistente usa inteligência artificial e pode cometer erros ou
            trazer informações desatualizadas. As respostas não substituem
            orientação médica, jurídica ou de órgãos públicos. Em caso de
            dúvida de saúde, procure uma UBS ou um profissional.
          </p>
        </Section>

        <Section title="Contato da equipe">
          <p>
            Para dúvidas, solicitações ou pedidos de exclusão, escreva para{" "}
            <strong>[E-MAIL DE CONTATO DA EQUIPE]</strong>.
          </p>
        </Section>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-panel rounded-[24px] p-5 text-sm leading-6 text-emerald-950/78 md:p-6">
      <h2 className="font-display text-lg font-semibold text-emerald-950">
        {title}
      </h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}
