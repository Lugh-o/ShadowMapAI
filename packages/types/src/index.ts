export type City =
  | "Salvador"
  | "Camaçari"
  | "Lauro de Freitas"
  | "Simões Filho";

export type HeatLevel = "low" | "medium" | "high" | "extreme";
export type ShadeLevel = "good" | "moderate" | "low" | "none";
export type IssueType =
  | "heat_island"
  | "low_tree_cover"
  | "exposed_transit_stop"
  | "paved_open_area"
  | "school_route";
export type Priority = "low" | "medium" | "high" | "critical";
export type ModerationStatus = "pending" | "approved" | "rejected";
export type DataOrigin = "collected" | "simulated";

export interface PointFeature {
  id: string;
  city: City;
  neighborhood: string;
  lat: number;
  lng: number;
  heatLevel: HeatLevel;
  shadeLevel: ShadeLevel;
  issueType: IssueType;
  description: string;
  priority: Priority;
  moderationStatus?: ModerationStatus;
  dataOrigin: DataOrigin;
  ref?: string | null;
  aiAssisted?: boolean;
  submittedBy?: string;
  submittedAt?: string;
}

export interface HeatZone {
  id: string;
  city: City;
  name: string;
  coordinates: [number, number][];
  intensity: HeatLevel;
  createdInSession?: boolean;
}

export interface FiltersState {
  city: City | "all";
  issueType: IssueType | "all";
  priority: Priority | "all";
}

export type PointFormValues = Omit<
  PointFeature,
  | "id"
  | "moderationStatus"
  | "dataOrigin"
  | "ref"
  | "aiAssisted"
  | "submittedBy"
  | "submittedAt"
>;

export interface NativeSpecies {
  id: string;
  commonName: string;
  scientificName: string;
  family: string;
  climate: City[];
  soilType: string[];
  treeSize: "small" | "medium" | "large";
  shadeProduction: "low" | "moderate" | "high";
  droughtTolerance: "low" | "moderate" | "high";
  description: string;
  source: string;
}

export interface SpeciesMatch {
  species: NativeSpecies;
  score: number;
  reasons: string[];
}

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export interface PointDraft {
  issueType: IssueType | null;
  heatLevel: HeatLevel | null;
  shadeLevel: ShadeLevel | null;
  description: string;
  missing: string[];
}

export interface PointDraftResult {
  draft: PointDraft;
  suggestedPriority: Priority | null;
}

export interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface User {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
}
