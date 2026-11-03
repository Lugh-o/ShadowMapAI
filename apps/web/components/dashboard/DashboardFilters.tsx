import Link from "next/link";

import { CITY_OPTIONS } from "@/lib/utils";
import type {
  DashboardOrigin,
  DashboardParams,
  DashboardPeriod,
} from "@/lib/dashboard";
import type { City } from "@shadowmap/types";

interface DashboardFiltersProps {
  filters: DashboardParams;
}

const originOptions: Array<{ value: DashboardOrigin; label: string }> = [
  { value: "collected", label: "Coletados" },
  { value: "all", label: "Coletados + simulados" },
];

const periodOptions: Array<{ value: DashboardPeriod; label: string }> = [
  { value: 7, label: "7 dias" },
  { value: 30, label: "30 dias" },
  { value: "all", label: "Tudo" },
];

export default function DashboardFilters({ filters }: DashboardFiltersProps) {
  function href(updates: Partial<DashboardParams>): string {
    const next = { ...filters, ...updates };
    const params = new URLSearchParams();

    if (next.origin !== "collected") params.set("origin", next.origin);
    if (next.city !== "all") params.set("city", next.city);
    if (next.days !== "all") params.set("days", String(next.days));

    const query = params.toString();

    return query ? `/dashboard?${query}` : "/dashboard";
  }

  return (
    <section className="glass-panel rounded-[28px] p-4 md:p-5">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_0.8fr]">
        <FilterGroup label="Origem dos dados">
          {originOptions.map((option) => (
            <FilterLink
              key={option.value}
              href={href({ origin: option.value })}
              active={filters.origin === option.value}
            >
              {option.label}
            </FilterLink>
          ))}
        </FilterGroup>

        <FilterGroup label="Cidade">
          <FilterLink
            href={href({ city: "all" })}
            active={filters.city === "all"}
          >
            Todas
          </FilterLink>
          {CITY_OPTIONS.map((city: City) => (
            <FilterLink
              key={city}
              href={href({ city })}
              active={filters.city === city}
            >
              {city}
            </FilterLink>
          ))}
        </FilterGroup>

        <FilterGroup label="Período">
          {periodOptions.map((option) => (
            <FilterLink
              key={String(option.value)}
              href={href({ days: option.value })}
              active={filters.days === option.value}
            >
              {option.label}
            </FilterLink>
          ))}
        </FilterGroup>
      </div>
    </section>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-950/55">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex min-h-9 items-center rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "bg-emerald-900 text-white"
          : "border border-emerald-950/10 bg-white/80 text-emerald-950 hover:bg-white"
      }`}
    >
      {children}
    </Link>
  );
}
