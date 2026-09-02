import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { nativeSpecies } from "@shadowmap/species-data";
import type { SpeciesMatch, City } from "@shadowmap/types";

interface SpeciesRequest {
  city: City;
  soilType?: string;
  spaceAvailable?: "small" | "medium" | "large";
  priority?: "shade" | "drought" | "beauty" | "food";
}

function calculateSpeciesScore(
  species: (typeof nativeSpecies)[0],
  request: SpeciesRequest
): SpeciesMatch {
  let score = 0;
  const reasons: string[] = [];

  if (species.climate.includes(request.city)) {
    score += 30;
    reasons.push("Adaptada ao clima local");
  }

  if (request.soilType && species.soilType.includes(request.soilType)) {
    score += 20;
    reasons.push(`Tolerante a solo ${request.soilType}`);
  }

  if (request.spaceAvailable) {
    const sizeMatch = {
      small: species.treeSize === "small",
      medium: ["small", "medium"].includes(species.treeSize),
      large: true,
    };
    if (sizeMatch[request.spaceAvailable]) {
      score += 15;
      reasons.push(`Tamanho adequado (${species.treeSize})`);
    }
  }

  if (request.priority === "shade" && species.shadeProduction === "high") {
    score += 25;
    reasons.push("Alta produção de sombra");
  } else if (request.priority === "drought" && species.droughtTolerance === "high") {
    score += 25;
    reasons.push("Alta tolerância à seca");
  } else if (request.priority === "beauty") {
    score += 10;
    reasons.push("Valor estético");
  } else if (request.priority === "food") {
    score += 10;
    reasons.push("Produz frutos comestíveis");
  }

  if (species.shadeProduction === "high") {
    score += 5;
  }
  if (species.droughtTolerance === "high") {
    score += 5;
  }

  return {
    species,
    score: Math.min(100, score),
    reasons,
  };
}

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") as City | null;
  const soilType = searchParams.get("soilType") || undefined;
  const spaceAvailable = searchParams.get("spaceAvailable") as "small" | "medium" | "large" | null;
  const priority = searchParams.get("priority") as "shade" | "drought" | "beauty" | "food" | null;

  if (!city) {
    return NextResponse.json({ error: "City parameter required" }, { status: 400 });
  }

  const speciesRequest: SpeciesRequest = {
    city,
    soilType,
    spaceAvailable: spaceAvailable || undefined,
    priority: priority || undefined,
  };

  const matches = nativeSpecies
    .map((species) => calculateSpeciesScore(species, speciesRequest))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return NextResponse.json(matches);
}
