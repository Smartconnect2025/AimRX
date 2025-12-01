"use client";

import { Filter } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMediaQuery } from "@/hooks/use-media-query";

import { ResourceType } from "../types";
import FilterPopupContent from "./FilterPopupContent";
import SearchInput from "./SearchInput";

interface FilterBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedTypes: ResourceType[];
  setSelectedTypes: React.Dispatch<React.SetStateAction<ResourceType[]>>;
  activeTags: string[];
  setActiveTags: React.Dispatch<React.SetStateAction<string[]>>;
  allTags: string[];
  clearAllFilters: () => void;
}

const FilterBar = ({
  searchTerm,
  setSearchTerm,
  selectedTypes,
  setSelectedTypes,
  activeTags,
  setActiveTags,
  allTags,
  clearAllFilters,
}: FilterBarProps) => {
  const isMobile = useMediaQuery("(max-width: 768px)");

  const handleTypeToggle = (type: ResourceType) => {
    setSelectedTypes((prev) => {
      const isSelected = prev.includes(type);
      if (isSelected) {
        return prev.filter((t) => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  const handleTagToggle = (tag: string) => {
    setActiveTags((prev) => {
      const isSelected = prev.includes(tag);
      if (isSelected) {
        return prev.filter((t) => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  const activeFiltersCount = selectedTypes.length + activeTags.length;

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex flex-row gap-4">
        <SearchInput searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="relative rounded-[6px] h-11 px-4 border-gray-200 bg-white hover:bg-gray-50"
            >
              <Filter size={18} />
              {!isMobile && <span className="ml-2">Filter</span>}
              {activeFiltersCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="p-0 border-none shadow-none w-auto"
            align="end"
          >
            <FilterPopupContent
              selectedTypes={selectedTypes}
              activeTags={activeTags}
              allTags={allTags}
              onTypeToggle={handleTypeToggle}
              onTagToggle={handleTagToggle}
              onResetFilters={clearAllFilters}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default FilterBar;
