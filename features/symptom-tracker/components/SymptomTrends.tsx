"use client";

import { SymptomLog } from "../types";
import { useState, useEffect } from "react";
import { useSymptomTrendsData, TimeRange } from "../hooks";
import { SymptomBadgeList } from "./symptom-trends/SymptomBadgeList";
import { TimeRangeSelector } from "./symptom-trends/TimeRangeSelector";
import { SymptomTrendsChart } from "./symptom-trends/SymptomTrendsChart";

export const SymptomTrends = ({ logs }: { logs: SymptomLog[] }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [selectedSymptoms, setSelectedSymptoms] = useState<Set<string>>(
    new Set(),
  );

  const { topSymptoms, chartData } = useSymptomTrendsData(timeRange, logs);

  useEffect(() => setSelectedSymptoms(new Set(topSymptoms)), [topSymptoms]);

  const toggleSymptom = (symptomName: string) => {
    setSelectedSymptoms((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(symptomName)) {
        newSet.delete(symptomName);
      } else {
        newSet.add(symptomName);
      }
      return newSet;
    });
  };

  if (topSymptoms.length === 0) {
    return (
      <div className="p-6">
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No symptoms logged yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TimeRangeSelector
            timeRange={timeRange}
            onTimeRangeChange={(value) => setTimeRange(value as TimeRange)}
          />

          <SymptomBadgeList
            topSymptoms={topSymptoms}
            selectedSymptoms={selectedSymptoms}
            logs={logs}
            onToggleSymptom={toggleSymptom}
          />
        </div>

        <SymptomTrendsChart
          chartData={chartData}
          selectedSymptoms={selectedSymptoms}
        />
      </div>
    </div>
  );
};
