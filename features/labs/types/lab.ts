export type ResultType = "numeric" | "range" | "comment";

export interface BiomarkerResult {
  value: number;
  unit: string;
  reference_range: string;
  status:
    | "normal"
    | "abnormal"
    | "high"
    | "low"
    | "critical"
    | "critical_high"
    | "critical_low";
  critical: boolean;
  result_type: ResultType;
  raw_result: string; // Original result string from API
  notes?: string; // Additional notes for RANGE and COMMENT types
}

export interface PanelResults {
  panel_name: string;
  panel_code: string;
  results: Record<string, BiomarkerResult>;
}

export interface LabResult {
  result_id: string;
  test_date: string;
  lab_location: string;
  order_id: string;
  status: "completed" | "pending" | "in_progress";
  panels: Record<string, PanelResults>;
}

export interface TrendData {
  trend: "improving" | "stable" | "declining";
  latest_value: number;
  change_from_previous: number;
  percentage_change: number;
}

export interface SummaryStatistics {
  total_tests: number;
  date_range: string;
  trends: Record<string, TrendData>;
}

export interface UserLabData {
  user_id: string;
  lab_results: LabResult[];
  summary_statistics: SummaryStatistics;
}

export interface LabPanel {
  id: string;
  name: string;
  slug?: string;
  description: string;
  biomarkers: string[];
  price: number;
  estimatedTime: string;
  fastingRequired: boolean;
  urgency: "high" | "normal" | "low";
  purchaseDate: string;
  expirationDate: string;
  timeSensitive: boolean;
}

export interface LabAppointment {
  id: string;
  panelId: string;
  panelName: string;
  scheduledDate: Date;
  status: "scheduled" | "completed" | "cancelled";
  location: string;
  address: string;
}
