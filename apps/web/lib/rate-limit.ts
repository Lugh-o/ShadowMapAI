import type { RateLimitEntry } from "@shadowmap/types";
import { prisma } from "@/lib/db";

const rateLimitMap = new Map<string, RateLimitEntry>();

const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "30", 10);
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10);

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: MAX_REQUESTS - entry.count };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "unknown";
}

const DAILY_LIMIT = parseInt(process.env.ASSISTANT_DAILY_LIMIT || "1500", 10);

export async function consumeGlobalDailyQuota(): Promise<{ allowed: boolean; remaining: number }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Upsert the row for today
      const upserted = await tx.geminiDailyUsage.upsert({
        where: { date: today },
        update: {},
        create: { date: today, count: 0 },
      });

      // Check if we're at or above the limit
      if (upserted.count >= DAILY_LIMIT) {
        return { allowed: false, remaining: 0 };
      }

      // Increment the count
      const updated = await tx.geminiDailyUsage.update({
        where: { id: upserted.id },
        data: { count: upserted.count + 1 },
      });

      return { allowed: true, remaining: DAILY_LIMIT - updated.count };
    });

    return result;
  } catch (error) {
    console.error("Failed to consume global daily quota:", error);
    // On error, allow the request but log the issue
    return { allowed: true, remaining: DAILY_LIMIT };
  }
}
