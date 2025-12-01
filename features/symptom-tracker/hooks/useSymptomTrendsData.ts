import { useMemo } from "react";
import { format, addDays } from "date-fns";
import { SymptomLog } from "../types";

export type TimeRange = "7d" | "30d" | "90d";

export function useSymptomTrendsData(timeRange: TimeRange, logs: SymptomLog[]) {
  const filteredLogs = useMemo(() => {
    const now = new Date();
    const startDate = new Date();
    if (timeRange === "7d") startDate.setDate(now.getDate() - 7);
    if (timeRange === "30d") startDate.setDate(now.getDate() - 30);
    if (timeRange === "90d") startDate.setMonth(now.getMonth() - 3);
    return logs.filter(
      (log) =>
        new Date(log.created_at) >= startDate &&
        new Date(log.created_at) <= now,
    );
  }, [logs, timeRange]);

  const topSymptoms = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLogs.forEach((log) => {
      if (log.symptom?.name) {
        counts[log.symptom.name] = (counts[log.symptom.name] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([symptom]) => symptom);
  }, [filteredLogs]);

  const chartData = useMemo(() => {
    const dates: Record<string, Record<string, number | null>> = {};
    const now = new Date();
    const startDate = new Date(now);

    if (timeRange === "7d") startDate.setDate(now.getDate() - 7);
    if (timeRange === "30d") startDate.setDate(now.getDate() - 30);
    if (timeRange === "90d") startDate.setMonth(now.getMonth() - 3);

    let currentDate = new Date(startDate);
    while (currentDate <= now) {
      const dateKey = format(currentDate, "MM/dd");
      dates[dateKey] = {};
      currentDate = addDays(currentDate, 1);
    }

    topSymptoms.forEach((symptom) => {
      Object.keys(dates).forEach((dateKey) => {
        dates[dateKey][symptom] = null;
      });
    });

    filteredLogs.forEach((log) => {
      const dateKey = format(new Date(log.created_at), "MM/dd");
      const symptomName = log.symptom?.name;
      if (symptomName && topSymptoms.includes(symptomName) && dates[dateKey]) {
        dates[dateKey][symptomName] = log.severity;
      }
    });

    return Object.entries(dates).map(([date, values]) => ({ date, ...values }));
  }, [filteredLogs, topSymptoms, timeRange]);

  return { topSymptoms, chartData, logs: filteredLogs };
}
