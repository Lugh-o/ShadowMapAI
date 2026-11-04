import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import authConfig from "@/auth.config";
import { prisma } from "@/lib/db";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILURES = 10;

// Melhor esforço: o Map vive na memória de cada instância. Em serverless não
// há garantia de contador compartilhado, mas ainda protege a instância local.
const loginFailures = new Map<string, { count: number; resetAt: number }>();

function isLoginBlocked(email: string): boolean {
  const entry = loginFailures.get(email);

  if (!entry) return false;

  if (Date.now() > entry.resetAt) {
    loginFailures.delete(email);
    return false;
  }

  return entry.count >= LOGIN_MAX_FAILURES;
}

function registerLoginFailure(email: string): void {
  const now = Date.now();
  const entry = loginFailures.get(email);

  if (!entry || now > entry.resetAt) {
    loginFailures.set(email, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return;
  }

  entry.count += 1;
}

function clearLoginFailures(email: string): void {
  loginFailures.delete(email);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    ...authConfig.providers,
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials?.password === "string"
            ? credentials.password
            : "";

        if (!email || !password) return null;
        if (isLoginBlocked(email)) return null;

        try {
          const user = await prisma.user.findUnique({ where: { email } });

          if (!user?.password) {
            registerLoginFailure(email);
            return null;
          }

          const passwordMatches = await bcrypt.compare(password, user.password);

          if (!passwordMatches) {
            registerLoginFailure(email);
            return null;
          }

          clearLoginFailures(email);

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          };
        } catch (error) {
          console.error(
            "Falha ao verificar credenciais:",
            error instanceof Error ? error.name : "erro desconhecido",
          );
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
