import { CircleMarker, Popup } from "react-leaflet";

import {
  formatCoordinates,
  getHeatLevelLabel,
  getIssueTypeLabel,
  getPointPriorityColor,
  getPriorityLabel,
  getShadeLevelLabel,
} from "@/lib/utils";
import type { PointFeature } from "@shadowmap/types";

interface PointMarkersProps {
  points: PointFeature[];
  selectedPointId: string | null;
  onSelectPoint: (pointId: string) => void;
}

export default function PointMarkers({
  points,
  selectedPointId,
  onSelectPoint,
}: PointMarkersProps) {
  return (
    <>
      {points.map((point) => {
        const isSelected = point.id === selectedPointId;
        const isSimulated = point.dataOrigin === "simulated";

        return (
          <CircleMarker
            key={point.id}
            center={[point.lat, point.lng]}
            radius={isSelected ? 10 : 8}
            pathOptions={{
              color: isSimulated ? "#64748B" : "#ffffff",
              weight: isSelected ? 3 : 2,
              dashArray: isSimulated ? "4 3" : undefined,
              fillColor: isSimulated
                ? "#94A3B8"
                : getPointPriorityColor(point.priority),
              fillOpacity: isSimulated ? 0.85 : 0.95,
            }}
            eventHandlers={{
              click: () => onSelectPoint(point.id),
            }}
          >
            <Popup>
              <div className="min-w-[220px] space-y-3 text-emerald-950">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-950/50">
                    {point.city}
                  </p>
                  <h3 className="font-display text-lg font-semibold">
                    {point.neighborhood}
                  </h3>
                  {isSimulated ? (
                    <span className="mt-1 inline-flex rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-700">
                      Simulado
                    </span>
                  ) : null}
                </div>

                <div className="grid gap-1 text-sm">
                  <p>
                    <strong>Ocorrência:</strong>{" "}
                    {getIssueTypeLabel(point.issueType)}
                  </p>
                  <p>
                    <strong>Prioridade:</strong>{" "}
                    {getPriorityLabel(point.priority)}
                  </p>
                  <p>
                    <strong>Calor:</strong> {getHeatLevelLabel(point.heatLevel)}
                  </p>
                  <p>
                    <strong>Sombra:</strong>{" "}
                    {getShadeLevelLabel(point.shadeLevel)}
                  </p>
                  <p>
                    <strong>Coordenadas:</strong>{" "}
                    {formatCoordinates(point.lat, point.lng)}
                  </p>
                </div>

                <p className="text-sm leading-6 text-emerald-950/78">
                  {point.description}
                </p>

                {isSimulated ? (
                  <p className="rounded-[12px] bg-amber-50 px-2 py-1 text-xs leading-5 text-amber-950">
                    Dado de demonstração. Não foi enviado por um morador nem
                    representa medição de temperatura.
                  </p>
                ) : null}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}
