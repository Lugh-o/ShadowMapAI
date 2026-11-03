"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LogIn, LogOut, User } from "lucide-react";

export default function Navbar() {
  const { data: session, status } = useSession();
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

        <div className="flex items-center gap-3">
          {status === "loading" && (
            <div className="h-8 w-8 animate-pulse rounded-full bg-emerald-100" />
          )}

          {status === "authenticated" && session?.user && (
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 sm:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt=""
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>
                <span className="text-sm font-medium text-emerald-950">
                  Bem-vindo, {session.user.name || session.user.email?.split("@")[0]}
                </span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-950/10 bg-white px-3 py-2 text-sm font-medium text-emerald-950 transition hover:bg-emerald-50"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          )}

          {status === "unauthenticated" && (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              <LogIn className="h-4 w-4" />
              Entrar
            </Link>
          )}
        </div>
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
