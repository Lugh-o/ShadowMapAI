"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FlaskConical } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-[800] border-b border-emerald-950/10 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-3 sm:gap-5">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-emerald-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-50">
              ShadowMap
            </span>
          </Link>

          <div className="flex items-center gap-1">
            <NavLink href="/" active={pathname === "/"}>
              Mapa
            </NavLink>
            <NavLink href="/dashboard" active={pathname === "/dashboard"}>
              Painel
            </NavLink>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-900">
          <FlaskConical className="h-3.5 w-3.5" />
          Demo · dados simulados
        </span>
      </div>
    </nav>
  );
}

function NavLink({
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
      className={`inline-flex min-h-9 items-center rounded-full px-3 text-sm font-medium transition ${
        active
          ? "bg-emerald-100 text-emerald-950"
          : "text-emerald-950/70 hover:bg-emerald-50 hover:text-emerald-950"
      }`}
    >
      {children}
    </Link>
  );
}
