import { NextResponse } from "next/server";

import { auth } from "@/auth";

export type AdminCheck =
  | { ok: true; email: string }
  | { ok: false; response: NextResponse };

export async function requireAdmin(): Promise<AdminCheck> {
  const session = await auth();

  if (!session?.user?.email) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 },
      ),
    };
  }

  const email = session.user.email.trim().toLowerCase();

  const allowedEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (!allowedEmails.length || !allowedEmails.includes(email)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Sem permissão." }, { status: 403 }),
    };
  }

  return { ok: true, email };
}
