"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
} from "react";
import { QuestionnaireContextValue, QuestionnaireConfig } from "../types";

// Action Types
type QuestionnaireAction =
  | { type: "NEXT_STEP" }
  | { type: "PREVIOUS_STEP" }
  | { type: "COMPLETE" }
  | { type: "RESET" };

// Initial State
const initialState = {
  currentStep: 0,
  isValid: false,
  isComplete: false,
};

// Create Context
const QuestionnaireContext = createContext<
  QuestionnaireContextValue | undefined
>(undefined);

// Reducer
interface QuestionnaireState extends QuestionnaireContextValue {
  config: QuestionnaireConfig;
}

function questionnaireReducer(
  state: QuestionnaireState,
  action: QuestionnaireAction,
): QuestionnaireState {
  switch (action.type) {
    case "NEXT_STEP":
      return {
        ...state,
        currentStep: state.currentStep + 1,
      };
    case "PREVIOUS_STEP":
      return {
        ...state,
        currentStep: Math.max(0, state.currentStep - 1),
      };
    case "COMPLETE":
      return {
        ...state,
        isComplete: true,
        data: {
          ...state.data,
          metadata: {
            ...state.data.metadata,
            completedAt: new Date().toISOString(),
          },
        },
      };
    case "RESET":
      return {
        ...initialState,
        config: state.config,
        data: {
          id: state.config.id,
          responses: {},
          metadata: {
            startedAt: new Date().toISOString(),
            lastUpdatedAt: new Date().toISOString(),
            version: "1.0.0",
          },
        },
        actions: state.actions,
      };
    default:
      return state;
  }
}

// Provider Props
interface QuestionnaireProviderProps {
  config: QuestionnaireConfig;
  children: React.ReactNode;
}

// Provider Component
export function QuestionnaireProvider({
  config,
  children,
}: QuestionnaireProviderProps) {
  const [state, dispatch] = useReducer(questionnaireReducer, {
    ...initialState,
    config,
    data: {
      id: config.id,
      responses: {},
      metadata: {
        startedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
        version: "1.0.0",
      },
    },
    actions: {
      next: async () => {},
      back: () => {},
      save: async () => {},
      cancel: () => {},
      updateResponse: () => {},
    },
  } as QuestionnaireState);

  const next = useCallback(async () => {
    const currentSection = config.sections[state.currentStep];
    if (currentSection && state.currentStep < config.sections.length - 1) {
      dispatch({ type: "NEXT_STEP" });
    } else {
      await config.navigation.onComplete(state.data);
      dispatch({ type: "COMPLETE" });
    }
  }, [config, state.currentStep, state.data]);

  const back = useCallback(() => {
    dispatch({ type: "PREVIOUS_STEP" });
  }, []);

  const save = useCallback(async () => {
    if (config.storage.adapter) {
      await config.storage.adapter.save(state.data);
    }
  }, [config.storage, state.data]);

  const cancel = useCallback(() => {
    config.navigation.onCancel();
    dispatch({ type: "RESET" });
  }, [config.navigation]);

  const contextValue: QuestionnaireContextValue = {
    ...state,
    actions: {
      next,
      back,
      save,
      cancel,
      updateResponse: () => {}, // This is now handled by react-hook-form
    },
  };

  return (
    <QuestionnaireContext.Provider value={contextValue}>
      {children}
    </QuestionnaireContext.Provider>
  );
}

// Hook for using the questionnaire context
export function useQuestionnaire() {
  const context = useContext(QuestionnaireContext);
  if (context === undefined) {
    throw new Error(
      "useQuestionnaire must be used within a QuestionnaireProvider",
    );
  }
  return context;
}
