import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FlaskConical } from "lucide-react";

export const metadata: Metadata = {
  title: "Sobre a demonstração — ShadowMap",
  description:
    "Esta é uma amostra visual do ShadowMap AI com dados simulados de calor urbano em Salvador.",
};

export default function PrivacyPage() {
  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto w-full max-w-4xl px-4 py-8 md:px-6 md:py-12"
    >
      <Link
        href="/"
        className="inline-flex min-h-10 items-center gap-2 rounded-full bg-emerald-100 px-4 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao mapa
      </Link>

      <header className="mt-5 glass-panel rounded-[28px] p-5 md:p-7">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-amber-100 p-2.5 text-amber-800">
            <FlaskConical className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-950/55">
              ShadowMap AI
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-emerald-950">
              Sobre esta demonstração
            </h1>
            <p className="mt-2 text-sm leading-6 text-emerald-950/72">
              Esta versão do ShadowMap AI é uma amostra visual do projeto de
              extensão da UCSAL sobre ilhas de calor e arborização em Salvador.
              Não há login, cadastro real nem persistência de dados.
            </p>
          </div>
        </div>
      </header>

      <div className="mt-4 space-y-4">
        <Section title="Dados simulados">
          <p>
            Todos os pontos e as zonas de calor exibidos no mapa são{" "}
            <strong>simulados</strong> e servem apenas para demonstrar a
            interface. Eles não representam medições de temperatura, não foram
            enviados por moradores e não devem ser usados como diagnóstico
            ambiental.
          </p>
        </Section>

        <Section title="Cadastro de pontos e zonas">
          <p>
            Os cadastros são simulações. Pontos e zonas criados ficam
            disponíveis nesta sessão enquanto você navega pela demonstração.
            As zonas podem ser desenhadas, editadas e excluídas, com intensidade
            de calor informada por você e apenas ilustrativa. Ao recarregar a
            página, os pontos, as zonas adicionadas e os rascunhos são
            descartados. Nada é enviado para um servidor, gravado
            em banco de dados ou compartilhado com terceiros.
          </p>
        </Section>

        <Section title="O que não coletamos">
          <p>
            Esta demonstração não cria contas, não pede nome, e-mail, telefone
            ou senha e não grava relatos. O mapa não solicita localização do
            dispositivo: as coordenadas vêm do clique no mapa ou dos dados
            simulados.
          </p>
        </Section>

        <Section title="Mapa e chave de API">
          <p>
            O mapa usa as camadas públicas do OpenStreetMap, que não exigem
            chave de API. A versão anterior usava as camadas do CARTO, que
            passaram a exibir um aviso de{" "}
            <strong>&quot;API KEY REQUIRED&quot;</strong> quando acessadas sem
            uma chave. Para usar o CARTO seria necessário criar uma conta no
            carto.com e fornecer uma chave de API própria.
          </p>
        </Section>

        <Section title="Contato da equipe">
          <p>
            Para dúvidas sobre o projeto ou sobre esta amostra, procure a equipe
            do projeto de extensão da UCSAL.
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
