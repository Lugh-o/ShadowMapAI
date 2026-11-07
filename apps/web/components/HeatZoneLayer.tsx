import { Polygon, Tooltip } from "react-leaflet";

import {
  getHeatLevelLabel,
  getHeatZoneColor,
  getHeatZoneFillOpacity,
} from "@/lib/utils";
import type { HeatZone } from "@shadowmap/types";

interface HeatZoneLayerProps {
  zones: HeatZone[];
}

export default function HeatZoneLayer({ zones }: HeatZoneLayerProps) {
  return (
    <>
      {zones.map((zone) => (
        <Polygon
          key={zone.id}
          positions={zone.coordinates}
          pathOptions={{
            color: getHeatZoneColor(zone.intensity),
            fillColor: getHeatZoneColor(zone.intensity),
            fillOpacity: getHeatZoneFillOpacity(zone.intensity),
            weight: 2,
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
                Zona simulada
              </p>
            </div>
          </Tooltip>
        </Polygon>
      ))}
    </>
  );
}
