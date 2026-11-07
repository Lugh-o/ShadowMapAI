export type MapGuideAction = "new-point" | "show-legend" | "show-map";
export type GuideActionId = MapGuideAction | "dashboard" | "project";

export type GuideAction =
  | { id: MapGuideAction; label: string; type: "map" }
  | { id: "dashboard" | "project"; label: string; type: "link"; href: string };

export const GUIDE_ACTIONS: Record<GuideActionId, GuideAction> = {
  "new-point": { id: "new-point", label: "Abrir cadastro", type: "map" },
  "show-legend": { id: "show-legend", label: "Mostrar legenda", type: "map" },
  "show-map": { id: "show-map", label: "Ir ao mapa", type: "map" },
  dashboard: {
    id: "dashboard",
    label: "Ir ao painel",
    type: "link",
    href: "/dashboard",
  },
  project: {
    id: "project",
    label: "Sobre o projeto",
    type: "link",
    href: "/privacidade",
  },
};
