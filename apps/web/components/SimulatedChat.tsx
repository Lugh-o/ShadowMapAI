"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Bot,
  MessageCircle,
  RotateCcw,
  Send,
  Sparkles,
  X,
} from "lucide-react";

import {
  SUGGESTED_QUESTIONS,
  WELCOME_MESSAGE,
  getChatbotReply,
} from "@/lib/chatbot/knowledge";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  { id: "welcome", role: "bot", text: WELCOME_MESSAGE },
];

export default function SimulatedChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const messageIdRef = useRef(0);
  const replyTimerRef = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function nextMessageId() {
    messageIdRef.current += 1;
    return `chat-${messageIdRef.current}`;
  }

  function clearReplyTimer() {
    if (replyTimerRef.current !== null) {
      window.clearTimeout(replyTimerRef.current);
      replyTimerRef.current = null;
    }
  }

  useEffect(() => {
    return () => clearReplyTimer();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 80);

    return () => window.clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const container = scrollRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [isOpen, messages, isTyping]);

  function sendMessage(rawText: string) {
    const text = rawText.trim();
    if (!text || isTyping) return;

    const reply = getChatbotReply(text);

    setMessages((current) => [
      ...current,
      { id: nextMessageId(), role: "user", text },
    ]);
    setInput("");
    setIsTyping(true);

    const delay = Math.min(1500, 550 + reply.text.length * 2.5);

    clearReplyTimer();
    replyTimerRef.current = window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        { id: nextMessageId(), role: "bot", text: reply.text },
      ]);
      setIsTyping(false);
      replyTimerRef.current = null;
    }, delay);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(input);
  }

  function handleReset() {
    clearReplyTimer();
    setMessages(INITIAL_MESSAGES);
    setInput("");
    setIsTyping(false);
    inputRef.current?.focus();
  }

  return (
    <>
      {isOpen ? (
        <section
          id="shadowmap-chat-panel"
          role="dialog"
          aria-label="Assistente simulado do ShadowMap"
          className="glass-panel fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5.75rem)] z-[950] flex max-h-[min(74svh,620px)] flex-col overflow-hidden rounded-[28px] sm:inset-x-auto sm:right-6 sm:bottom-[calc(env(safe-area-inset-bottom)+6.5rem)] sm:w-[400px]"
        >
          <header className="flex items-start justify-between gap-3 bg-emerald-900 px-4 py-3 text-emerald-50">
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50/15">
                <Bot className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate font-display text-sm font-semibold">
                    Assistente ShadowMap
                  </h2>
                  <span className="rounded-full bg-amber-300/95 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-amber-950">
                    Fictício
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-emerald-50/75">
                  Respostas pré-escritas · nenhuma IA real
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-emerald-50/80 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-300/60"
                aria-label="Reiniciar conversa"
                title="Reiniciar conversa"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-emerald-50/80 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-300/60"
                aria-label="Fechar assistente"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div
            ref={scrollRef}
            role="log"
            aria-live="polite"
            aria-label="Conversa com o assistente"
            className="flex-1 space-y-3 overflow-y-auto px-3 py-4"
          >
            {messages.map((message) => (
              <ChatBubble key={message.id} message={message} />
            ))}

            {isTyping ? <TypingBubble /> : null}
          </div>

          <div className="border-t border-emerald-950/10 bg-white/70 px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-950/50">
              <Sparkles className="h-3 w-3" />
              Perguntas rápidas
            </div>
            <div className="mt-1.5 flex gap-2 overflow-x-auto pb-1">
              {SUGGESTED_QUESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => sendMessage(question)}
                  disabled={isTyping}
                  className="shrink-0 rounded-full border border-emerald-900/15 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-900 transition hover:border-emerald-900/30 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-emerald-950/10 bg-white/85 px-3 py-2.5 pb-[calc(env(safe-area-inset-bottom)+0.625rem)] sm:pb-2.5"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={280}
              placeholder="Escreva sua pergunta..."
              aria-label="Sua pergunta sobre o ShadowMap"
              className="h-11 min-w-0 flex-1 rounded-2xl border border-emerald-950/12 bg-white px-3.5 text-sm text-emerald-950 outline-none transition placeholder:text-emerald-950/40 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/30"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-900 text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 disabled:cursor-not-allowed disabled:bg-emerald-900/40"
              aria-label="Enviar mensagem"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        aria-controls="shadowmap-chat-panel"
        className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-[900] inline-flex h-14 w-14 items-center justify-center gap-2 rounded-full bg-emerald-900 text-white shadow-[0_18px_45px_rgba(27,56,44,0.3)] transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 active:scale-[0.98] sm:right-6 sm:w-auto sm:px-5"
        aria-label={
          isOpen ? "Fechar assistente simulado" : "Abrir assistente simulado"
        }
        title={isOpen ? "Fechar assistente" : "Perguntar ao assistente"}
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageCircle className="h-5 w-5" />
        )}
        <span className="hidden text-sm font-semibold sm:inline">
          {isOpen ? "Fechar chat" : "Perguntar ao assistente"}
        </span>
        {!isOpen ? (
          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-amber-400 sm:hidden" />
        ) : null}
      </button>
    </>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex items-end gap-2",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser ? (
        <span className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-900">
          <Bot className="h-4 w-4" />
        </span>
      ) : null}

      <div
        className={cn(
          "max-w-[85%] rounded-[20px] px-3.5 py-2.5 text-sm leading-6 whitespace-pre-line",
          isUser
            ? "rounded-br-md bg-emerald-900 text-white"
            : "rounded-bl-md bg-white text-emerald-950/85 shadow-sm",
        )}
      >
        {message.text}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex items-end gap-2 justify-start">
      <span className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-900">
        <Bot className="h-4 w-4" />
      </span>
      <div className="flex items-center gap-1.5 rounded-[20px] rounded-bl-md bg-white px-4 py-3 shadow-sm">
        <span className="sr-only">Digitando…</span>
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-700 [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-700 [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-700" />
      </div>
    </div>
  );
}
