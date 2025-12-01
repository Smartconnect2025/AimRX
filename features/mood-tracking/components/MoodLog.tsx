"use client";

import React from "react";
import { format } from "date-fns";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoodEntry } from "../types";
import { getMoodConfig } from "../utils";

interface MoodLogProps {
  entries: MoodEntry[];
  onDeleteEntry?: (entryId: string) => void;
  className?: string;
}

export const MoodLog: React.FC<MoodLogProps> = ({
  entries,
  onDeleteEntry,
  className,
}) => {
  if (entries.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-muted-foreground">No mood entries yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Start tracking your moods to see your history here
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {entries.map((entry) => {
        const moodConfig = getMoodConfig(entry.mood);
        const Icon = moodConfig.icon;

        return (
          <Card key={entry.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {/* Mood Icon */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${moodConfig.bgColor}`}
                  >
                    <Icon className={`h-5 w-5 ${moodConfig.color}`} />
                  </div>

                  {/* Entry Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{moodConfig.label}</span>
                      <span className="text-sm text-muted-foreground">
                        {format(
                          new Date(entry.created_at),
                          "MMM d, yyyy 'at' h:mm a",
                        )}
                      </span>
                    </div>

                    {/* Tags */}
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {entry.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Menu */}
                {onDeleteEntry && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => onDeleteEntry(entry.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
