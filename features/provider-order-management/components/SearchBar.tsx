/**
 * SearchBar Component
 *
 * Search and filter interface for provider orders.
 */

"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchBarProps } from "../types";
import { SEARCH_CONFIG } from "../constants";
import { debounce } from "../utils";

export function SearchBar({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  isLoading = false,
}: SearchBarProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  // Debounced search handler
  const debouncedSearch = debounce(
    ((query: unknown) => {
      onSearchChange(query as string);
    }) as (...args: unknown[]) => unknown,
    SEARCH_CONFIG.DEBOUNCE_DELAY,
  );

  // Update local state when prop changes
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchQuery(value);
    debouncedSearch(value);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit();
  };

  // Handle clear search
  const handleClear = () => {
    setLocalSearchQuery("");
    onSearchChange("");
  };

  return (
    <form onSubmit={handleSubmit} className="w-full md:w-auto">
      <div className="flex gap-2">
        <div className="relative w-full md:w-64">
          <Input
            type="text"
            placeholder={SEARCH_CONFIG.PLACEHOLDER}
            value={localSearchQuery}
            onChange={handleInputChange}
            disabled={isLoading}
            className="w-full bg-white pr-8"
          />
          {localSearchQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              disabled={isLoading}
            >
              ×
            </button>
          )}
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Searching..." : "Search"}
        </Button>
      </div>
    </form>
  );
}
