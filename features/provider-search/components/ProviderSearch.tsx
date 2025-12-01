"use client";

import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchFilters } from "./SearchFilters";
import { ProviderCard } from "./ProviderCard";
import { useProviderSearch } from "../hooks/useProviderSearch";
import { useSearchParamsSync } from "../hooks/useSearchParamsSync";
import { SearchFilters as SearchFiltersType } from "../types";
import { Search, X, Loader2 } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

interface SelectedSlot {
  providerId: string;
  slot: string;
}

export function ProviderSearch({
  initialSearchQuery = "",
  initialFilters: _initialFilters = {},
  onBookingComplete,
  isModal = false,
}: {
  initialSearchQuery?: string;
  initialFilters?: SearchFiltersType;
  onBookingComplete?: () => void;
  isModal?: boolean;
}) {
  const [inputValue, setInputValue] = useState(initialSearchQuery);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Use custom hook for search params synchronization
  const { searchState, updateQuery, updateFilters, clearSearch } =
    useSearchParamsSync({
      isModal,
      debounceMs: 300,
    });

  const { query: searchQuery, filters } = searchState;

  // Sync input value with search query from URL
  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  const debouncedSetSearchQuery = useDebouncedCallback(
    (value: string) => updateQuery(value.trim()),
    300,
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    debouncedSetSearchQuery(value);
  };

  const handleSearch = () => {
    updateQuery(inputValue.trim());
  };

  const handleClear = () => {
    setInputValue("");
    clearSearch();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleSlotSelect = (providerId: string, slot: string | null) => {
    if (slot === null) {
      setSelectedSlot(null);
    } else {
      setSelectedSlot({ providerId, slot });
    }
  };

  const handleFiltersChange = (newFilters: SearchFiltersType) => {
    updateFilters(newFilters);
  };

  const filtersObj = useMemo(
    () => ({ ...filters, searchQuery }),
    [filters, searchQuery],
  );

  const { providers, isLoading, error } = useProviderSearch(filtersObj);

  return (
    <div
      className={isModal ? "w-full" : "container mx-auto p-4 max-w-5xl mt-8"}
    >
      {/* Search Bar */}
      <div className={isModal ? "mb-6" : "mb-8"}>
        <div className={isModal ? "w-full" : "max-w-5xl mx-auto"}>
          <div className="flex items-center">
            <div className="flex-1 flex items-center relative">
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={
                  isFocused ? "" : "Search by provider name or specialty..."
                }
                className={`border-0 text-lg focus-visible:ring-0 placeholder:text-muted-foreground rounded-lg shadow-sm bg-white pl-12 ${
                  inputValue ? "pr-12" : "pr-5"
                } ${isModal ? "h-12" : "h-14"}`}
              />
              {inputValue && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={isModal ? "w-full" : "max-w-5xl mx-auto"}>
        <div
          className={
            isModal ? "flex flex-col lg:flex-row gap-4 lg:gap-6" : "flex gap-6"
          }
        >
          {/* Filters Sidebar/Top */}
          <div
            className={
              isModal
                ? "w-full lg:w-80 lg:flex-shrink-0 order-1 lg:order-1"
                : "w-1/4 flex-shrink-0"
            }
          >
            <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
              <SearchFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
              />
            </div>
          </div>

          {/* Provider Cards Grid */}
          <div className={isModal ? "flex-1 order-2 lg:order-2" : "w-3/4"}>
            {error && (
              <div className="text-center text-red-500 mb-6">{error}</div>
            )}

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 lg:py-16">
                <Loader2 className="h-10 w-10 lg:h-12 lg:w-12 animate-spin text-primary mb-4" />
                <h3 className="text-base lg:text-lg font-medium text-foreground mb-2">
                  Searching for providers...
                </h3>
                <p className="text-muted-foreground text-center max-w-md text-sm lg:text-base">
                  We&apos;re finding the best healthcare providers that match
                  your criteria and checking their availability.
                </p>
              </div>
            ) : (
              <>
                {/* Search Results Header */}
                {searchQuery && <div className="mb-6"></div>}

                <div
                  className={`grid gap-4 ${
                    isModal ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-2"
                  }`}
                >
                  {providers.map((provider) => (
                    <ProviderCard
                      key={provider.id}
                      provider={provider}
                      selectedSlot={
                        selectedSlot?.providerId === provider.id
                          ? selectedSlot.slot
                          : null
                      }
                      onSlotSelect={(slot) =>
                        handleSlotSelect(provider.id, slot)
                      }
                      onBookingComplete={onBookingComplete}
                    />
                  ))}
                </div>

                {providers.length === 0 && (
                  <div className="text-center text-muted-foreground mt-8">
                    {searchQuery ? (
                      <>
                        <p className="text-lg font-medium mb-2">
                          No providers found
                        </p>
                        <p>
                          No providers match your search for &quot;{searchQuery}
                          &quot;. Try different keywords or adjust your filters.
                        </p>
                      </>
                    ) : (
                      "No providers found matching your criteria"
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
