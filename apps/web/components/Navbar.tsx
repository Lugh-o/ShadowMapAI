"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import {
  ChartNoAxesCombined,
  FlaskConical,
  Map as MapIcon,
  MapPinned,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export default function Navbar() {
  const activeSegment = useSelectedLayoutSegment();

  return (
    <nav
      aria-label="Navegação principal"
      className="sticky top-0 z-800 border-b border-emerald-950/10 bg-white/90 shadow-[0_2px_12px_rgba(6,78,59,0.04)] backdrop-blur-md"
    >
      <a
        href="#conteudo-principal"
        className="absolute left-3 top-2 z-10 -translate-y-24 rounded-xl bg-emerald-950 px-4 py-3 text-sm font-semibold text-white focus:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
      >
        Ir para o conteúdo
      </a>
      <div className="mx-auto grid h-14 max-w-360 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1 px-3 sm:h-15 sm:gap-4 sm:px-5 lg:px-6">
        <Link
          href="/"
          aria-label="ShadowMap — página inicial"
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl text-emerald-950 transition-colors hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 motion-reduce:transition-none"
        >
          <span className="hidden h-8 w-8 items-center justify-center rounded-xl bg-emerald-900 text-white sm:inline-flex">
            <MapPinned className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <span className="font-display text-[13px] font-semibold tracking-tight sm:text-base">
            ShadowMap
          </span>
        </Link>

        <div className="inline-flex min-w-0 items-center gap-0.5 justify-self-center rounded-2xl border border-emerald-950/8 bg-emerald-950/4 p-0.5">
          <NavLink href="/" active={activeSegment === null} icon={MapIcon}>
            Mapa
          </NavLink>
          <NavLink
            href="/dashboard"
            active={activeSegment === "dashboard"}
            icon={ChartNoAxesCombined}
          >
            Painel
          </NavLink>
        </div>

        <Link
          href="/privacidade"
          aria-label="Sobre a demonstração"
          aria-current={activeSegment === "privacidade" ? "page" : undefined}
          title="Sobre a demonstração e os dados simulados"
          className={cn(
            "inline-flex min-h-11 shrink-0 items-center justify-center gap-1 rounded-xl border px-1.5 text-[10px] font-semibold text-amber-950 transition-colors hover:border-amber-400 hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 motion-reduce:transition-none sm:gap-1.5 sm:px-3 sm:text-xs",
            activeSegment === "privacidade"
              ? "border-amber-400 bg-amber-100"
              : "border-amber-200/70 bg-amber-50/70",
          )}
        >
          <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
          <span>
            Demo<span className="hidden md:inline"> · dados simulados</span>
          </span>
        </Link>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  active,
  icon: Icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl px-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 motion-reduce:transition-none sm:px-3.5",
        active
          ? "bg-emerald-900 text-white shadow-sm"
          : "text-emerald-950/65 hover:bg-white hover:text-emerald-950",
      )}
    >
      <Icon className="hidden h-4 w-4 sm:block" aria-hidden="true" />
      {children}
    </Link>
  );
}
