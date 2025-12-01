import React from "react";
import { MoodType } from "../../types";
import { getMoodConfig } from "../../utils";
import { cn } from "@/utils/tailwind-utils";

interface MoodEmojiProps {
  mood: MoodType;
  size?: number;
  className?: string;
}

export const MoodEmoji: React.FC<MoodEmojiProps> = ({ 
  mood, 
  size = 5, 
  className 
}) => {
  const config = getMoodConfig(mood);
  const Icon = config.icon;
  
  // Use explicit size classes instead of dynamic ones
  const sizeClass = size === 4 ? "h-4 w-4" : 
                   size === 5 ? "h-5 w-5" : 
                   size === 6 ? "h-6 w-6" : 
                   size === 8 ? "h-8 w-8" : 
                   size === 10 ? "h-10 w-10" : "h-5 w-5";
  
  return (
    <Icon 
      className={cn(
        sizeClass,
        config.color,
        className
      )} 
    />
  );
}; 