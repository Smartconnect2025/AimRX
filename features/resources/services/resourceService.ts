import { createClient } from "@core/supabase/client";
import type { Resource, ResourceType } from "../types";
import type { Resource as DBResource } from "@/core/database/schema";

export interface ResourceQueryParams {
  searchTerm?: string;
  selectedTypes?: ResourceType[];
  activeTags?: string[];
  page?: number;
  itemsPerPage?: number;
}

// Helper function to convert database resource to frontend resource
function transformResourceFromDB(dbResource: DBResource): Resource {
  return {
    ...dbResource,
    created_at: new Date(dbResource.created_at),
    updated_at: new Date(dbResource.updated_at),
    tags: dbResource.tags || [], // Ensure tags is always an array
  };
}

export async function fetchResourcesFromDb({
  searchTerm = "",
  selectedTypes = [],
  activeTags = [],
  page = 1,
  itemsPerPage = 12,
}: ResourceQueryParams) {
  const supabase = createClient();
  let query = supabase
    .from("resources")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (searchTerm.trim()) {
    const trimmed = searchTerm.trim();
    query = query.or(`title.ilike.%${trimmed}%,description.ilike.%${trimmed}%`);
  }
  if (selectedTypes.length > 0) {
    query = query.in("type", selectedTypes);
  }
  if (activeTags.length > 0) {
    activeTags.forEach((tag) => {
      query = query.contains("tags", [tag]);
    });
  }
  const from = (page - 1) * itemsPerPage;
  const to = from + itemsPerPage - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return { data: null, error, count: 0 };
  }

  // Transform database resources to frontend resources
  const transformedData = data
    ? (data as DBResource[]).map(transformResourceFromDB)
    : [];

  return {
    data: transformedData,
    error: null,
    count: count || 0,
  };
}

export async function fetchAllResourceTags() {
  const supabase = createClient();
  const { data, error } = await supabase.from("resources").select("tags");
  return { data, error };
}
