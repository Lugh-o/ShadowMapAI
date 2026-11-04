import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Configuração compartilhada entre o Auth.js completo (`auth.ts`) e o proxy.
 * Não importa Prisma nem bcrypt para continuar leve no middleware.
 */
export default {
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;
