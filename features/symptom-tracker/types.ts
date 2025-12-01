export interface Symptom {
  id: string;
  name: string;
  emoji: string;
  is_common: boolean;
}

export interface SymptomLog {
  id: string;
  symptom_id: string;
  severity: number;
  description?: string;
  created_at: string;
  patient_id?: string;
  symptom?: Symptom;
}

export interface SymptomLogInput {
  symptom_id: string;
  severity: number;
  patient_id: string;
  description?: string;
}

export interface Reminder {
  id: number;
  patient_id: string;
  enabled: boolean;
  frequency: "daily" | "twice-daily" | "weekly";
  time_of_day: string[];
  created_at: string;
  updated_at: string;
}

export interface ReminderInput {
  patient_id: string;
  enabled?: boolean;
  frequency: "daily" | "twice-daily" | "weekly";
  time_of_day: string[];
}

export type Frequency = "daily" | "twice-daily" | "weekly";
