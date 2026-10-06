/** Shared domain types (spec §41, §70). */

export type UUID = string;

export interface BoundingBox {
  /** 0–1 relative to image width/height */
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ConfidenceLevel = "high" | "medium" | "low";

export type SourceType =
  | "BOOK"
  | "PAPER"
  | "MUSEUM"
  | "DATABASE"
  | "WEBSITE"
  | "CATALOG"
  | "ARCHIVE";

export interface Source {
  id: string;
  title: string;
  author?: string;
  publisher?: string;
  url?: string;
  publicationDate?: string;
  type: SourceType;
  citationText: string;
}

export type ContentStatus = "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";

export type UserRole =
  | "USER"
  | "RESEARCHER"
  | "MUSEUM_EDITOR"
  | "MUSEUM_ADMIN"
  | "CONTENT_EDITOR"
  | "SUPER_ADMIN";

export type AssistantMode = "visitor" | "educational" | "research" | "guide";

export interface ApiError {
  error: {
    code: string;
    message: string;
    requestId?: string;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
