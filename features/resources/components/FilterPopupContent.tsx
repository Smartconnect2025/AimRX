import { ResourceType } from "../types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

interface FilterPopupContentProps {
  selectedTypes: ResourceType[];
  activeTags: string[];
  allTags: string[];
  onTypeToggle: (type: ResourceType) => void;
  onTagToggle: (tag: string) => void;
  onResetFilters: () => void;
}

const FilterPopupContent = ({
  selectedTypes,
  activeTags,
  allTags,
  onTypeToggle,
  onTagToggle,
  onResetFilters,
}: FilterPopupContentProps) => {
  return (
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
                onCheckedChange={() => onTypeToggle(type as ResourceType)}
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
                onCheckedChange={() => onTagToggle(tag)}
              />
              <label htmlFor={`tag-${tag}`} className="text-sm">
                {tag}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={onResetFilters}>
          Clear All
        </Button>
      </div>
    </div>
  );
};

export default FilterPopupContent;
