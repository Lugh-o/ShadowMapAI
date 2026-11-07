export type BaseMapStatus = "loading" | "ready" | "partial-error" | "error";

export interface PointFocusRequest {
  pointId: string;
  id: number;
}

export interface ZoneFocusRequest {
  zoneId: string;
  id: number;
}
