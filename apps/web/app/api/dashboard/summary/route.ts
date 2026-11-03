import { NextResponse } from "next/server";

import { getDashboardData, parseDashboardParams } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = parseDashboardParams({
    origin: searchParams.get("origin"),
    city: searchParams.get("city"),
    days: searchParams.get("days"),
  });

  const data = await getDashboardData(params);

  return NextResponse.json(data);
}
