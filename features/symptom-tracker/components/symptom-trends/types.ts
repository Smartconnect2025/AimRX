import { SymptomLog } from "@/features/symptom-tracker/types";

export type TimeRange = "7d" | "30d" | "90d" | "custom";

export interface ChartDataPoint {
  date: string;
  [key: string]: string | number | null;
}

export interface SymptomTrendsDataProps {
  logs: SymptomLog[];
  timeRange: TimeRange;
  selectedSymptoms: Set<string>;
}

export interface TimeRangeSelectorProps {
  timeRange: TimeRange;
  onTimeRangeChange: (value: string) => void;
}

export interface SymptomBadgeListProps {
  topSymptoms: string[];
  selectedSymptoms: Set<string>;
  logs: SymptomLog[];
  onToggleSymptom: (symptomId: string) => void;
}

export interface SymptomTrendsChartProps {
  chartData: ChartDataPoint[];
  selectedSymptoms: Set<string>;
}

export interface SymptomTrendsHeaderProps {
  title: string;
}
