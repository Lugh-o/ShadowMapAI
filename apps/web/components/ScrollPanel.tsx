"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent, ReactNode, Ref } from "react";

interface ScrollPanelProps {
  children: ReactNode;
  className?: string;
  resetKey?: string | number | boolean;
  panelRef?: Ref<HTMLDivElement>;
}

const TRACK_INSET = 12;
const MIN_THUMB_HEIGHT = 32;

export default function ScrollPanel({
  children,
  className,
  resetKey,
  panelRef,
}: ScrollPanelProps) {
  const viewportId = useId();
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerY: number; scrollTop: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [metrics, setMetrics] = useState({
    scrollTop: 0,
    maxScroll: 0,
    thumbHeight: 0,
    thumbTravel: 0,
  });

  const updateMetrics = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const { clientHeight, scrollHeight, scrollTop } = viewport;
    const maxScroll = Math.max(0, scrollHeight - clientHeight);
    const trackHeight = Math.max(0, clientHeight - TRACK_INSET * 2);
    const thumbHeight = Math.min(
      trackHeight,
      Math.max(
        MIN_THUMB_HEIGHT,
        (trackHeight * clientHeight) / (scrollHeight || 1),
      ),
    );

    setMetrics({
      scrollTop: Math.max(0, Math.min(maxScroll, scrollTop)),
      maxScroll,
      thumbHeight,
      thumbTravel: Math.max(0, trackHeight - thumbHeight),
    });
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;

    const observer = new ResizeObserver(updateMetrics);
    observer.observe(viewport);
    observer.observe(content);

    return () => observer.disconnect();
  }, [updateMetrics]);

  useEffect(() => {
    if (viewportRef.current) viewportRef.current.scrollTop = 0;
  }, [resetKey]);

  const thumbTop = metrics.maxScroll
    ? (metrics.scrollTop / metrics.maxScroll) * metrics.thumbTravel
    : 0;

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    const viewport = viewportRef.current;
    if (!viewport || event.button !== 0 || !metrics.thumbTravel) return;

    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);

    const pointerY =
      event.clientY - event.currentTarget.getBoundingClientRect().top;
    if (pointerY < thumbTop || pointerY > thumbTop + metrics.thumbHeight) {
      viewport.scrollTop =
        (Math.max(
          0,
          Math.min(metrics.thumbTravel, pointerY - metrics.thumbHeight / 2),
        ) /
          metrics.thumbTravel) *
        metrics.maxScroll;
    }

    dragRef.current = {
      pointerY: event.clientY,
      scrollTop: viewport.scrollTop,
    };
    setDragging(true);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const viewport = viewportRef.current;
    const drag = dragRef.current;
    if (!viewport || !drag || !metrics.thumbTravel) return;

    viewport.scrollTop =
      drag.scrollTop +
      ((event.clientY - drag.pointerY) / metrics.thumbTravel) *
        metrics.maxScroll;
  }

  function stopDragging() {
    dragRef.current = null;
    setDragging(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const positions: Record<string, number> = {
      ArrowDown: viewport.scrollTop + 40,
      ArrowUp: viewport.scrollTop - 40,
      PageDown: viewport.scrollTop + viewport.clientHeight * 0.9,
      PageUp: viewport.scrollTop - viewport.clientHeight * 0.9,
      Home: 0,
      End: metrics.maxScroll,
    };

    if (!(event.key in positions)) return;
    event.preventDefault();
    viewport.scrollTop = positions[event.key];
  }

  return (
    <div
      ref={panelRef}
      className={`relative grid grid-cols-[minmax(0,1fr)_12px] grid-rows-[minmax(0,1fr)] ${className ?? ""}`}
    >
      <div
        id={viewportId}
        ref={viewportRef}
        role="region"
        aria-label="Painel de informações do mapa"
        tabIndex={0}
        onScroll={updateMetrics}
        className="panel-scroll-viewport h-full min-h-0 min-w-0 rounded-[inherit] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-emerald-700 lg:overscroll-contain"
      >
        <div ref={contentRef} className="min-w-0">
          {children}
        </div>
      </div>

      {metrics.maxScroll > 0 ? (
        <div
          role="scrollbar"
          aria-label="Rolagem do painel lateral"
          aria-controls={viewportId}
          aria-orientation="vertical"
          aria-valuemin={0}
          aria-valuemax={Math.ceil(metrics.maxScroll)}
          aria-valuenow={Math.round(metrics.scrollTop)}
          tabIndex={0}
          data-dragging={dragging}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
          onLostPointerCapture={stopDragging}
          onKeyDown={handleKeyDown}
          className="panel-scroll-track relative my-3 w-3 touch-none rounded-full focus-visible:outline-2 focus-visible:outline-emerald-700"
        >
          <div
            className="panel-scroll-thumb pointer-events-none absolute right-1 w-1.5 rounded-full"
            style={{
              height: metrics.thumbHeight,
              transform: `translateY(${thumbTop}px)`,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
