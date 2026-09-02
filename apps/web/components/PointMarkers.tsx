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

        return (
          <CircleMarker
            key={point.id}
            center={[point.lat, point.lng]}
            radius={isSelected ? 10 : 8}
            pathOptions={{
              color: "#ffffff",
              weight: isSelected ? 3 : 2,
              fillColor: getPointPriorityColor(point.priority),
              fillOpacity: 0.95,
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
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}
