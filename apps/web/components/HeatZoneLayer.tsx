import { Polygon, Tooltip } from "react-leaflet";

import {
  getHeatLevelLabel,
  getHeatZoneColor,
  getHeatZoneFillOpacity,
} from "@/lib/utils";
import type { HeatZone } from "@shadowmap/types";

interface HeatZoneLayerProps {
  zones: HeatZone[];
  selectedZoneId: string | null;
  onSelectZone: (zoneId: string) => void;
  interactive: boolean;
}

export default function HeatZoneLayer({
  zones,
  selectedZoneId,
  onSelectZone,
  interactive,
}: HeatZoneLayerProps) {
  return (
    <>
      {zones.map((zone) => (
        <Polygon
          key={`${zone.id}-${interactive}`}
          interactive={interactive}
          className={
            zone.createdInSession ? "heat-zone session-zone" : "heat-zone"
          }
          positions={zone.coordinates}
          bubblingMouseEvents={false}
          eventHandlers={{ click: () => onSelectZone(zone.id) }}
          pathOptions={{
            color: getHeatZoneColor(zone.intensity),
            fillColor: getHeatZoneColor(zone.intensity),
            fillOpacity: getHeatZoneFillOpacity(zone.intensity),
            weight: zone.id === selectedZoneId ? 4 : 2,
            dashArray: zone.createdInSession ? "6 4" : undefined,
          }}
        >
          <Tooltip sticky className="heat-zone-tooltip">
            <div className="space-y-1">
              <p className="font-semibold">{zone.name}</p>
              <p className="text-xs opacity-80">{zone.city}</p>
              <p className="text-xs">
                Intensidade: {getHeatLevelLabel(zone.intensity)}
              </p>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-300">
                {zone.createdInSession
                  ? "Criada nesta sessão · simulada"
                  : "Zona simulada"}
              </p>
            </div>
          </Tooltip>
        </Polygon>
      ))}
    </>
  );
}
