import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/tailwind-utils";
import { MOOD_TAGS } from "../../constants";

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export const TagSelector: React.FC<TagSelectorProps> = ({ 
  selectedTags, 
  onTagsChange 
}) => {
  const availableTags = MOOD_TAGS.slice(0, 5); // Use first 5 tags: Work, Family, Sleep, Exercise, Yoga

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {availableTags.map(tag => (
        <Badge
          key={tag}
          variant="outline"
          className={cn(
            "cursor-pointer px-4 py-2 text-sm transition-colors border-gray-200 hover:shadow-sm",
            selectedTags.includes(tag) 
              ? "bg-[#4BCBC7] text-white border-[#4BCBC7] hover:bg-[#3BABA7]" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          )}
          onClick={() => toggleTag(tag)}
        >
          {tag}
        </Badge>
      ))}
    </div>
  );
}; 