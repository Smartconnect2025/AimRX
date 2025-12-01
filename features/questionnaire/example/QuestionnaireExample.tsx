"use client";

import { Questionnaire } from "../components/Questionnaire";
import { QuestionnaireConfig, QuestionnaireData } from "../types";

// Example storage adapter
const localStorageAdapter = {
  save: async (data: QuestionnaireData) => {
    localStorage.setItem(`questionnaire_${data.id}`, JSON.stringify(data));
  },
  load: async (id: string) => {
    const data = localStorage.getItem(`questionnaire_${id}`);
    return data ? JSON.parse(data) : null;
  },
  update: async (id: string, data: Partial<QuestionnaireData>) => {
    const existing = await localStorageAdapter.load(id);
    if (existing) {
      const updated = { ...existing, ...data };
      await localStorageAdapter.save(updated);
    }
  },
};

// Example configuration
const exampleConfig: QuestionnaireConfig = {
  id: "medical-intake",
  title: "Medical Intake Questionnaire",
  description:
    "Please complete this questionnaire to help us understand your medical history.",
  sections: [
    {
      id: "general-health",
      title: "General Health",
      description: "Basic health information",
      enabled: true,
      required: true,
      questions: [
        {
          id: "smoking",
          type: "single-select",
          question: "Do you smoke?",
          required: true,
          options: [
            { id: "smoke-yes", label: "Yes", value: "yes" },
            { id: "smoke-no", label: "No", value: "no" },
          ],
        },
        {
          id: "health-conditions",
          type: "multi-select",
          question: "Do you have any of the following conditions?",
          required: true,
          options: [
            {
              id: "condition-1",
              label: "High blood pressure",
              value: "hypertension",
            },
            { id: "condition-2", label: "Diabetes", value: "diabetes" },
            {
              id: "condition-3",
              label: "Heart disease",
              value: "heart-disease",
            },
            { id: "condition-4", label: "None of the above", value: "none" },
          ],
        },
      ],
      logic: [
        {
          condition: {
            field: "smoking",
            operator: "equals",
            value: "yes",
          },
          show: ["smoking-frequency"],
        },
      ],
    },
    {
      id: "medications",
      title: "Current Medications",
      description: "Tell us about any medications you are currently taking",
      enabled: true,
      required: true,
      questions: [
        {
          id: "current-medications",
          type: "text-input",
          question: "List your current medications",
          required: true,
          placeholder: "Enter medications, separated by commas",
        },
      ],
    },
  ],
  storage: {
    type: "custom",
    adapter: localStorageAdapter,
  },
  navigation: {
    onComplete: async (data) => {
      console.log("Questionnaire completed:", data);
      // Handle completion (e.g., redirect to next step)
    },
    onCancel: () => {
      console.log("Questionnaire cancelled");
      // Handle cancellation
    },
  },
};

export function QuestionnaireExample() {
  return (
    <div className="max-w-3xl mx-auto">
      <Questionnaire config={exampleConfig} />
    </div>
  );
}
