"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

import type { DailyRow, DashboardPeriod } from "@/lib/dashboard";
import { formatDayKey as formatDay } from "@/lib/dates";
import { cn } from "@/lib/utils";

interface DailyChartProps {
  data: DailyRow[];
  period: DashboardPeriod;
}

export default function DailyChart({ data, period }: DailyChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [tabIndex, setTabIndex] = useState(0);
  const plotRef = useRef<HTMLDivElement>(null);
  const barRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const id = useId();
  const max = Math.max(...data.map((item) => item.count), 1);
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const ticks = [...new Set([max, Math.floor(max / 2), 0])];
  const dateLabels = [
    ...new Set([0, Math.floor((data.length - 1) / 2), data.length - 1]),
  ].filter((index) => index >= 0);
  const periodLabel =
    period === "all" ? "Todo o período" : `Últimos ${period} dias`;
  const activeIndex = hoveredIndex ?? focusedIndex ?? selectedIndex;
  const activePoint = activeIndex === null ? undefined : data[activeIndex];

  useEffect(() => {
    if (selectedIndex === null) return;
    function dismissOnOutsideClick(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !plotRef.current?.contains(event.target)
      ) {
        setSelectedIndex(null);
        setFocusedIndex(null);
        setHoveredIndex(null);
      }
    }
    document.addEventListener("pointerdown", dismissOnOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", dismissOnOutsideClick);
  }, [selectedIndex]);

  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    if (event.key === "Escape") {
      event.preventDefault();
      setHoveredIndex(null);
      setFocusedIndex(null);
      setSelectedIndex(null);
      return;
    }
    let nextIndex: number;
    if (event.key === "ArrowRight")
      nextIndex = Math.min(data.length - 1, index + 1);
    else if (event.key === "ArrowLeft") nextIndex = Math.max(0, index - 1);
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = data.length - 1;
    else return;
    event.preventDefault();
    setHoveredIndex(null);
    setTabIndex(nextIndex);
    setFocusedIndex(nextIndex);
    barRefs.current[nextIndex]?.focus({ preventScroll: true });
  }

  return (
    <section
      aria-labelledby={`${id}-title`}
      className="card-strong min-w-0 rounded-3xl p-4"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-1.5">
        <h2
          id={`${id}-title`}
          className="font-display text-base font-semibold text-emerald-950"
        >
          Pontos por dia
        </h2>
        <p className="text-xs text-emerald-950/55">{periodLabel}</p>
      </header>

      {total === 0 ? (
        <p className="mt-3 text-sm text-emerald-950/60">
          Sem pontos no período selecionado.
        </p>
      ) : (
        <>
          <p className="mt-2 text-[11px] text-emerald-950/55">
            Quantidade de pontos
          </p>
          <div className="mt-3 flex gap-2">
            <div
              aria-hidden="true"
              className="relative h-40 w-5 shrink-0 text-[10px] leading-3 text-emerald-950/50"
            >
              {ticks.map((tick) => (
                <span
                  key={tick}
                  className="absolute right-0 -translate-y-1/2"
                  style={{ top: `${100 - (tick / max) * 100}%` }}
                >
                  {tick}
                </span>
              ))}
            </div>
            <div
              ref={plotRef}
              role="group"
              aria-label={`Gráfico de pontos por dia · ${periodLabel.toLowerCase()}`}
              aria-describedby={`${id}-instructions`}
              className="relative h-40 min-w-0 flex-1"
            >
              <div
                className="pointer-events-none absolute inset-0"
                aria-hidden="true"
              >
                {ticks.map((tick) => (
                  <div
                    key={tick}
                    className="absolute inset-x-0 border-t border-emerald-950/10"
                    style={{ top: `${100 - (tick / max) * 100}%` }}
                  />
                ))}
              </div>
              <div className="relative flex h-full items-end gap-1">
                {data.map((item, index) => (
                  <button
                    key={item.date}
                    ref={(element) => {
                      barRefs.current[index] = element;
                    }}
                    type="button"
                    tabIndex={tabIndex === index ? 0 : -1}
                    aria-label={`${formatDay(item.date, true)}: ${item.count} ${item.count === 1 ? "ponto" : "pontos"}`}
                    aria-describedby={
                      activeIndex === index ? `${id}-tooltip` : undefined
                    }
                    aria-pressed={selectedIndex === index}
                    onPointerEnter={(event) => {
                      if (event.pointerType === "mouse") setHoveredIndex(index);
                    }}
                    onPointerLeave={(event) => {
                      if (event.pointerType === "mouse") setHoveredIndex(null);
                    }}
                    onFocus={() => {
                      setHoveredIndex(null);
                      setFocusedIndex(index);
                      setTabIndex(index);
                    }}
                    onBlur={() => setFocusedIndex(null)}
                    onClick={() => {
                      setSelectedIndex((current) =>
                        current === index ? null : index,
                      );
                      setFocusedIndex(null);
                      setTabIndex(index);
                    }}
                    onKeyDown={(event) => handleKeyDown(event, index)}
                    className="flex h-full min-w-0 flex-1 items-end justify-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "w-full rounded-t transition-colors motion-reduce:transition-none",
                        activeIndex === index
                          ? "bg-emerald-900"
                          : "bg-emerald-700/80",
                      )}
                      style={{
                        height: `${(item.count / max) * 100}%`,
                      }}
                    />
                  </button>
                ))}
              </div>
              {activePoint && activeIndex !== null ? (
                <div
                  id={`${id}-tooltip`}
                  role="tooltip"
                  className="pointer-events-none absolute top-2 z-10 w-32 rounded-xl bg-emerald-950 px-2.5 py-2 text-xs leading-4 text-white shadow-md"
                  style={{
                    left: `clamp(0px, calc(${((activeIndex + 0.5) / data.length) * 100}% - 4rem), calc(100% - 8rem))`,
                  }}
                >
                  <p className="text-[10px] text-white/70">
                    {formatDay(activePoint.date, true)}
                  </p>
                  <p className="font-semibold">
                    {activePoint.count}{" "}
                    {activePoint.count === 1 ? "ponto" : "pontos"}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
          <div
            aria-hidden="true"
            className={cn(
              "mt-2 ml-7 flex text-[10px] text-emerald-950/55",
              dateLabels.length === 1 ? "justify-center" : "justify-between",
            )}
          >
            {dateLabels.map((index) => (
              <span key={data[index].date}>{formatDay(data[index].date)}</span>
            ))}
          </div>
          <p className="mt-2 text-[10px] leading-4 text-emerald-950/50">
            Toque ou passe o mouse em um dia para consultar os valores.
          </p>
          <p id={`${id}-instructions`} className="sr-only">
            Use as setas para consultar os dias, Enter para fixar um valor e
            Escape para fechar a informação.
          </p>
        </>
      )}
    </section>
  );
}
