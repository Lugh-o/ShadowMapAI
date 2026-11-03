"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MessageCircle, X, Send, Bot, User, LogIn, AlertTriangle } from "lucide-react";
import type { AssistantMessage } from "@shadowmap/types";

export default function AssistantChat() {
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
                disabled={!input.trim() || isLoading || status !== "authenticated"}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-900 text-white transition hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Enviar mensagem"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
