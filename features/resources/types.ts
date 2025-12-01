// Import database schema types
import type {
  Resource as DBResource,
  InsertResource,
  UpdateResource,
} from "@/core/database/schema";

// Application-specific type definitions
export type ResourceType =
  | "PDF"
  | "Article"
  | "Video"
  | "Link"
  | "Text Content";

// Frontend Resource interface extending database schema with proper date handling
export interface Resource
  extends Omit<DBResource, "created_at" | "updated_at" | "tags" | "content"> {
  created_at: Date;
  updated_at: Date;
  tags: string[]; // Ensure tags is always an array (database allows null)
  content?: string | null; // Rich text content for Text Content type
}

// Database operation types
export type CreateResourceData = InsertResource;
export type UpdateResourceData = UpdateResource;

// Additional types for the resources feature
export interface ResourceFilters {
  type?: ResourceType;
  tags?: string[];
  search?: string;
}

export interface ResourcePagination {
  page: number;
  limit: number;
  total: number;
}
