"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef } from "react";
import type { ReactNode, RefObject } from "react";

import ScrollPanel from "@/components/ScrollPanel";
import { cn } from "@/lib/utils";

interface MapInfoPanelProps {
  children: ReactNode;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  focusRequest: number;
  isFormOpen: boolean;
  panelTitle?: string;
  contentKey?: string;
  onEscape?: () => void;
  mapRef: RefObject<HTMLElement | null>;
  workspaceRef: RefObject<HTMLDivElement | null>;
}

export default function MapInfoPanel({
  children,
  expanded,
  onExpandedChange,
  focusRequest,
  isFormOpen,
  panelTitle,
  contentKey,
  onEscape,
  mapRef,
  workspaceRef,
}: MapInfoPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const bodyId = useId();

  useLayoutEffect(() => {
    let frame = 0;
    const panel = panelRef.current;
    const viewport = window.visualViewport;
    function updatePosition() {
      const panel = panelRef.current;
      const map = mapRef.current;
      if (!panel || !map) return;
      const root = document.documentElement;
      if (window.matchMedia("(min-width: 64rem)").matches) {
        root.style.removeProperty("--map-chat-offset");
        map.style.removeProperty("--map-overlay-bottom");
        map.style.removeProperty("--map-legend-max-height");
        return;
      }
      const rect = map.getBoundingClientRect();
      const visibleHeight = viewport?.height ?? window.innerHeight;
      const viewportTop = viewport?.offsetTop ?? 0;
      const navBottom =
        document.querySelector("nav")?.getBoundingClientRect().bottom ?? 0;
      const fullForm = expanded && isFormOpen &&
        (visibleHeight < 500 || window.innerHeight - visibleHeight > 120);
      const upper = fullForm
        ? Math.max(navBottom + 8, viewportTop + 8)
        : Math.max(rect.top + 8, navBottom + 8, viewportTop + 8);
      const lower = fullForm
        ? viewportTop + visibleHeight - 10
        : Math.min(rect.bottom - 10, viewportTop + visibleHeight - 10);
      const available = Math.max(0, lower - upper);
      const visible = available >= 90;
      const height = fullForm
        ? available
        : expanded
          ? Math.max(50, Math.min(520, visibleHeight * 0.62, available - 56))
          : 50;
      panel.style.setProperty("--map-panel-left", `${fullForm ? 8 : rect.left + 8}px`);
      panel.style.setProperty(
        "--map-panel-right",
        `${fullForm ? 8 : Math.max(8, root.clientWidth - rect.right + 8)}px`,
      );
      panel.style.setProperty(
        "--map-panel-bottom",
        `${Math.max(10, window.innerHeight - lower)}px`,
      );
      panel.style.setProperty("--map-panel-height", `${height}px`);
      panel.style.setProperty(
        "--map-panel-visibility",
        visible ? "visible" : "hidden",
      );
      root.style.setProperty(
        "--map-chat-offset",
        visible
          ? `${Math.max(0, window.innerHeight - lower - 16) + height + 12}px`
          : "0px",
      );
      map.style.setProperty(
        "--map-overlay-bottom",
        visible
          ? `${Math.max(12, rect.bottom - lower + height + 8)}px`
          : "12px",
      );
      map.style.setProperty(
        "--map-legend-max-height",
        `${Math.max(44, available - height - 24)}px`,
      );
      // Keep the active field inside the scrollable body as the keyboard resizes
      // or pans the visual viewport, without scrolling the document itself.
      const active = document.activeElement;
      const body = panel.querySelector<HTMLElement>(".panel-scroll-viewport");
      if (
        fullForm && body && active instanceof HTMLElement && body.contains(active)
      ) {
        const fieldRect = active.getBoundingClientRect();
        const bodyRect = body.getBoundingClientRect();
        if (fieldRect.bottom > bodyRect.bottom - 8)
          body.scrollTop += fieldRect.bottom - bodyRect.bottom + 8;
        else if (fieldRect.top < bodyRect.top + 8)
          body.scrollTop += fieldRect.top - bodyRect.top - 8;
      }
    }
    function scheduleUpdate() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updatePosition);
    }
    updatePosition();
    const observer = new ResizeObserver(scheduleUpdate);
    if (mapRef.current) observer.observe(mapRef.current);
    const header =
      workspaceRef.current?.parentElement?.querySelector(":scope > header");
    const navigation = document.querySelector("nav");
    if (header) observer.observe(header);
    if (navigation) observer.observe(navigation);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    panel?.addEventListener("focusin", scheduleUpdate);
    viewport?.addEventListener("resize", scheduleUpdate);
    viewport?.addEventListener("scroll", scheduleUpdate);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      panel?.removeEventListener("focusin", scheduleUpdate);
      viewport?.removeEventListener("resize", scheduleUpdate);
      viewport?.removeEventListener("scroll", scheduleUpdate);
      document.documentElement.style.removeProperty("--map-chat-offset");
    };
  }, [expanded, isFormOpen, mapRef, workspaceRef]);

  useEffect(() => {
    if (!expanded || window.matchMedia("(min-width: 64rem)").matches) return;
    const frame = requestAnimationFrame(() => {
      const workspace = workspaceRef.current;
      const navHeight =
        document.querySelector("nav")?.getBoundingClientRect().height ?? 0;
      if (workspace)
        window.scrollTo({
          top: Math.max(
            0,
            window.scrollY +
              workspace.getBoundingClientRect().top -
              navHeight -
              8,
          ),
        });
      toggleRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [expanded, focusRequest, workspaceRef]);

  return (
    <div
      ref={panelRef}
      className="map-info-panel flex min-w-0 flex-col lg:col-start-2 lg:row-start-2 lg:h-[calc(90vh-4.5rem)] lg:min-h-60 lg:rounded-[22px]"
      data-expanded={expanded}
      onKeyDown={(event) => {
        if (
          event.key === "Escape" &&
          onEscape &&
          !document.querySelector("dialog[open], [popover]:popover-open")
        ) {
          event.preventDefault();
          event.stopPropagation();
          onEscape();
          return;
        }
        if (
          event.key === "Escape" &&
          !window.matchMedia("(min-width: 64rem)").matches
        ) {
          event.preventDefault();
          event.stopPropagation();
          onExpandedChange(false);
          toggleRef.current?.focus({ preventScroll: true });
        }
      }}
    >
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={expanded}
        aria-controls={bodyId}
        aria-label={
          expanded
            ? "Recolher painel de informações"
            : "Expandir painel de informações"
        }
        onClick={() => onExpandedChange(!expanded)}
        className="flex h-12 w-full shrink-0 items-center justify-between gap-2 px-3 text-left text-emerald-950 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-emerald-700 lg:hidden"
      >
        <span className="text-sm font-semibold">
          {panelTitle ??
            (isFormOpen ? "Novo ponto simulado" : "Detalhes e pontos")}
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-emerald-950/60">
          {expanded ? "Recolher" : "Abrir"}
          {expanded ? (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          )}
        </span>
      </button>
      <div
        id={bodyId}
        className={cn("min-h-0 flex-1", !expanded && "hidden lg:block")}
      >
        <ScrollPanel
          resetKey={contentKey ?? isFormOpen}
          className="h-full min-w-0 rounded-[inherit]"
        >
          {children}
        </ScrollPanel>
      </div>
    </div>
  );
}
