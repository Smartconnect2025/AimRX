// Main component
export { MedicationQuestionnaire } from "./MedicationQuestionnaire";

// Modal component
export { MedicationQuestionnaireModal } from "./components/MedicationQuestionnaireModal";

// Hooks
export { useQuestionnaireState } from "./hooks/useQuestionnaireState";

// Constants
export { medicationConsentText } from "./constants/medication-consent-text";

// Types and schemas
export type {
  MedicationQuestionnaireData,
  MedicationQuestionnaireProps,
  MedicationRequirement,
  PregnancyStatus,
  WeightLossQuestions,
  GeneralHealthQuestions,
} from "./types";

// Utilities
export {
  needsQuestionnaire,
  getQuestionnaireRequirements,
  cartRequiresQuestionnaire,
  getMedicationsRequiringQuestionnaire,
  getRequiredQuestionSections,
  hasCompletedQuestionnaire,
  markQuestionnaireCompleted,
} from "./utils";
