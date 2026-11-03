import { NextResponse } from "next/server";

import { getPilotRefs } from "@/lib/pilot-ref";

export async function GET() {
  return NextResponse.json({ pilotRefs: getPilotRefs() });
}
