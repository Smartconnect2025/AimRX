import { ProviderSearch } from "@/features/provider-search";

interface ProviderSearchPageProps {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
}

export default async function ProviderSearchPage({
  searchParams,
}: ProviderSearchPageProps) {
  const resolvedSearchParams = await searchParams;

  // Extract search context from URL parameters
  const searchQuery =
    typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : "";
  const filtersParam =
    typeof resolvedSearchParams.filters === "string"
      ? resolvedSearchParams.filters
      : "";

  // Parse filters from URL parameter
  let parsedFilters = {};
  if (filtersParam) {
    try {
      parsedFilters = JSON.parse(decodeURIComponent(filtersParam));
    } catch (error) {
      console.warn("Failed to parse filters from URL:", error);
    }
  }

  return (
    <ProviderSearch
      initialSearchQuery={searchQuery}
      initialFilters={parsedFilters}
    />
  );
}
