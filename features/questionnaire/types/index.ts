// Question Types
export type QuestionType = "single-select" | "multi-select" | "text-input";

// Base Question Interface
export interface BaseQuestion {
  id: string;
  type: QuestionType;
  question: string;
  required: boolean;
  description?: string;
  validation?: ValidationRule[];
}

// Single Select Question
export interface SingleSelectQuestion extends BaseQuestion {
  type: "single-select";
  options: Array<{
    id: string;
    label: string;
    value: string;
  }>;
}

// Multi Select Question
export interface MultiSelectQuestion extends BaseQuestion {
  type: "multi-select";
  options: Array<{
    id: string;
    label: string;
    value: string;
  }>;
  minSelected?: number;
  maxSelected?: number;
}

// Text Input Question
export interface TextInputQuestion extends BaseQuestion {
  type: "text-input";
  placeholder?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
}

// Union type for all question types
export type Question =
  | SingleSelectQuestion
  | MultiSelectQuestion
  | TextInputQuestion;

// Validation Rules
export interface ValidationRule {
  type: "required" | "minLength" | "maxLength" | "pattern" | "custom";
  value?: string | number | boolean | unknown;
  message: string;
  validate?: (value: unknown) => boolean | Promise<boolean>;
}

// Question Flow Logic
export interface QuestionLogic {
  condition: {
    field: string;
    operator: "equals" | "notEquals" | "contains" | "notContains";
    value: string | number | boolean | unknown;
  };
  show?: string[];
  hide?: string[];
  require?: string[];
}

// Storage Types
export type StorageType = "emr" | "encounter" | "custom";

// Storage Adapter Interface
export interface StorageAdapter {
  save: (data: QuestionnaireData) => Promise<void>;
  load: (id: string) => Promise<QuestionnaireData | null>;
  update: (id: string, data: Partial<QuestionnaireData>) => Promise<void>;
}

// Navigation Handler Interface
export interface NavigationHandler {
  onComplete: (data: QuestionnaireData) => void | Promise<void>;
  onCancel: () => void;
  onStepChange?: (currentStep: number, direction: "next" | "back") => void;
}

// Section Configuration
export interface SectionConfig {
  id: string;
  title: string;
  description?: string;
  enabled: boolean;
  required: boolean;
  questions: Question[];
  logic?: QuestionLogic[];
}

// Questionnaire Configuration
export interface QuestionnaireConfig {
  id: string;
  title: string;
  description?: string;
  sections: SectionConfig[];
  storage: {
    type: StorageType;
    adapter?: StorageAdapter;
  };
  navigation: NavigationHandler;
  validation?: {
    requiredFields?: string[];
    customValidation?: Record<string, ValidationRule>;
  };
}

// Questionnaire Data
export interface QuestionnaireData {
  id: string;
  responses: Record<string, string | string[] | number | boolean | null>;
  metadata: {
    startedAt: string;
    completedAt?: string;
    lastUpdatedAt: string;
    version: string;
  };
}

// Questionnaire Context
export interface QuestionnaireContextValue {
  data: QuestionnaireData;
  config: QuestionnaireConfig;
  currentStep: number;
  isValid: boolean;
  isComplete: boolean;
  actions: {
    next: () => Promise<void>;
    back: () => void;
    save: () => Promise<void>;
    cancel: () => void;
    updateResponse: (
      questionId: string,
      value: string | string[] | number | boolean | null,
    ) => void;
  };
}
