import { NextResponse } from "next/server";

import pointsData from "@/data/points.json";
import { derivePriority } from "@/lib/utils";
import { pointSubmissionSchema } from "@/lib/validation";
import type { PointFeature } from "@shadowmap/types";

const simulatedPoints: PointFeature[] = (pointsData as PointFeature[]).map(
  (point) => ({
    ...point,
    dataOrigin: "simulated",
    moderationStatus: "approved",
  }),
);

export async function GET() {
  return NextResponse.json(simulatedPoints);
}

/**
 * Cadastro de demonstração: valida o payload e devolve o ponto criado, mas
 * não grava nada. A interface adiciona o retorno apenas ao estado local.
 */
export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = pointSubmissionSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Dados inválidos.",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const point: PointFeature = {
    id: `sim-${crypto.randomUUID()}`,
    city: data.city,
    neighborhood: data.neighborhood.trim(),
    lat: data.lat,
    lng: data.lng,
    heatLevel: data.heatLevel,
    shadeLevel: data.shadeLevel,
    issueType: data.issueType,
    description: data.description.trim(),
    priority: data.priority ?? derivePriority(data.heatLevel, data.shadeLevel),
    moderationStatus: "approved",
    dataOrigin: "simulated",
    aiAssisted: data.aiAssisted ?? false,
    submittedAt: new Date().toISOString(),
  };

  return NextResponse.json(point, { status: 201 });
}
