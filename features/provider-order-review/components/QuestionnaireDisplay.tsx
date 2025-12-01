"use client";

/**
 * Questionnaire Display Component
 * 
 * Displays patient questionnaire responses in organized accordion sections
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuestionnaireData } from "../types";
import { QuestionItem } from "./ui/QuestionItem";
import { QUESTIONNAIRE_QUESTIONS } from "../constants";
import { 
  formatArrayValue, 
  getQuestionDisplayLabel
} from "../utils";

interface QuestionnaireDisplayProps {
  questionnaireData?: QuestionnaireData;
}

export function QuestionnaireDisplay({ questionnaireData }: QuestionnaireDisplayProps) {
  if (!questionnaireData) {
    return (
      <Card className="mb-6 border-gray-100" id="questionnaire-section">
        <CardHeader>
          <CardTitle>Questionnaire Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">
            No questionnaire data available for this order
          </p>
        </CardContent>
      </Card>
    );
  }



  return (
    <Card className="mb-6 border-gray-100" id="questionnaire-section">
      <CardHeader>
        <CardTitle>Questionnaire Details</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Simple list display - no accordion needed for just 4 questions */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
            <QuestionItem
              label="Do you smoke?"
              value={getQuestionDisplayLabel(
                questionnaireData.smoke,
                QUESTIONNAIRE_QUESTIONS.GENERAL.SMOKING.options
              )}
            />
            <QuestionItem
              label="Do you drink alcohol?"
              value={getQuestionDisplayLabel(
                questionnaireData.alcohol,
                QUESTIONNAIRE_QUESTIONS.GENERAL.ALCOHOL.options
              )}
            />
            <QuestionItem
              label="Do you use recreational drugs? (e.g., marijuana, cocaine)"
              value={getQuestionDisplayLabel(
                questionnaireData.recreationalDrugs,
                QUESTIONNAIRE_QUESTIONS.GENERAL.RECREATIONAL_DRUGS.options
              )}
            />
            <QuestionItem
              label="Do you have any of the following heart problems?"
              value={formatArrayValue(questionnaireData.heartProblems)}
              className="md:col-span-2"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 