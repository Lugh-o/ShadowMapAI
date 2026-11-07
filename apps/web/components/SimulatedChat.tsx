"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { FormEvent, Ref } from "react";
import { ArrowDown, ArrowUpRight, Bot, RotateCcw, Send, X } from "lucide-react";

import { useMapGuide } from "@/components/MapGuideProvider";
import {
  STARTER_TASKS,
  WELCOME_MESSAGE,
  getChatbotReply,
  getTopicReply,
} from "@/lib/chatbot/knowledge";
import type { ChatbotReply, ChatbotSuggestion } from "@/lib/chatbot/knowledge";
import type { GuideAction, MapGuideAction } from "@/lib/guide-actions";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "guide";
  text: string;
  reply?: ChatbotReply;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  { id: "welcome", role: "guide", text: WELCOME_MESSAGE },
];

export default function SimulatedChat() {
  const pathname = usePathname();
  const router = useRouter();
  const { requestAction } = useMapGuide();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [hasNewReply, setHasNewReply] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState<Set<string>>(
    new Set(),
  );
  const messageIdRef = useRef(0);
  const panelRef = useRef<HTMLElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const composerRef = useRef<HTMLFormElement>(null);
  const latestReplyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const stickToBottomRef = useRef(true);
  const savedScrollRef = useRef(0);
  const focusReplyRef = useRef(false);

  function closeGuide(restoreFocus = true) {
    if (scrollRef.current) savedScrollRef.current = scrollRef.current.scrollTop;
    setIsOpen(false);
    if (restoreFocus) {
      requestAnimationFrame(() =>
        launcherRef.current?.focus({ preventScroll: true }),
      );
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    const frame = requestAnimationFrame(() => {
      if (window.matchMedia("(min-width: 40rem) and (pointer: fine)").matches) {
        inputRef.current?.focus({ preventScroll: true });
      } else {
        panelRef.current?.focus({ preventScroll: true });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const viewport = window.visualViewport;
    function syncViewport() {
      const panel = panelRef.current;
      if (!panel) return;
      const visibleHeight = viewport?.height ?? window.innerHeight;
      const keyboardOffset = Math.max(
        0,
        window.innerHeight - visibleHeight - (viewport?.offsetTop ?? 0),
      );
      panel.style.setProperty("--guide-visible-height", `${visibleHeight}px`);
      panel.style.setProperty("--guide-keyboard-offset", `${keyboardOffset}px`);
      if (keyboardOffset > 80) panel.style.setProperty("--guide-gap", "8px");
      else panel.style.removeProperty("--guide-gap");
    }
    syncViewport();
    viewport?.addEventListener("resize", syncViewport);
    viewport?.addEventListener("scroll", syncViewport);
    window.addEventListener("resize", syncViewport);
    return () => {
      viewport?.removeEventListener("resize", syncViewport);
      viewport?.removeEventListener("scroll", syncViewport);
      window.removeEventListener("resize", syncViewport);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.key === "Escape" &&
        event.target instanceof Node &&
        panelRef.current?.contains(event.target)
      ) {
        event.preventDefault();
        setIsOpen(false);
        requestAnimationFrame(() =>
          launcherRef.current?.focus({ preventScroll: true }),
        );
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen || !scrollRef.current) return;
    const container = scrollRef.current;
    container.scrollTop = stickToBottomRef.current
      ? container.scrollHeight
      : savedScrollRef.current;
    if (focusReplyRef.current) {
      latestReplyRef.current?.focus({ preventScroll: true });
      focusReplyRef.current = false;
    }
  }, [isOpen, messages]);

  useLayoutEffect(() => {
    if (!isOpen || !scrollRef.current || !contentRef.current) return;
    function syncPanelSize() {
      const panel = panelRef.current;
      const content = contentRef.current;
      const viewport = scrollRef.current;
      if (panel && content && viewport) {
        const viewportStyle = getComputedStyle(viewport);
        const contentHeight =
          content.offsetHeight +
          parseFloat(viewportStyle.paddingTop) +
          parseFloat(viewportStyle.paddingBottom);
        const height =
          contentHeight +
          (headerRef.current?.offsetHeight ?? 0) +
          (composerRef.current?.offsetHeight ?? 0) +
          2;
        panel.style.setProperty(
          "--guide-content-height",
          `${Math.ceil(height)}px`,
        );
      }
      if (stickToBottomRef.current && scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
    syncPanelSize();
    const observer = new ResizeObserver(syncPanelSize);
    observer.observe(scrollRef.current);
    observer.observe(contentRef.current);
    if (headerRef.current) observer.observe(headerRef.current);
    if (composerRef.current) observer.observe(composerRef.current);
    return () => observer.disconnect();
  }, [isOpen]);

  function handleScroll() {
    const container = scrollRef.current;
    if (!container) return;
    savedScrollRef.current = container.scrollTop;
    stickToBottomRef.current =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      40;
    if (stickToBottomRef.current) setHasNewReply(false);
  }

  function sendMessage(rawText: string, reply = getChatbotReply(rawText)) {
    const text = rawText.trim();
    if (!text) return;
    const container = scrollRef.current;
    if (container) {
      savedScrollRef.current = container.scrollTop;
      stickToBottomRef.current =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        40;
    }
    setHasNewReply(!stickToBottomRef.current);
    const userId = `chat-${++messageIdRef.current}`;
    const replyId = `chat-${++messageIdRef.current}`;
    setMessages((current) => [
      ...current,
      { id: userId, role: "user", text },
      { id: replyId, role: "guide", text: reply.text, reply },
    ]);
    setInput("");
  }

  function sendTopic(topic: ChatbotSuggestion) {
    focusReplyRef.current = true;
    sendMessage(topic.question, getTopicReply(topic.topicId));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(input);
  }

  function resetConversation() {
    stickToBottomRef.current = true;
    savedScrollRef.current = 0;
    focusReplyRef.current = false;
    setHasNewReply(false);
    setExpandedDetails(new Set());
    setMessages(INITIAL_MESSAGES);
    setInput("");
    if (window.matchMedia("(min-width: 40rem) and (pointer: fine)").matches)
      inputRef.current?.focus({ preventScroll: true });
    else panelRef.current?.focus({ preventScroll: true });
  }

  function toggleDetails(id: string) {
    stickToBottomRef.current = false;
    if (scrollRef.current) savedScrollRef.current = scrollRef.current.scrollTop;
    setExpandedDetails((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function showLatestReply() {
    stickToBottomRef.current = true;
    setHasNewReply(false);
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    latestReplyRef.current?.focus({ preventScroll: true });
  }

  function executeMapAction(action: MapGuideAction) {
    closeGuide(false);
    requestAction(action);
    if (pathname !== "/") router.push("/");
  }

  const isWelcome = messages.length === 1;
  const latestId = messages.at(-1)?.id;

  return (
    <>
      {isOpen ? (
        <section
          ref={panelRef}
          id="shadowmap-chat-panel"
          role="dialog"
          aria-labelledby="shadowmap-guide-title"
          aria-describedby="shadowmap-guide-description"
          tabIndex={-1}
          className="assistant-chat-panel glass-panel fixed inset-x-3 bottom-[calc(var(--guide-keyboard-offset,0px)+var(--guide-gap)+env(safe-area-inset-bottom))] z-[950] flex h-[min(620px,var(--guide-content-height,440px),calc(var(--guide-visible-height,100dvh)-var(--guide-gap)-1rem-env(safe-area-inset-bottom)))] min-h-0 flex-col overflow-hidden rounded-3xl text-sm outline-none [--guide-gap:5rem] sm:inset-x-auto sm:right-6 sm:w-[400px]"
        >
          <header
            ref={headerRef}
            className="flex shrink-0 items-center justify-between gap-2 bg-emerald-900 px-3 py-2.5 text-emerald-50"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50/10">
                <Bot className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2
                  id="shadowmap-guide-title"
                  className="font-display text-sm font-semibold"
                >
                  Assistente ShadowMap
                </h2>
                <p
                  id="shadowmap-guide-description"
                  className="mt-0.5 text-[10px] leading-4 text-emerald-50/60"
                >
                  Demonstração · respostas prontas
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center">
              <button
                type="button"
                onClick={resetConversation}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-emerald-50/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-300 motion-reduce:transition-none"
                aria-label="Reiniciar conversa"
                title="Reiniciar conversa"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => closeGuide()}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-emerald-50/85 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-300 motion-reduce:transition-none"
                aria-label="Fechar assistente"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </header>

          <div className="relative min-h-0 flex-1">
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              role="log"
              aria-live="polite"
              aria-relevant="additions"
              aria-label="Conversa com o assistente"
              className="h-full overflow-y-auto overscroll-contain px-3 py-3 [overflow-anchor:none] [scrollbar-width:thin]"
            >
              <div ref={contentRef} className="space-y-3">
                {messages.map((message) => (
                  <ChatBubble
                    key={message.id}
                    message={message}
                    isLatest={message.id === latestId}
                    focusRef={
                      message.id === latestId ? latestReplyRef : undefined
                    }
                    detailsExpanded={expandedDetails.has(message.id)}
                    onToggleDetails={() => toggleDetails(message.id)}
                    onChooseTopic={sendTopic}
                    onMapAction={executeMapAction}
                    onNavigate={() => closeGuide(false)}
                  />
                ))}
                {isWelcome ? (
                  <div className="pl-9" aria-label="Perguntas rápidas">
                    <p className="mb-1.5 text-[11px] text-emerald-950/50">
                      Você pode me perguntar:
                    </p>
                    <div className="flex flex-wrap gap-1.5 text-[11px] leading-4">
                      {STARTER_TASKS.map((task) => (
                        <button
                          key={task.topicId}
                          type="button"
                          onClick={() =>
                            sendTopic({ ...task, question: task.label })
                          }
                          className="min-h-8 max-w-full rounded-xl border border-emerald-950/8 bg-white/45 px-2.5 py-1.5 text-left text-emerald-950/65 transition-colors hover:border-emerald-700/25 hover:bg-white hover:text-emerald-900 focus-visible:outline-2 focus-visible:outline-emerald-700 motion-reduce:transition-none"
                        >
                          {task.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            {hasNewReply ? (
              <button
                type="button"
                onClick={showLatestReply}
                className="absolute bottom-2 left-1/2 inline-flex min-h-9 -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-900/15 bg-white px-3 text-xs font-semibold text-emerald-900 shadow-md focus-visible:outline-2 focus-visible:outline-emerald-700"
              >
                Nova resposta{" "}
                <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <form
            ref={composerRef}
            onSubmit={handleSubmit}
            className="shrink-0 border-t border-emerald-950/5 bg-white/75 p-2.5 text-base sm:text-sm"
          >
            <div className="flex items-center gap-1.5 rounded-2xl border border-emerald-950/10 bg-white p-1 shadow-sm transition-[border-color,box-shadow] focus-within:border-emerald-700/50 focus-within:ring-2 focus-within:ring-emerald-600/15 motion-reduce:transition-none">
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && event.nativeEvent.isComposing)
                    event.preventDefault();
                }}
                maxLength={280}
                placeholder="Escreva sua pergunta..."
                aria-label="Sua pergunta sobre o ShadowMap"
                className="h-10 min-w-0 flex-1 rounded-xl bg-transparent px-2.5 text-emerald-950 outline-none placeholder:text-emerald-950/45"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-900 text-white shadow-sm transition-[background-color,color,box-shadow,transform] hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 enabled:active:scale-95 disabled:cursor-not-allowed disabled:bg-emerald-950/5 disabled:text-emerald-950/30 disabled:shadow-none motion-reduce:transition-none"
                aria-label="Enviar mensagem"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <button
        ref={launcherRef}
        type="button"
        onClick={() => (isOpen ? closeGuide() : setIsOpen(true))}
        aria-expanded={isOpen}
        aria-controls="shadowmap-chat-panel"
        aria-label={
          isOpen ? "Fechar assistente simulado" : "Abrir assistente simulado"
        }
        title={isOpen ? "Fechar conversa" : "Perguntar ao assistente"}
        className="assistant-launcher fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-[900] inline-flex h-12 w-12 items-center justify-center gap-2.5 rounded-full border border-emerald-950/10 bg-emerald-900 text-white shadow-[0_4px_14px_rgba(6,78,59,0.16)] transition-[background-color,box-shadow,transform] duration-150 hover:bg-emerald-800 hover:shadow-[0_6px_18px_rgba(6,78,59,0.2)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600 motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-safe:active:scale-[0.98] motion-reduce:transition-none sm:right-6 sm:w-auto sm:rounded-2xl sm:pr-4 sm:pl-1.5"
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-emerald-50/10"
          aria-hidden="true"
        >
          {isOpen ? (
            <X className="h-[18px] w-[18px]" />
          ) : (
            <Bot className="h-[18px] w-[18px]" />
          )}
        </span>
        <span className="hidden text-sm font-semibold sm:inline">
          {isOpen ? "Fechar conversa" : "Perguntar ao assistente"}
        </span>
      </button>
    </>
  );
}

interface ChatBubbleProps {
  message: ChatMessage;
  isLatest: boolean;
  focusRef?: Ref<HTMLDivElement>;
  detailsExpanded: boolean;
  onToggleDetails: () => void;
  onChooseTopic: (topic: ChatbotSuggestion) => void;
  onMapAction: (action: MapGuideAction) => void;
  onNavigate: () => void;
}

function ChatBubble({
  message,
  isLatest,
  focusRef,
  detailsExpanded,
  onToggleDetails,
  onChooseTopic,
  onMapAction,
  onNavigate,
}: ChatBubbleProps) {
  const isUser = message.role === "user";
  const reply = message.reply;
  function renderAction(action: GuideAction, index: number) {
    const actionClassName = cn(
      "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl px-3 py-2 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 motion-reduce:transition-none",
      index === 0
        ? "bg-emerald-900 text-white hover:bg-emerald-800"
        : "border border-emerald-950/10 text-emerald-900 hover:bg-emerald-50",
    );
    return action.type === "link" ? (
      <Link
        key={action.id}
        href={action.href}
        onNavigate={onNavigate}
        className={actionClassName}
      >
        {action.label}{" "}
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    ) : (
      <button
        key={action.id}
        type="button"
        onClick={() => onMapAction(action.id)}
        className={actionClassName}
      >
        {action.label}{" "}
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "flex min-w-0 items-start gap-2",
        isLatest && message.id !== "welcome" && "assistant-message-enter",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser ? (
        <span className="mt-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-900">
          <Bot className="h-4 w-4" aria-hidden="true" />
        </span>
      ) : null}
      <div
        ref={focusRef}
        tabIndex={-1}
        className={cn(
          "min-w-0 text-sm outline-none [overflow-wrap:anywhere]",
          isUser ? "max-w-[85%]" : "max-w-[calc(100%-2.25rem)]",
        )}
      >
        <div
          className={cn(
            "rounded-[20px] px-3 py-2.5 leading-6",
            isUser
              ? "rounded-br-md bg-emerald-900 text-white"
              : "rounded-bl-md border border-emerald-950/5 bg-white text-emerald-950/85 shadow-sm",
          )}
        >
          <p className="whitespace-pre-line">{message.text}</p>
          {reply?.actions.length ? (
            <div className="mt-3 flex flex-wrap gap-2 text-xs leading-4">
              {reply.actions.map(renderAction)}
            </div>
          ) : null}
          {reply?.details ? (
            <details
              open={detailsExpanded}
              className="mt-2.5 text-xs leading-5"
            >
              <summary
                onClick={(event) => {
                  event.preventDefault();
                  onToggleDetails();
                }}
                className="w-fit cursor-pointer rounded-sm text-emerald-950/60 transition-colors hover:text-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 motion-reduce:transition-none"
              >
                {detailsExpanded ? "Ocultar detalhes" : "Ver detalhes"}
              </summary>
              <p className="mt-2 whitespace-pre-line text-emerald-950/75">
                {reply.details}
              </p>
            </details>
          ) : null}
        </div>
        {isLatest && reply?.suggestions.length ? (
          <div className="mt-2.5 px-0.5 text-[11px] leading-4">
            <p className="mb-1.5 text-emerald-950/50">Quer saber mais?</p>
            <div className="flex flex-wrap gap-1.5">
              {reply.suggestions.map((topic) => (
                <button
                  key={topic.topicId}
                  type="button"
                  onClick={() => onChooseTopic(topic)}
                  className="min-h-8 max-w-full rounded-xl border border-emerald-950/8 bg-white/45 px-2.5 py-1.5 text-left text-emerald-950/65 transition-colors hover:border-emerald-700/25 hover:bg-white hover:text-emerald-900 focus-visible:outline-2 focus-visible:outline-emerald-700 motion-reduce:transition-none"
                >
                  {topic.question}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
