import type { ContentStatus, Source, UUID } from "./common";

export interface Museum {
  id: UUID;
  name: string;
  slug: string;
  description: string;
  country: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  logo?: string;
  coverImage?: string;
  openingHours: string;
  website?: string;
  timezone: string;
  language: string;
  status: ContentStatus;
  floors: MuseumFloor[];
  tours: string[];
  arExperiences: string[];
  sources: Source[];
}

/**
 * Floor plan uses a custom 0–1000 coordinate space (spec §14).
 * This is deliberately decoupled from any geo coordinate system so
 * SVG floor plans, GeoJSON and future BLE/UWB positioning can all
 * map onto the same model.
 */
export interface MuseumFloor {
  id: UUID;
  name: string;
  level: number;
  planWidth: number;
  planHeight: number;
  rooms: MuseumRoom[];
  zones: MuseumZone[];
}

export interface MuseumRoom {
  id: UUID;
  name: string;
  /** Rectangle in floor coordinate space (0–1000) */
  x: number;
  y: number;
  width: number;
  height: number;
  category: RoomCategory;
  accessibility: boolean;
}

export type RoomCategory =
  | "gallery"
  | "atrium"
  | "hall"
  | "chapel"
  | "laboratory"
  | "entrance"
  | "exit"
  | "storage"
  | "cafe"
  | "shop";

export interface MuseumZone {
  id: UUID;
  name: string;
  /** Ordered polygon points in floor coordinate space */
  polygon: Array<{ x: number; y: number }>;
  theme: string;
}

export type ArtifactStatus = ContentStatus;

export interface Artifact {
  id: UUID;
  museumId: UUID;
  name: string;
  slug: string;
  description: string;
  period: string;
  dynasty: string;
  dateFrom: string;
  dateTo: string;
  material: string;
  dimensions: string;
  creator?: string;
  culture: string;
  /** Room id within the museum floor plan */
  locationRoomId?: UUID;
  inventoryNumber: string;
  images: string[];
  /** Hieroglyphic inscription, if any */
  inscription?: {
    transliteration: string;
    translation: string;
    signIds: string[];
  };
  model3D?: string;
  audio?: string;
  tags: string[];
  featured: boolean;
  status: ArtifactStatus;
  metadata: Record<string, string>;
  sources: Source[];
  relatedArtifactIds: UUID[];
  /** Floor plan coordinate for map markers (0–1000, floor 0) */
  mapPosition?: { x: number; y: number };
}

export interface MuseumTour {
  id: UUID;
  museumId: UUID;
  title: string;
  description: string;
  durationMinutes: number;
  language: string;
  stops: TourStop[];
  accessibility: "full" | "partial" | "limited";
  theme: string;
  /** Editorial status. Mirrors the Prisma Tour.status column. */
  status: ContentStatus;
}

export interface TourStop {
  id: UUID;
  order: number;
  artifactId?: UUID;
  roomId?: UUID;
  title: string;
  narration: string;
  durationSeconds: number;
}

export interface ARExperience {
  id: UUID;
  museumId: UUID;
  artifactId: UUID;
  title: string;
  description: string;
  kind: "animated_statue" | "historical_character" | "reconstructed_scene" | "narrated_story";
  hotspots: Array<{
    id: string;
    x: number;
    y: number;
    label: string;
    content: string;
  }>;
  status: ContentStatus;
}
