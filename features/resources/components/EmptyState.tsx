import { SearchX } from "lucide-react";

interface EmptyStateProps {
  message?: string;
}

const EmptyState = ({
  message = "No resources found matching your filters",
}: EmptyStateProps) => {
  return (
    <div className="w-full flex flex-col items-center justify-center py-12 px-4 text-center">
      <SearchX className="h-16 w-16 text-muted-foreground/30 mb-4" />
      <h3 className="text-lg font-medium text-muted-foreground">{message}</h3>
      <p className="text-sm text-muted-foreground/70 mt-1 max-w-md">
        Try adjusting your search or filter criteria to find what you&apos;re looking
        for.
      </p>
    </div>
  );
};

export default EmptyState;
