import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import authConfig from "@/auth.config";

// Instância leve para o proxy: valida o JWT sem carregar Prisma/bcrypt.
const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = new Set([
  "/",
  "/dashboard",
  "/privacidade",
  "/login",
  "/register",
]);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Leitura pública do mapa, dashboard e privacidade; autenticação em si.
  if (PUBLIC_PATHS.has(pathname) || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Qualquer outra rota exige sessão (inclusive /admin).
  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
