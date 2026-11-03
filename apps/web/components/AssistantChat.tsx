"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  LogIn,
  MessageCircle,
  Send,
  Sparkles,
  User,
  X,
} from "lucide-react";

import {
  getHeatLevelLabel,
  getIssueTypeLabel,
  getPriorityLabel,
  getShadeLevelLabel,
} from "@/lib/utils";
import type {
  AssistantMessage,
  PointDraftResult,
} from "@shadowmap/types";

interface AssistantChatProps {
  onUseDraft: (result: PointDraftResult) => void;
}

export default function AssistantChat({ onUseDraft }: AssistantChatProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([
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
  const [isDraftOpen, setIsDraftOpen] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [draftResult, setDraftResult] = useState<PointDraftResult | null>(null);
  const [isDraftLoading, setIsDraftLoading] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, draftResult]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    if (status !== "authenticated") {
      setError("Faça login para usar o assistente");
      return;
    }

    setError(null);
    const userMessage: AssistantMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (response.status === 401) {
        setError("Faça login para usar o assistente");
        setMessages((prev) => prev.filter((m) => m !== userMessage));
        return;
      }

      if (response.status === 429) {
        const data = await response.json();
        setError(data.message || "Limite de mensagens atingido");
        setMessages((prev) => prev.filter((m) => m !== userMessage));
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.content },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Desculpe, não consegui processar sua mensagem. Tente novamente em instantes.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  function openDraft() {
    if (status !== "authenticated") {
      setError("Faça login para usar o assistente");
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
        body: JSON.stringify({ text }),
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

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[900] flex h-14 w-14 items-center justify-center rounded-full bg-emerald-900 text-white shadow-lg transition hover:bg-emerald-800 hover:scale-105 md:bottom-8 md:right-8"
        aria-label="Abrir assistente"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-x-4 bottom-4 top-20 z-[1000] flex flex-col overflow-hidden rounded-[24px] border border-emerald-950/10 bg-white/95 shadow-2xl backdrop-blur-sm sm:inset-x-auto sm:bottom-6 sm:right-6 sm:top-auto sm:h-[500px] sm:w-[380px]">
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

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

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
                      {msg.content}
                    </div>
                    {msg.role === "user" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}
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
                {status === "authenticated" ? (
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
                    onKeyPress={handleKeyPress}
                    placeholder={
                      status === "unauthenticated"
                        ? "Faça login para usar..."
                        : "Digite sua mensagem..."
                    }
                    className="flex-1 rounded-xl border border-emerald-950/10 bg-white px-4 py-2.5 text-sm text-emerald-950 placeholder:text-emerald-950/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    disabled={isLoading || status !== "authenticated"}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={
                      !input.trim() || isLoading || status !== "authenticated"
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
        </div>
      )}
    </>
  );
}
