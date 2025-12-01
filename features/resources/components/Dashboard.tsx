"use client";

import { useFilterState } from '@/hooks/use-filter-state';

import { useResources } from '../hooks/useResources';
import { ResourceType } from '../types';
import FilterBar from './FilterBar';
import ResourceGrid from './ResourceGrid';
import ResourcePagination from './ResourcePagination';

const itemsPerPage = 12;

const Dashboard = () => {
  const {
    searchInput,
    searchTerm,
    selectedTypes,
    activeTags,
    currentPage,
    setSearchInput,
    setSelectedTypes,
    setActiveTags,
    setCurrentPage,
    toggleTag: handleTagToggle,
    clearAllFilters,
  } = useFilterState<ResourceType>({
    searchDebounceMs: 300,
  });

  const { resources, allTags, loading, error, totalPages } = useResources({
    searchTerm,
    selectedTypes,
    activeTags,
    page: currentPage,
    itemsPerPage,
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 bg-muted px-4 py-6 sm:p-6 flex justify-center">
        <div className="w-full max-w-5xl">
          <h1 className="text-3xl font-bold mb-6">Resources</h1>

          <div className="mb-8">
            <FilterBar
              searchTerm={searchInput}
              setSearchTerm={setSearchInput}
              selectedTypes={selectedTypes}
              setSelectedTypes={setSelectedTypes}
              activeTags={activeTags}
              setActiveTags={setActiveTags}
              allTags={allTags}
              clearAllFilters={clearAllFilters}
            />
          </div>

          {error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : (
            <>
              <ResourceGrid
                resources={resources}
                activeTags={activeTags}
                onTagToggle={handleTagToggle}
                loading={loading}
              />

              {!loading && totalPages > 1 && (
                <ResourcePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  setCurrentPage={setCurrentPage}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
