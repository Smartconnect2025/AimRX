import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/tailwind-utils";

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

// Predefined mood influence tags
const MOOD_TAGS = [
  "Work",
  "Family",
  "Sleep",
  "Exercise",
  "Yoga",
  "Friends",
  "Health",
  "Weather",
  "Food",
  "Money",
];

export const TagSelector: React.FC<TagSelectorProps> = ({
  selectedTags,
  onTagsChange,
}) => {
  const availableTags = MOOD_TAGS.slice(0, 8); // Use first 8 tags for better layout

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {availableTags.map((tag) => (
        <Badge
          key={tag}
          variant="outline"
          className={cn(
            "cursor-pointer px-4 py-2 text-sm transition-colors hover:shadow-sm",
            selectedTags.includes(tag)
              ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
              : "bg-muted text-muted-foreground hover:bg-muted/80 border-border",
          )}
          onClick={() => toggleTag(tag)}
        >
          {tag}
        </Badge>
      ))}
    </div>
  );
};
