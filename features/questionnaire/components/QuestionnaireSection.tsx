"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { SectionConfig } from "../types";
import { QuestionField } from "./QuestionField";

interface QuestionnaireSectionProps {
  section: SectionConfig;
}

export function QuestionnaireSection({ section }: QuestionnaireSectionProps) {
  const { watch } = useFormContext();

  // Apply question logic
  const getQuestionVisibility = (questionId: string) => {
    if (!section.logic) return true;

    for (const rule of section.logic) {
      const { condition, hide = [], show = [] } = rule;
      const fieldValue = watch(condition.field);

      let conditionMet = false;
      switch (condition.operator) {
        case "equals":
          conditionMet = fieldValue === condition.value;
          break;
        case "notEquals":
          conditionMet = fieldValue !== condition.value;
          break;
        case "contains":
          conditionMet =
            Array.isArray(fieldValue) && fieldValue.includes(condition.value);
          break;
        case "notContains":
          conditionMet =
            Array.isArray(fieldValue) && !fieldValue.includes(condition.value);
          break;
      }

      if (conditionMet) {
        if (hide.includes(questionId)) return false;
        if (show.includes(questionId)) return true;
      }
    }

    return true;
  };

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">{section.title}</h2>
        {section.description && (
          <p className="text-muted-foreground">{section.description}</p>
        )}
      </div>

      <div className="space-y-6">
        {section.questions.map((question) => {
          if (!getQuestionVisibility(question.id)) {
            return null;
          }

          return <QuestionField key={question.id} question={question} />;
        })}
      </div>
    </div>
  );
}
