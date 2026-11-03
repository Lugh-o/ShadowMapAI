import { prisma } from "@/lib/db";

const USER_DAILY_LIMIT = Number.parseInt(
  process.env.ASSISTANT_USER_DAILY_LIMIT || "30",
  10,
);
const GLOBAL_DAILY_LIMIT = Number.parseInt(
  process.env.ASSISTANT_DAILY_LIMIT || "300",
  10,
);

export type QuotaResult =
  | { ok: true; userRemaining: number }
  | {
      ok: false;
      reason: "USER_LIMIT" | "GLOBAL_LIMIT" | "UNAVAILABLE";
    };

function todayUtc(): Date {
  return new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
}

export async function consumeAssistantQuota(
  userId: string,
): Promise<QuotaResult> {
  const date = todayUtc();

  try {
    return await prisma.$transaction(async (tx) => {
      const userUsage = await tx.assistantUserUsage.upsert({
        where: { userId_date: { userId, date } },
        update: {},
        create: { userId, date, count: 0 },
      });

      if (userUsage.count >= USER_DAILY_LIMIT) {
        return { ok: false as const, reason: "USER_LIMIT" as const };
      }

      const globalUsage = await tx.geminiDailyUsage.upsert({
        where: { date },
        update: {},
        create: { date, count: 0 },
      });

      if (globalUsage.count >= GLOBAL_DAILY_LIMIT) {
        return { ok: false as const, reason: "GLOBAL_LIMIT" as const };
      }

      const updatedUser = await tx.assistantUserUsage.update({
        where: { id: userUsage.id },
        data: { count: { increment: 1 } },
      });

      await tx.geminiDailyUsage.update({
        where: { id: globalUsage.id },
        data: { count: { increment: 1 } },
      });

      return {
        ok: true as const,
        userRemaining: Math.max(0, USER_DAILY_LIMIT - updatedUser.count),
      };
    });
  } catch (error) {
    // Falha fechada: sem cota confirmada, a requisição não é liberada.
    console.error(
      "Falha ao consumir cota do assistente:",
      error instanceof Error ? error.name : "erro desconhecido",
    );

    return { ok: false, reason: "UNAVAILABLE" };
  }
}
