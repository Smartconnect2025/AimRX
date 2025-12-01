// import { createClient } from "@core/supabase/client"; // Not used in current implementation
import type { VitalsGoal, GoalFormData, VitalEntry, VitalType } from "./types";

// API for vitals-based goals
export async function createVitalsGoal(
  goalData: GoalFormData & { user_id: string; created_by?: string },
) {
  const response = await fetch("/api/goals/vitals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(goalData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create goal");
  }

  return response.json();
}

export async function getVitalsGoals(user_id: string): Promise<VitalsGoal[]> {
  const response = await fetch(`/api/goals/vitals?user_id=${user_id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch goals");
  }

  const result = await response.json();
  return result.data;
}

export async function updateVitalsGoal(
  goalId: string,
  updates: Partial<GoalFormData>,
) {
  const response = await fetch(`/api/goals/vitals/${goalId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update goal");
  }

  return response.json();
}

export async function deleteVitalsGoal(goalId: string) {
  const response = await fetch(`/api/goals/vitals/${goalId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete goal");
  }
}

export async function getVitalEntries(
  type: VitalType,
  days: number = 30,
): Promise<VitalEntry[]> {
  const response = await fetch(`/api/vitals?type=${type}&days=${days}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch vital entries");
  }

  const result = await response.json();
  return result.data;
}

export async function logVitalEntry(
  type: VitalType,
  data: { value?: number; systolic?: number; diastolic?: number },
) {
  const payload: Record<string, unknown> = { type };

  if (type === "weight") {
    payload.value = data.value;
  } else if (type === "blood_pressure") {
    payload.systolic = data.systolic;
    payload.diastolic = data.diastolic;
  }

  const response = await fetch("/api/vitals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to log vital");
  }

  return response.json();
}

// New function to log goal progress
export async function logGoalProgress(
  goalId: string,
  currentValue: number,
  notes?: string,
) {
  const response = await fetch("/api/goals/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      goal_id: goalId,
      current_value: currentValue,
      notes: notes,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to log goal progress");
  }

  return response.json();
}

// New function to get goal progress
export async function getGoalProgress(goalId: string, days: number = 30) {
  const response = await fetch(
    `/api/goals/progress?goal_id=${goalId}&days=${days}`,
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch goal progress");
  }

  const result = await response.json();
  return result.data;
}

// Legacy API functions for backward compatibility - to be removed
// These are kept temporarily to prevent breaking existing code
