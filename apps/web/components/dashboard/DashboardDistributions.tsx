"use client";

import { useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

import DistributionBars from "@/components/dashboard/DistributionBars";
import type { DashboardData } from "@/lib/dashboard";
import { cn, getHeatZoneColor, HEAT_LEVEL_OPTIONS } from "@/lib/utils";

const tabs = [
  { id: "issueType", label: "Ocorrências", title: "Por tipo de ocorrência" },
  { id: "heatLevel", label: "Calor", title: "Por nível de calor" },
  { id: "shadeLevel", label: "Sombra", title: "Por nível de sombra" },
] as const;
type DistributionKey = (typeof tabs)[number]["id"];

const heatColors = Object.fromEntries(
  HEAT_LEVEL_OPTIONS.map((level) => [level, getHeatZoneColor(level)]),
);

export default function DashboardDistributions({
  distributions,
}: {
  distributions: DashboardData["distributions"];
}) {
  const [activeTab, setActiveTab] = useState<DistributionKey>("issueType");
  const id = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let nextIndex: number;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft")
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabs.length - 1;
    else return;
    event.preventDefault();
    setActiveTab(tabs[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <section aria-label="Distribuição dos pontos" className="min-w-0">
      <div className="lg:hidden">
        <div
          role="tablist"
          aria-label="Distribuições"
          className="mb-2 grid grid-cols-3 gap-1 rounded-2xl border border-emerald-950/10 bg-white/65 p-1 text-xs"
        >
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              type="button"
              role="tab"
              id={`${id}-tab-${tab.id}`}
              aria-controls={`${id}-panel-${tab.id}`}
              aria-selected={activeTab === tab.id}
              tabIndex={activeTab === tab.id ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                "min-h-9 rounded-xl px-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 motion-reduce:transition-none",
                activeTab === tab.id
                  ? "bg-emerald-900 text-white shadow-sm"
                  : "text-emerald-950/65 hover:bg-emerald-50",
              )}
            >
              <span className="font-semibold">{tab.label}</span>
            </button>
          ))}
        </div>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            id={`${id}-panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`${id}-tab-${tab.id}`}
            tabIndex={0}
            hidden={activeTab !== tab.id}
            className="rounded-3xl focus-visible:outline-2 focus-visible:outline-emerald-700"
          >
            <DistributionBars
              title={tab.title}
              items={distributions[tab.id]}
              colors={tab.id === "heatLevel" ? heatColors : undefined}
            />
          </div>
        ))}
      </div>
      <div className="hidden gap-4 lg:grid lg:grid-cols-3">
        {tabs.map((tab) => (
          <DistributionBars
            key={tab.id}
            title={tab.title}
            items={distributions[tab.id]}
            colors={tab.id === "heatLevel" ? heatColors : undefined}
          />
        ))}
      </div>
    </section>
  );
}
