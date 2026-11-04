import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const pointsData = [
  {
    city: "Salvador",
    neighborhood: "Brotas",
    lat: -12.9527,
    lng: -38.4914,
    heatLevel: "high",
    shadeLevel: "low",
    issueType: "low_tree_cover",
    description: "Baixa cobertura arbórea em via residencial movimentada.",
    priority: "high",
    dataOrigin: "simulated",
    moderationStatus: "approved",
  },
  {
    city: "Salvador",
    neighborhood: "Itapuã",
    lat: -12.9381,
    lng: -38.3603,
    heatLevel: "extreme",
    shadeLevel: "none",
    issueType: "exposed_transit_stop",
    description: "Ponto de ônibus sem qualquer cobertura ou sombra.",
    priority: "critical",
    dataOrigin: "simulated",
    moderationStatus: "approved",
  },
  {
    city: "Salvador",
    neighborhood: "Cajazeiras",
    lat: -12.9056,
    lng: -38.4611,
    heatLevel: "extreme",
    shadeLevel: "none",
    issueType: "school_route",
    description: "Rota escolar com exposição total ao sol.",
    priority: "critical",
    dataOrigin: "simulated",
    moderationStatus: "approved",
  },
  {
    city: "Camaçari",
    neighborhood: "Centro",
    lat: -12.6958,
    lng: -38.3239,
    heatLevel: "high",
    shadeLevel: "low",
    issueType: "heat_island",
    description: "Ilha de calor no centro comercial.",
    priority: "high",
    dataOrigin: "simulated",
    moderationStatus: "approved",
  },
  {
    city: "Camaçari",
    neighborhood: "Abrantes",
    lat: -12.6812,
    lng: -38.3056,
    heatLevel: "medium",
    shadeLevel: "moderate",
    issueType: "paved_open_area",
    description: "Área pavimentada aberta sem vegetação.",
    priority: "medium",
    dataOrigin: "simulated",
    moderationStatus: "approved",
  },
  {
    city: "Lauro de Freitas",
    neighborhood: "Itinga",
    lat: -12.8722,
    lng: -38.3347,
    heatLevel: "high",
    shadeLevel: "low",
    issueType: "low_tree_cover",
    description: "Vila residencial com poucas árvores.",
    priority: "high",
    dataOrigin: "simulated",
    moderationStatus: "approved",
  },
  {
    city: "Lauro de Freitas",
    neighborhood: "Centro",
    lat: -12.8656,
    lng: -38.3281,
    heatLevel: "medium",
    shadeLevel: "moderate",
    issueType: "exposed_transit_stop",
    description: "Terminal de ônibus sem cobertura.",
    priority: "medium",
    dataOrigin: "simulated",
    moderationStatus: "approved",
  },
  {
    city: "Simões Filho",
    neighborhood: "CIA I",
    lat: -12.7833,
    lng: -38.4003,
    heatLevel: "extreme",
    shadeLevel: "none",
    issueType: "paved_open_area",
    description: "Área industrial com solo exposto e sem vegetação.",
    priority: "critical",
    dataOrigin: "simulated",
    moderationStatus: "approved",
  },
  {
    city: "Simões Filho",
    neighborhood: "Centro",
    lat: -12.7781,
    lng: -38.4017,
    heatLevel: "high",
    shadeLevel: "low",
    issueType: "school_route",
    description: "Caminho da escola municipal sem sombreamento.",
    priority: "high",
    dataOrigin: "simulated",
    moderationStatus: "approved",
  },
];

const heatZonesData = [
  {
    city: "Salvador",
    name: "Miolo de Brotas",
    coordinates: JSON.stringify([
      [-12.948, -38.495],
      [-12.948, -38.485],
      [-12.958, -38.485],
      [-12.958, -38.495],
    ]),
    intensity: "high",
  },
  {
    city: "Salvador",
    name: "Corredor Cajazeiras",
    coordinates: JSON.stringify([
      [-12.9, -38.465],
      [-12.9, -38.455],
      [-12.912, -38.455],
      [-12.912, -38.465],
    ]),
    intensity: "extreme",
  },
  {
    city: "Camaçari",
    name: "Eixo Central de Camaçari",
    coordinates: JSON.stringify([
      [-12.692, -38.328],
      [-12.692, -38.318],
      [-12.702, -38.318],
      [-12.702, -38.328],
    ]),
    intensity: "high",
  },
  {
    city: "Camaçari",
    name: "Abrantes Expandido",
    coordinates: JSON.stringify([
      [-12.678, -38.31],
      [-12.678, -38.3],
      [-12.688, -38.3],
      [-12.688, -38.31],
    ]),
    intensity: "medium",
  },
  {
    city: "Lauro de Freitas",
    name: "Anel de Itinga",
    coordinates: JSON.stringify([
      [-12.868, -38.339],
      [-12.868, -38.329],
      [-12.878, -38.329],
      [-12.878, -38.339],
    ]),
    intensity: "high",
  },
  {
    city: "Lauro de Freitas",
    name: "Centro e Terminal",
    coordinates: JSON.stringify([
      [-12.861, -38.333],
      [-12.861, -38.323],
      [-12.871, -38.323],
      [-12.871, -38.333],
    ]),
    intensity: "medium",
  },
  {
    city: "Simões Filho",
    name: "CIA Industrial",
    coordinates: JSON.stringify([
      [-12.78, -38.405],
      [-12.78, -38.395],
      [-12.79, -38.395],
      [-12.79, -38.405],
    ]),
    intensity: "extreme",
  },
  {
    city: "Simões Filho",
    name: "Centro Consolidado",
    coordinates: JSON.stringify([
      [-12.774, -38.406],
      [-12.774, -38.396],
      [-12.784, -38.396],
      [-12.784, -38.406],
    ]),
    intensity: "medium",
  },
];

const nativeSpeciesData = [
  {
    commonName: "Ipê-amarelo",
    scientificName: "Handroanthus albus",
    family: "Bignoniaceae",
    climate: JSON.stringify(["Salvador", "Camaçari", "Lauro de Freitas", "Simões Filho"]),
    soilType: JSON.stringify(["franco", "arenoso"]),
    treeSize: "medium",
    shadeProduction: "moderate",
    droughtTolerance: "high",
    description: "Árvore ornamental com flores amarelas vibrantes. Tolerante à seca e ideal para calçadas.",
  },
  {
    commonName: "Pau-brasil",
    scientificName: "Paubrasilia echinata",
    family: "Fabaceae",
    climate: JSON.stringify(["Salvador", "Camaçari", "Lauro de Freitas"]),
    soilType: JSON.stringify(["argiloso", "franco"]),
    treeSize: "large",
    shadeProduction: "high",
    droughtTolerance: "moderate",
    description: "Árvore emblemática do Brasil, símbolo da Mata Atlântica. Madeira valiosa e grande porte.",
  },
  {
    commonName: "Cajueiro",
    scientificName: "Anacardium occidentale",
    family: "Anacardiaceae",
    climate: JSON.stringify(["Salvador", "Camaçari", "Lauro de Freitas", "Simões Filho"]),
    soilType: JSON.stringify(["arenoso", "franco"]),
    treeSize: "medium",
    shadeProduction: "moderate",
    droughtTolerance: "high",
    description: "Árvore frutífera nativa, muito adaptada ao clima semiárido e litorâneo.",
  },
  {
    commonName: "Imbaúba",
    scientificName: "Cecropia peltata",
    family: "Urticaceae",
    climate: JSON.stringify(["Salvador", "Camaçari", "Lauro de Freitas", "Simões Filho"]),
    soilType: JSON.stringify(["franco", "argiloso"]),
    treeSize: "medium",
    shadeProduction: "moderate",
    droughtTolerance: "moderate",
    description: "Árvore pioneira, de rápido crescimento. Ideal para reflorestamento e atração de aves.",
  },
];

async function main() {
  console.log("Seeding database...");

  console.log("Creating points...");
  for (const point of pointsData) {
    await prisma.pointFeature.upsert({
      where: { id: point.neighborhood + point.city },
      update: point,
      create: {
        id: point.neighborhood + point.city,
        ...point,
      },
    });
  }

  console.log("Creating heat zones...");
  for (const zone of heatZonesData) {
    await prisma.heatZone.upsert({
      where: { id: zone.name },
      update: zone,
      create: {
        id: zone.name,
        ...zone,
      },
    });
  }

  console.log("Creating native species...");
  for (const species of nativeSpeciesData) {
    await prisma.nativeSpecies.upsert({
      where: { id: species.scientificName },
      update: species,
      create: {
        id: species.scientificName,
        ...species,
      },
    });
  }

  // Remove entradas corrigidas na revisão de espécies (T4) para que seeds
  // antigos não deixem dados incorretos no banco.
  await prisma.nativeSpecies.deleteMany({
    where: {
      scientificName: {
        in: [
          "Bertholletia excelsa",
          "Rhizophora mangle",
          "Cocos nucifera",
          "Caesalpinia echinata",
        ],
      },
    },
  });

  console.log("Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
