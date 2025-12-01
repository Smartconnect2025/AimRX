"use client";

import React from "react";
import { format } from "date-fns";
import { MoreHorizontal, Trash2, Coffee, Dumbbell } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { JournalEntry } from "../types";

interface JournalLogProps {
  entries: JournalEntry[];
  onDeleteEntry?: (entryId: string) => void;
  className?: string;
}

export const JournalLog: React.FC<JournalLogProps> = ({
  entries,
  onDeleteEntry,
  className,
}) => {
  if (entries.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-muted-foreground">No journal entries yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Start writing to create your first journal entry
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {entries.map((entry) => (
        <Card key={entry.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(entry.created_at), "MMM d, yyyy")}
                  </span>
                </div>

                {/* Activity indicators */}
                <div className="flex items-center gap-2">
                  {entry.did_exercise && (
                    <Badge variant="secondary" className="text-xs">
                      <Dumbbell className="h-3 w-3 mr-1" />
                      Exercise
                    </Badge>
                  )}
                  {entry.caffeine_servings > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      <Coffee className="h-3 w-3 mr-1" />
                      {entry.caffeine_servings}{" "}
                      {entry.caffeine_servings === 1 ? "serving" : "servings"}
                    </Badge>
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
          </CardHeader>

          <CardContent className="pt-0">
            <div className="prose prose-sm max-w-none">
              <p className="text-foreground whitespace-pre-wrap break-words">
                {entry.content}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
