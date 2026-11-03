"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  LogIn,
  MessageCircle,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  User,
  X,
} from "lucide-react";

import { usePilotRef } from "@/lib/use-pilot-ref";
import {
  getHeatLevelLabel,
  getIssueTypeLabel,
  getPriorityLabel,
  getShadeLevelLabel,
} from "@/lib/utils";
import type { PointDraftResult } from "@shadowmap/types";

const CONSENT_STORAGE_KEY = "shadowmap-assistant-consent";

function consentStorageKey(email?: string | null): string {
  return email
    ? `${CONSENT_STORAGE_KEY}:${email.toLowerCase()}`
    : CONSENT_STORAGE_KEY;
}

const SHORTCUTS = [
  "O que é ilha de calor?",
  "Que árvore plantar na minha calçada?",
  "Como funciona o ShadowMap?",
];

interface AssistantChatProps {
  onUseDraft: (result: PointDraftResult) => void;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  id?: string;
}

export default function AssistantChat({ onUseDraft }: AssistantChatProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        session?.user?.name
          ? `Olá, ${session.user.name}! Sou o assistente do ShadowMap AI. Posso ajudar com informações sobre ilhas de calor, espécies nativas para plantio ou como cadastrar pontos. Como posso ajudar?`
          : "Olá! Sou o assistente do ShadowMap AI. Posso ajudar com informações sobre ilhas de calor, espécies nativas para plantio ou como cadastrar pontos. Como posso ajudar?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [consentGranted, setConsentGranted] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isDraftOpen, setIsDraftOpen] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [draftResult, setDraftResult] = useState<PointDraftResult | null>(null);
  const [isDraftLoading, setIsDraftLoading] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userEmail = session?.user?.email ?? null;
  const pilotRef = usePilotRef();

  useEffect(() => {
    const key = consentStorageKey(userEmail);

    const timer = window.setTimeout(() => {
      setConsentGranted(window.localStorage.getItem(key) === "1");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [userEmail]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, draftResult]);

  async function submitMessage(rawText: string) {
    const text = rawText.trim();

    if (!text || isLoading) return;

    if (status !== "authenticated") {
      setNeedsLogin(true);
      setError("Faça login para usar o assistente.");
      return;
    }

    if (!consentGranted) {
      setError("Leia e aceite o aviso do assistente para continuar.");
      return;
    }

    setError(null);
    setNeedsLogin(false);

    const userMessage: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversationId ?? undefined,
          message: text,
          consent: true,
          ref: pilotRef ?? undefined,
        }),
      });

      if (response.status === 401) {
        setMessages((prev) => prev.filter((message) => message !== userMessage));
        setInput(text);
        setNeedsLogin(true);
        setError("Faça login para usar o assistente.");
        return;
      }

      if (response.status === 403) {
        const data = await response.json().catch(() => null);

        setMessages((prev) => prev.filter((message) => message !== userMessage));
        setInput(text);

        if (data?.code === "CONSENT_REQUIRED") {
          setConsentGranted(false);
          window.localStorage.removeItem(consentStorageKey(userEmail));
          setError("Precisamos do seu consentimento para continuar.");
        } else {
          setError("Não foi possível continuar. Tente novamente.");
        }

        return;
      }

      if (response.status === 429) {
        setMessages((prev) => prev.filter((message) => message !== userMessage));
        setInput(text);
        setError("Você atingiu o limite de hoje; volte amanhã.");
        return;
      }

      if (response.status === 503) {
        setMessages((prev) => prev.filter((message) => message !== userMessage));
        setInput(text);
        setError("Assistente indisponível no momento; use o formulário.");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      setConversationId(data.conversationId);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.content,
          id: data.messageId,
        },
      ]);
    } catch {
      setMessages((prev) => prev.filter((message) => message !== userMessage));
      setInput(text);
      setError(
        "Não consegui processar sua mensagem agora. Tente novamente em instantes.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitMessage(input);
    }
  }

  function grantConsent() {
    setConsentGranted(true);
    window.localStorage.setItem(consentStorageKey(userEmail), "1");
    setError(null);
  }

  function openDraft() {
    if (status !== "authenticated") {
      setNeedsLogin(true);
      setError("Faça login para usar o assistente.");
      return;
    }

    if (!consentGranted) {
      setError("Leia e aceite o aviso do assistente para continuar.");
      return;
    }

    setError(null);
    setDraftError(null);
    setDraftResult(null);
    setDraftText("");
    setIsDraftOpen(true);
  }

  function closeDraft() {
    setIsDraftOpen(false);
    setDraftError(null);
    setDraftResult(null);
  }

  async function requestDraft() {
    const text = draftText.trim();

    if (text.length < 10) {
      setDraftError("Descreva o relato com pelo menos 10 caracteres.");
      return;
    }

    setDraftError(null);
    setDraftResult(null);
    setIsDraftLoading(true);

    try {
      const response = await fetch("/api/assistant/draft-point", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, ref: pilotRef ?? undefined }),
      });

      if (response.status === 401) {
        setDraftError("Faça login para usar o assistente.");
        return;
      }

      if (response.status === 429) {
        setDraftError("Você atingiu o limite de hoje; volte amanhã.");
        return;
      }

      if (!response.ok) {
        setDraftError(
          "Não consegui sugerir agora. Você pode preencher o formulário manualmente.",
        );
        return;
      }

      const data = (await response.json()) as PointDraftResult;
      setDraftResult(data);
    } catch {
      setDraftError(
        "Não consegui sugerir agora. Você pode preencher o formulário manualmente.",
      );
    } finally {
      setIsDraftLoading(false);
    }
  }

  function handleUseDraft() {
    if (!draftResult) return;

    onUseDraft(draftResult);
    setIsOpen(false);
    closeDraft();
    setDraftText("");
  }

  const showConsent = status === "authenticated" && !consentGranted;

  return (
    <>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[900] flex h-14 w-14 items-center justify-center rounded-full bg-emerald-900 text-white shadow-lg transition hover:bg-emerald-800 hover:scale-105 md:bottom-8 md:right-8"
          aria-label="Abrir assistente"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      ) : null}

      {isOpen && (
        <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-[1000] flex h-[calc(100dvh-5.5rem)] max-h-[calc(100dvh-5.5rem)] flex-col overflow-hidden rounded-[24px] border border-emerald-950/10 bg-white/95 shadow-2xl backdrop-blur-sm sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[540px] sm:max-h-[calc(100dvh-3rem)] sm:w-[400px]">
          <div className="flex items-center justify-between border-b border-emerald-950/10 bg-emerald-50/80 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-emerald-700" />
              <span className="font-semibold text-emerald-950">
                Assistente ShadowMap
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1.5 text-emerald-700 hover:bg-emerald-100"
              aria-label="Fechar assistente"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {isDraftOpen ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex items-start gap-2">
                <button
                  type="button"
                  onClick={closeDraft}
                  className="mt-0.5 rounded-full p-1 text-emerald-700 hover:bg-emerald-100"
                  aria-label="Voltar para a conversa"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <p className="text-sm font-semibold text-emerald-950">
                    Relato em linguagem natural
                  </p>
                  <p className="mt-1 text-sm leading-6 text-emerald-950/70">
                    Descreva o problema. A IA sugere a classificação e você
                    confirma no formulário.
                  </p>
                </div>
              </div>

              <textarea
                value={draftText}
                onChange={(event) => setDraftText(event.target.value)}
                maxLength={600}
                rows={4}
                placeholder="Ex.: no ponto de ônibus da Av. X não tem sombra nenhuma e à tarde fica insuportável."
                className="w-full rounded-xl border border-emerald-950/10 bg-white px-3 py-2.5 text-sm text-emerald-950 placeholder:text-emerald-950/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                disabled={isDraftLoading}
              />

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={requestDraft}
                  disabled={isDraftLoading || draftText.trim().length < 10}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  {isDraftLoading ? "Sugerindo..." : "Sugerir cadastro"}
                </button>
                <span className="text-xs text-emerald-950/50">
                  {draftText.length}/600
                </span>
              </div>

              {draftError ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  {draftError}
                </div>
              ) : null}

              {draftResult ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                  <p className="text-sm font-semibold text-emerald-950">
                    Sugestão de cadastro
                  </p>
                  <p className="mt-1 text-xs text-emerald-950/60">
                    A IA pode errar. Revise todos os campos no formulário.
                  </p>

                  <dl className="mt-3 space-y-2 text-sm text-emerald-950/80">
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-950/50">
                        Tipo de ocorrência
                      </dt>
                      <dd>
                        {draftResult.draft.issueType
                          ? getIssueTypeLabel(draftResult.draft.issueType)
                          : "Não identificado"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-950/50">
                        Nível de calor
                      </dt>
                      <dd>
                        {draftResult.draft.heatLevel
                          ? getHeatLevelLabel(draftResult.draft.heatLevel)
                          : "Não identificado"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-950/50">
                        Nível de sombra
                      </dt>
                      <dd>
                        {draftResult.draft.shadeLevel
                          ? getShadeLevelLabel(draftResult.draft.shadeLevel)
                          : "Não identificado"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-950/50">
                        Prioridade sugerida
                      </dt>
                      <dd>
                        {draftResult.suggestedPriority
                          ? getPriorityLabel(draftResult.suggestedPriority)
                          : "Não calculada"}
                      </dd>
                    </div>
                  </dl>

                  <p className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-sm leading-6 text-emerald-950/80">
                    {draftResult.draft.description}
                  </p>

                  {draftResult.draft.missing.length ? (
                    <p className="mt-3 text-xs leading-5 text-emerald-950/65">
                      <strong>Faltam informações:</strong>{" "}
                      {draftResult.draft.missing.join(", ")}.
                    </p>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleUseDraft}
                    className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
                  >
                    Usar no formulário
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {status === "unauthenticated" && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-800">
                          Login necessário
                        </p>
                        <p className="mt-1 text-sm text-amber-700">
                          Faça login para usar o assistente de IA.
                        </p>
                        <button
                          onClick={() => router.push("/login")}
                          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-amber-700"
                        >
                          <LogIn className="h-4 w-4" />
                          Entrar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {showConsent ? (
                  <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4">
                    <p className="text-sm leading-6 text-emerald-950/85">
                      Este assistente usa inteligência artificial e pode errar.
                      Não substitui orientação médica nem de órgãos públicos. As
                      conversas são registradas para fins acadêmicos do projeto
                      de extensão da UCSAL. Não escreva dados pessoais
                      (telefone, CPF, endereço completo). Saiba mais em{" "}
                      <Link
                        href="/privacidade"
                        className="font-semibold text-emerald-800 underline underline-offset-2"
                      >
                        Privacidade
                      </Link>
                      .
                    </p>
                    <button
                      type="button"
                      onClick={grantConsent}
                      className="mt-3 inline-flex h-10 items-center justify-center rounded-xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
                    >
                      Concordo e quero continuar
                    </button>
                  </div>
                ) : null}

                {error ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <p>{error}</p>
                    {needsLogin ? (
                      <button
                        type="button"
                        onClick={() => router.push("/login")}
                        className="mt-2 inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-700"
                      >
                        <LogIn className="h-4 w-4" />
                        Entrar
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-6 ${
                        msg.role === "user"
                          ? "bg-emerald-900 text-white"
                          : "bg-emerald-50 text-emerald-950"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <RichText content={msg.content} />
                      ) : (
                        msg.content
                      )}
                      {msg.role === "assistant" && msg.id ? (
                        <MessageFeedback messageId={msg.id} pilotRef={pilotRef} />
                      ) : null}
                    </div>
                    {msg.role === "user" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}

                {messages.length === 1 && consentGranted && !isLoading ? (
                  <div className="flex flex-wrap gap-2">
                    {SHORTCUTS.map((shortcut) => (
                      <button
                        key={shortcut}
                        type="button"
                        onClick={() => submitMessage(shortcut)}
                        className="rounded-full border border-emerald-950/10 bg-white px-3 py-1.5 text-left text-xs font-medium text-emerald-900 transition hover:bg-emerald-50"
                      >
                        {shortcut}
                      </button>
                    ))}
                  </div>
                ) : null}

                {isLoading && (
                  <div className="flex gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="rounded-2xl bg-emerald-50 px-4 py-3">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-400 [animation-delay:-0.3s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-400 [animation-delay:-0.15s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-400" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-emerald-950/10 bg-white/80 p-3">
                {status === "authenticated" && consentGranted ? (
                  <button
                    type="button"
                    onClick={openDraft}
                    className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-200"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Quero relatar um ponto
                  </button>
                ) : null}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      status !== "authenticated"
                        ? "Faça login para usar..."
                        : showConsent
                          ? "Aceite o aviso para continuar..."
                          : "Digite sua mensagem..."
                    }
                    className="flex-1 rounded-xl border border-emerald-950/10 bg-white px-4 py-2.5 text-sm text-emerald-950 placeholder:text-emerald-950/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    disabled={
                      isLoading || status !== "authenticated" || showConsent
                    }
                  />
                  <button
                    onClick={() => submitMessage(input)}
                    disabled={
                      !input.trim() ||
                      isLoading ||
                      status !== "authenticated" ||
                      showConsent
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-900 text-white transition hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Enviar mensagem"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="border-t border-emerald-950/10 bg-emerald-50/70 px-4 py-2 text-center text-[11px] font-medium text-emerald-950/60">
            Assistente de IA — pode errar.
          </div>
        </div>
      )}
    </>
  );
}

function RichText({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let list: { type: "ul" | "ol"; items: string[] } | null = null;

  function flushList() {
    if (!list) return;

    const ListTag = list.type;
    const items = list.items;
    const key = `list-${blocks.length}`;

    blocks.push(
      <ListTag
        key={key}
        className={
          list.type === "ul"
            ? "my-1 list-disc space-y-1 pl-5"
            : "my-1 list-decimal space-y-1 pl-5"
        }
      >
        {items.map((item, index) => (
          <li key={`${key}-${index}`}>{renderInline(item)}</li>
        ))}
      </ListTag>,
    );

    list = null;
  }

  lines.forEach((rawLine, index) => {
    const line = rawLine.trimEnd();
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const ordered = line.match(/^\s*\d+\.\s+(.*)$/);

    if (bullet) {
      if (!list || list.type !== "ul") {
        flushList();
        list = { type: "ul", items: [] };
      }
      list.items.push(bullet[1]);
      return;
    }

    if (ordered) {
      if (!list || list.type !== "ol") {
        flushList();
        list = { type: "ol", items: [] };
      }
      list.items.push(ordered[1]);
      return;
    }

    flushList();

    if (!line.trim()) {
      blocks.push(<div key={`space-${index}`} className="h-1.5" />);
      return;
    }

    blocks.push(
      <p key={`paragraph-${index}`} className="whitespace-pre-wrap">
        {renderInline(line)}
      </p>,
    );
  });

  flushList();

  return <div className="space-y-1">{blocks}</div>;
}

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={index} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <Fragment key={index}>{part}</Fragment>;
  });
}

function MessageFeedback({
  messageId,
  pilotRef,
}: {
  messageId: string;
  pilotRef: string | null;
}) {
  const [rating, setRating] = useState<1 | -1 | null>(null);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  async function sendFeedback() {
    if (!rating || status === "sending" || status === "sent") return;

    setStatus("sending");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: "assistant_message",
          targetId: messageId,
          rating,
          comment: comment.trim() || undefined,
          ref: pilotRef ?? undefined,
        }),
      });

      if (!response.ok) throw new Error("feedback_failed");

      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <p className="mt-2 text-xs font-medium text-emerald-800">
        Obrigado pelo feedback.
      </p>
    );
  }

  return (
    <div className="mt-2 border-t border-emerald-950/10 pt-2">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => {
            setRating(1);
            setStatus("idle");
          }}
          aria-label="Resposta útil"
          aria-pressed={rating === 1}
          className={`rounded-full p-1.5 transition hover:bg-emerald-100 ${
            rating === 1 ? "bg-emerald-100 text-emerald-800" : "text-emerald-700"
          }`}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => {
            setRating(-1);
            setStatus("idle");
          }}
          aria-label="Resposta não útil"
          aria-pressed={rating === -1}
          className={`rounded-full p-1.5 transition hover:bg-emerald-100 ${
            rating === -1 ? "bg-emerald-100 text-emerald-800" : "text-emerald-700"
          }`}
        >
          <ThumbsDown className="h-3.5 w-3.5" />
        </button>
      </div>

      {rating ? (
        <div className="mt-2 space-y-2">
          <input
            type="text"
            value={comment}
            onChange={(event) => setComment(event.target.value.slice(0, 500))}
            placeholder="Comentário opcional"
            className="w-full rounded-lg border border-emerald-950/10 bg-white px-2.5 py-1.5 text-xs text-emerald-950 placeholder:text-emerald-950/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
          <button
            type="button"
            onClick={sendFeedback}
            disabled={status === "sending"}
            className="rounded-lg bg-emerald-900 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
          >
            {status === "sending" ? "Enviando..." : "Enviar feedback"}
          </button>
          {status === "error" ? (
            <p className="text-xs text-red-700">
              Não foi possível enviar o feedback.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
