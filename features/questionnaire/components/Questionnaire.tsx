"use client";

import React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { QuestionnaireProvider } from "../context/QuestionnaireContext";
import { QuestionnaireConfig } from "../types";
import { QuestionnaireContent } from "./QuestionnaireContent";
import { z } from "zod";

interface QuestionnaireProps {
  config: QuestionnaireConfig;
}

// Create a dynamic schema based on the config
const createQuestionnaireSchema = (config: QuestionnaireConfig) => {
  const schemaFields: Record<string, z.ZodType> = {};

  config.sections.forEach((section) => {
    section.questions.forEach((question) => {
      let fieldSchema;
      switch (question.type) {
        case "single-select":
          fieldSchema = question.required
            ? z.string().min(1, { message: "This field is required" })
            : z.string().optional();
          break;
        case "multi-select":
          fieldSchema = question.required
            ? z
                .array(z.string())
                .min(1, { message: "Please select at least one option" })
            : z.array(z.string()).optional();
          break;
        case "text-input":
          fieldSchema = question.required
            ? z.string().min(1, { message: "This field is required" })
            : z.string().optional();
          break;
      }

      schemaFields[question.id] = fieldSchema;
    });
  });

  return z.object(schemaFields);
};

export function Questionnaire({ config }: QuestionnaireProps) {
  // Initialize default values for all fields
  const defaultValues = React.useMemo(() => {
    const values: Record<string, string | string[]> = {};
    config.sections.forEach((section) => {
      section.questions.forEach((question) => {
        values[question.id] = question.type === "multi-select" ? [] : "";
      });
    });
    return values;
  }, [config]);

  const methods = useForm({
    resolver: zodResolver(createQuestionnaireSchema(config)),
    defaultValues,
    mode: "onChange", // Enable real-time validation
  });

  return (
    <QuestionnaireProvider config={config}>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(() => {})}>
          <QuestionnaireContent config={config} />
        </form>
      </FormProvider>
    </QuestionnaireProvider>
  );
}
