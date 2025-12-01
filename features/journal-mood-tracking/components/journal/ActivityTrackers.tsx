import React from "react";
import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ActivityTrackersProps {
  didExercise: boolean;
  setDidExercise: (value: boolean) => void;
  caffeineServings: number;
  setCaffeineServings: (value: number) => void;
}

export const ActivityTrackers: React.FC<ActivityTrackersProps> = ({
  didExercise,
  setDidExercise,
  caffeineServings,
  setCaffeineServings,
}) => {
  const didConsumeCaffeine = caffeineServings > 0;

  const handleCaffeineToggle = (value: boolean) => {
    if (value) {
      setCaffeineServings(1);
    } else {
      setCaffeineServings(0);
    }
  };

  return (
    <div className="space-y-4">
      {/* Exercise Toggle */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="exercise-toggle" className="font-medium">Did you exercise today?</Label>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="icon"
              className={`h-8 w-8 p-0 ${!didExercise ? "bg-primary text-primary-foreground" : ""}`}
              onClick={() => setDidExercise(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">No</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={`h-8 w-8 p-0 ${didExercise ? "bg-primary text-primary-foreground" : ""}`}
              onClick={() => setDidExercise(true)}
            >
              <Check className="h-4 w-4" />
              <span className="sr-only">Yes</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Caffeine Toggle */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="caffeine-toggle" className="font-medium">Did you consume caffeine today?</Label>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="icon"
              className={`h-8 w-8 p-0 ${!didConsumeCaffeine ? "bg-primary text-primary-foreground" : ""}`}
              onClick={() => handleCaffeineToggle(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">No</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={`h-8 w-8 p-0 ${didConsumeCaffeine ? "bg-primary text-primary-foreground" : ""}`}
              onClick={() => handleCaffeineToggle(true)}
            >
              <Check className="h-4 w-4" />
              <span className="sr-only">Yes</span>
            </Button>
          </div>
        </div>

        {/* Conditional Caffeine Servings Input */}
        {didConsumeCaffeine && (
          <div className="flex items-center justify-end space-x-4 mt-2">
            <Label htmlFor="caffeine-servings" className="whitespace-nowrap text-sm">
              How many servings?
            </Label>
            <Input
              id="caffeine-servings"
              type="number"
              min={1}
              max={10}
              value={caffeineServings}
              onChange={(e) => setCaffeineServings(parseInt(e.target.value) || 1)}
              className="w-20"
            />
          </div>
        )}
      </div>
    </div>
  );
};