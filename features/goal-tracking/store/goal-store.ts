import { create } from "zustand";
import { Goal } from "../types";

interface GoalStore {
  goals: Goal[];
  isLoading: boolean;
  error: string | null;

  // Actions
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  setGoals: (goals: Goal[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useGoalStore = create<GoalStore>((set) => ({
  goals: [],
  isLoading: false,
  error: null,

  addGoal: (goal) => {
    set((state) => ({
      goals: [...state.goals, goal],
    }));
  },

  updateGoal: (id, updates) => {
    set((state) => ({
      goals: state.goals.map((goal) =>
        goal.id === id ? { ...goal, ...updates } : goal,
      ),
    }));
  },

  deleteGoal: (id) => {
    set((state) => ({
      goals: state.goals.filter((goal) => goal.id !== id),
    }));
  },

  setGoals: (goals) => {
    set({ goals });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setError: (error) => {
    set({ error });
  },
}));
