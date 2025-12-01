"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useMediaQuery } from "@/hooks/use-media-query";
import { AdminResourcesTable } from "./AdminResourcesTable";
import { ResourceFormDialog } from "./ResourceFormDialog";
import { ResourceViewDialog } from "./ResourceViewDialog";
import { useAdminResources } from "../hooks/useAdminResources";
import type { Resource, ResourceType } from "../types";
import type { ResourceFormData } from "./ResourceFormDialog";

export function ResourcesManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<ResourceType[]>([]);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [viewingResource, setViewingResource] = useState<Resource | null>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const {
    resources,
    allTags,
    loading,
    currentPage,
    totalCount,
    pageSize,
    createResource,
    updateResource,
    deleteResource,
    refreshResources,
    handlePageChange,
    fetchResources,
  } = useAdminResources();

  const handleDeleteResource = async (resourceId: string) => {
    try {
      await deleteResource(resourceId);
      const filters = {
        search: searchTerm,
        type: selectedTypes.length > 0 ? selectedTypes.join(",") : undefined,
        tags: activeTags.length > 0 ? activeTags.join(",") : undefined,
      };
      refreshResources(filters);
    } catch (error) {
      console.error("Error deleting resource:", error);
    }
  };

  // Reset to first page when filters change
  const handleFilterChange = () => {
    if (currentPage !== 1) {
      const filters = {
        search: searchTerm,
        type: selectedTypes.length > 0 ? selectedTypes.join(",") : undefined,
        tags: activeTags.length > 0 ? activeTags.join(",") : undefined,
      };
      handlePageChange(1, filters);
    }
  };

  const handleTypeToggle = (type: ResourceType) => {
    setSelectedTypes((prev) => {
      const isSelected = prev.includes(type);
      if (isSelected) {
        return prev.filter((t) => t !== type);
      } else {
        return [...prev, type];
      }
    });
    handleFilterChange();
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
    handleFilterChange();
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedTypes([]);
    setActiveTags([]);
    handleFilterChange();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    handleFilterChange();
  };

  const handleCreateResource = () => {
    setEditingResource(null);
    setIsFormOpen(true);
  };

  const handleEditResource = (resource: Resource) => {
    setEditingResource(resource);
    setIsFormOpen(true);
  };

  const handleViewResource = (resource: Resource) => {
    setViewingResource(resource);
    setIsViewOpen(true);
  };

  const handleFormSubmit = async (data: ResourceFormData) => {
    try {
      if (editingResource) {
        await updateResource(editingResource.id, data);
      } else {
        // Ensure URL is provided for non-PDF resources
        const createData = {
          ...data,
          url: data.url || (data.type === "PDF" ? "PDF_UPLOADED" : ""),
        };
        await createResource(createData);
      }
      setIsFormOpen(false);
      setEditingResource(null);
      const filters = {
        search: searchTerm,
        type: selectedTypes.length > 0 ? selectedTypes.join(",") : undefined,
        tags: activeTags.length > 0 ? activeTags.join(",") : undefined,
      };
      refreshResources(filters);
    } catch (error) {
      console.error("Error saving resource:", error);
    }
  };

  // 🔍 Debounced search: only when searchTerm changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const filters = {
        search: searchTerm,
        type: selectedTypes.length > 0 ? selectedTypes.join(",") : undefined,
        tags: activeTags.length > 0 ? activeTags.join(",") : undefined,
      };
      fetchResources(1, filters); // start at page 1 for a new search
      handlePageChange(1, filters); // keep state in sync
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedTypes, activeTags, fetchResources, handlePageChange]);

  // 📄 Page change: run with current filters, no debounce
  useEffect(() => {
    const filters = {
      search: searchTerm,
      type: selectedTypes.length > 0 ? selectedTypes.join(",") : undefined,
      tags: activeTags.length > 0 ? activeTags.join(",") : undefined,
    };
    fetchResources(currentPage, filters);
  }, [currentPage, searchTerm, selectedTypes, activeTags, fetchResources]);

  // Handle page changes with current filters
  const handlePageChangeWithFilters = useCallback(
    (page: number) => {
      const filters = {
        search: searchTerm,
        type: selectedTypes.length > 0 ? selectedTypes.join(",") : undefined,
        tags: activeTags.length > 0 ? activeTags.join(",") : undefined,
      };
      handlePageChange(page, filters);
    },
    [searchTerm, selectedTypes, activeTags, handlePageChange],
  );

  const activeFiltersCount = selectedTypes.length + activeTags.length;

  return (
    <div className="container max-w-5xl mx-auto py-6 space-y-6 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Resources Management
          </h2>
        </div>
        <Button
          onClick={handleCreateResource}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Resource
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-white rounded-lg border border-border p-4">
          <div className="text-2xl font-bold">{totalCount}</div>
          <div className="text-sm text-muted-foreground">Total Resources</div>
        </div>
        <div className="bg-white rounded-lg border border-border p-4">
          <div className="text-2xl font-bold">
            {resources.filter((r) => r.type === "Article").length}
          </div>
          <div className="text-sm text-muted-foreground">Articles</div>
        </div>
        <div className="bg-white rounded-lg border border-border p-4">
          <div className="text-2xl font-bold">
            {resources.filter((r) => r.type === "Video").length}
          </div>
          <div className="text-sm text-muted-foreground">Videos</div>
        </div>
        <div className="bg-white rounded-lg border border-border p-4">
          <div className="text-2xl font-bold">
            {resources.filter((r) => r.type === "PDF").length}
          </div>
          <div className="text-sm text-muted-foreground">PDFs</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-row gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <Input
              placeholder="Search resources..."
              className="pl-12 h-11 rounded-lg border-gray-200 bg-white"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="relative rounded-lg h-11 px-4 border-gray-200 bg-white hover:bg-gray-50"
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
              <div className="space-y-4 p-4 border border-gray-200 rounded-[6px] bg-white">
                <h4 className="font-medium">Filter Resources</h4>

                <div>
                  <h5 className="text-sm font-medium mb-2">Resource Types</h5>
                  <div className="grid grid-cols-2 gap-2">
                    {["PDF", "Article", "Video", "Link"].map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${type}`}
                          className="border-primary cursor-pointer"
                          checked={selectedTypes.includes(type as ResourceType)}
                          onCheckedChange={() =>
                            handleTypeToggle(type as ResourceType)
                          }
                        />
                        <label
                          htmlFor={`type-${type}`}
                          className="text-sm flex items-center gap-1"
                        >
                          {type}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="bg-gray-200" />

                <div>
                  <h5 className="text-sm font-medium mb-2">Tags</h5>
                  <div className="max-h-40 overflow-y-auto grid grid-cols-2 gap-2">
                    {allTags.map((tag) => (
                      <div key={tag} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tag-${tag}`}
                          className="border-primary cursor-pointer"
                          checked={activeTags.includes(tag)}
                          onCheckedChange={() => handleTagToggle(tag)}
                        />
                        <label htmlFor={`tag-${tag}`} className="text-sm">
                          {tag}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                    Clear All
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Resources Table */}
      <AdminResourcesTable
        resources={resources}
        loading={loading}
        currentPage={currentPage}
        pageSize={pageSize}
        totalResources={totalCount}
        onEdit={handleEditResource}
        onDelete={handleDeleteResource}
        onView={handleViewResource}
        onPageChange={handlePageChangeWithFilters}
      />

      {/* Resource Form Dialog */}
      <ResourceFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        resource={editingResource}
        onSubmit={handleFormSubmit}
      />

      {/* Resource View Dialog */}
      <ResourceViewDialog
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        resource={viewingResource}
      />
    </div>
  );
}
