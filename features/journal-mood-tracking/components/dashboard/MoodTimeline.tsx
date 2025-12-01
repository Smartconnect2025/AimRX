import React from "react";
import { Card } from "@/components/ui/card";
import { MoodEntry } from "../../types";
import { MoodEmoji } from "../mood/MoodEmoji";

interface MoodTimelineProps {
  moodEntries: MoodEntry[];
}

export const MoodTimeline: React.FC<MoodTimelineProps> = ({ moodEntries }) => {
  // Group entries by date for the timeline
  const entriesByDate = moodEntries.reduce((groups, entry) => {
    if (!groups[entry.date]) {
      groups[entry.date] = [];
    }
    groups[entry.date].push(entry);
    return groups;
  }, {} as Record<string, MoodEntry[]>);

  return (
    <div className="mt-3">
      {Object.keys(entriesByDate).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(entriesByDate).map(([date, entries]) => (
            <div key={date} className="relative">
              {/* Date label */}
              <div className="flex items-center mb-2">
                <div className="h-2 w-2 bg-primary rounded-full mr-2"></div>
                <span className="text-sm font-medium text-gray-600">{date}</span>
              </div>
              
              {/* Timeline line */}
              <div className="absolute left-1 top-6 bottom-0 w-[2px] bg-gray-200 -ml-[1px]"></div>
              
              {/* Entries for this date */}
              <div className="pl-6 space-y-3">
                {entries.map((entry) => (
                  <Card key={entry.id} className="overflow-hidden border-gray-100 shadow-md">
                    <div className="p-3 flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="mt-0.5">
                          <MoodEmoji mood={entry.mood} />
                        </div>
                        <div>
                          <div className="text-sm font-medium capitalize">
                            {entry.mood}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {entry.tags.map((tag, idx) => (
                              <span key={idx} className="inline-flex text-xs px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {entry.timestamp}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-500">No mood entries yet</p>
        </div>
      )}
    </div>
  );
}; 