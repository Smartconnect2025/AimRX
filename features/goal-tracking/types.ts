import type {
  Goal as DBGoal,
  Milestone as DBMilestone,
  GoalProgress as DBGoalProgress,
  InsertGoal,
  InsertMilestone,
  InsertGoalProgress,
} from "@/core/database/schema";

export type GoalType = "patient" | "provider";
export type GoalStatus = "on-track" | "behind" | "achieved" | "not-started";
export type TimeFrame = "daily" | "weekly" | "monthly" | "custom";
export type VitalType = "weight" | "blood_pressure";
export type GoalCategory = "vital_signs";

// Frontend Goal interface extending database schema with proper date handling
export interface Goal
  extends Omit<
    DBGoal,
    "start_date" | "end_date" | "created_at" | "last_updated"
  > {
  start_date: Date;
  end_date: Date;
  created_at: Date;
  last_updated: Date;
}

// Frontend Milestone interface extending database schema with camelCase compatibility
export interface Milestone
  extends Omit<DBMilestone, "goal_id" | "achieved_at"> {
  goalId: string; // camelCase for frontend compatibility
  goal_id: string; // Keep snake_case for database compatibility
  achievedAt?: Date; // camelCase for frontend compatibility
  achieved_at?: Date; // Keep snake_case for database compatibility
}

// Frontend GoalProgress interface extending database schema with camelCase compatibility
export interface GoalProgress extends Omit<DBGoalProgress, "goal_id" | "date"> {
  goalId: string; // camelCase for frontend compatibility
  goal_id: string; // Keep snake_case for database compatibility
  date: Date;
}

// Vitals-based goal interface for goals that reference vitals data
export interface VitalsGoal {
  id: string;
  user_id: string;
  type: GoalType;
  vital_type: VitalType;
  target_value: string;
  timeframe: TimeFrame;
  start_date: Date;
  end_date: Date;
  description?: string;
  status: GoalStatus;
  created_by?: string; // Provider ID if provider-created
  created_at: Date;
  last_updated: Date;
}

// Form data interface for goal creation/editing
export interface GoalFormData {
  type: GoalType;
  vital_type: VitalType;
  target_value: string;
  timeframe: TimeFrame;
  description?: string;
  start_date?: Date;
  end_date?: Date;
}

// Vitals data from manual logging
export interface VitalEntry {
  id: string;
  date: string;
  value?: number; // For weight
  systolic?: number; // For blood pressure
  diastolic?: number; // For blood pressure
}

// Database operation types
export type CreateGoalData = InsertGoal;
export type CreateMilestoneData = InsertMilestone;
export type CreateGoalProgressData = InsertGoalProgress;

export interface GoalHistoryEntry {
  date: Date;
  progress: number;
  actualValue?: number;
  notes?: string;
}
