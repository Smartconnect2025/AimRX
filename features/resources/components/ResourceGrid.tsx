import { GridPresets, ResponsiveGrid } from "@/components/ui/responsive-grid";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { generateUniqueId } from "@/utils/id-utils";

import { Resource, ResourceType } from "../types";
import EmptyState from "./EmptyState";
import ResourceCard from "./ResourceCard";

interface ResourceGridProps {
  resources: Resource[];
  activeTags: string[];
  onTagToggle: (tag: string) => void;
  loading?: boolean;
}

const ResourceGrid = ({
  resources,
  activeTags,
  onTagToggle,
  loading = false,
}: ResourceGridProps) => {
  if (loading) {
    return (
      <ResponsiveGrid columns={GridPresets.cards} className="mb-8">
        {Array.from({ length: 12 }).map(() => (
          <SkeletonCard key={generateUniqueId()} />
        ))}
      </ResponsiveGrid>
    );
  }

  if (resources.length === 0) {
    return <EmptyState />;
  }

  return (
    <ResponsiveGrid columns={GridPresets.cards} className="mb-8">
      {resources.map((item) => (
        <ResourceCard
          key={item.id}
          id={item.id}
          title={item.title}
          description={item.description}
          coverSrc={item.cover_src || undefined}
          type={item.type as ResourceType}
          tags={item.tags}
          activeTags={activeTags}
          onTagToggle={onTagToggle}
          url={item.url || undefined}
        />
      ))}
    </ResponsiveGrid>
  );
};

export default ResourceGrid;
