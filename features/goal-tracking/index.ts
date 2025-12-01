// Components
export { GoalTracker } from "./components/GoalTracker";
export { VitalsGoalTracker } from "./components/VitalsGoalTracker";
export { VitalsGoalCard } from "./components/VitalsGoalCard";
export { VitalsGoalForm } from "./components/VitalsGoalForm";
export { ManualVitalsModal } from "../vitals/components/ManualVitalsModal";

// Legacy components (for backward compatibility)
export { GoalCard } from "./components/GoalCard";
export { GoalForm } from "./components/GoalForm";
export { GoalList } from "./components/domain/GoalList";
export { HistoryView } from "./components/history/HistoryView";
export { PerformanceChart } from "./components/history/PerformanceChart";

// Types
export * from "./types";

// Store
export { useGoalStore } from "./store/goal-store";

// Constants
export * from "./constants";
