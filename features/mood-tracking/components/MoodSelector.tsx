import React from "react";
import { Mood } from "../types";
import { getMoodConfig } from "../utils";
import { cn } from "@/utils/tailwind-utils";

interface MoodSelectorProps {
  selectedMood: Mood | null;
  onSelectMood: (mood: Mood) => void;
}

export const MoodSelector: React.FC<MoodSelectorProps> = ({
  selectedMood,
  onSelectMood,
}) => {
  const moods: { type: Mood; label: string }[] = [
    { type: "amazing", label: "Amazing" },
    { type: "good", label: "Good" },
    { type: "neutral", label: "Neutral" },
    { type: "anxious", label: "Anxious" },
    { type: "angry", label: "Angry" },
  ];

  return (
    <div className="flex justify-between items-center gap-2">
      {moods.map((mood) => {
        const config = getMoodConfig(mood.type);
        const Icon = config.icon;
        const isSelected = selectedMood === mood.type;

        return (
          <button
            key={mood.type}
            className={cn(
              "flex flex-col items-center p-3 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary/20",
              isSelected
                ? "bg-primary text-primary-foreground scale-110 transform"
                : "hover:bg-muted",
            )}
            onClick={() => onSelectMood(mood.type)}
            type="button"
          >
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors",
                isSelected ? "bg-white/20" : config.bgColor,
              )}
            >
              <Icon
                className={cn(
                  "h-6 w-6 transition-colors",
                  isSelected ? "text-primary-foreground" : config.color,
                )}
              />
            </div>
            <span
              className={cn(
                "text-xs sm:text-sm font-medium",
                isSelected ? "text-primary-foreground" : "text-foreground",
              )}
            >
              {mood.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
