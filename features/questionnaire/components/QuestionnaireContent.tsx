"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { useRouter } from "next/navigation";
import { QuestionnaireConfig } from "../types";
import { QuestionnaireSection } from "./QuestionnaireSection";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuestionnaire } from "../context/QuestionnaireContext";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";

interface QuestionnaireContentProps {
  config: QuestionnaireConfig;
}

export function QuestionnaireContent({ config }: QuestionnaireContentProps) {
  const router = useRouter();
  const { currentStep, actions, isComplete } = useQuestionnaire();
  const methods = useFormContext();
  const totalSteps = config.sections.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const currentSection = config.sections[currentStep];

  const handleNext = async () => {
    // Get current section's questions
    const currentSectionQuestions = currentSection.questions.map((q) => q.id);

    // Only validate current section's fields
    const isValid = await methods.trigger(currentSectionQuestions);

    if (!isValid) {
      return;
    }

    if (currentStep === totalSteps - 1) {
      // This is the last step
      try {
        const formData = methods.getValues();
        await actions.save();

        // Transform form data into the expected format
        const questionnaireData = {
          id: config.id,
          responses: formData,
          metadata: {
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            lastUpdatedAt: new Date().toISOString(),
            version: "1.0.0",
          },
        };

        // Call the onComplete handler from config
        await config.navigation.onComplete(questionnaireData);

        // Show success message
        toast.success(`${config.title} completed successfully`);

        // Small delay before redirect to allow toast to show
        setTimeout(() => {
          router.push("/patient/dashboard");
        }, 1500);
      } catch (error) {
        console.error("Failed to save questionnaire:", error);
        toast.error("Failed to save questionnaire");
      }
    } else {
      actions.next();
    }
  };

  const handleCancel = () => {
    router.push("/patient/dashboard");
  };

  if (isComplete) {
    // If questionnaire is complete, redirect immediately
    router.push("/patient/dashboard");
    return null;
  }

  return (
    <Card className="flex flex-col min-h-[600px] max-w-2xl p-6 m-5">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">{config.title}</h1>
        {config.description && (
          <p className="text-muted-foreground">{config.description}</p>
        )}
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span>
            Step {currentStep + 1} of {totalSteps}
          </span>
          <span>{currentSection.title}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Current Section */}
      <div className="flex-grow">
        <QuestionnaireSection section={currentSection} />
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6 pt-6 border-t border-border">
        <Button
          variant="outline"
          onClick={actions.back}
          disabled={currentStep === 0}
          className="border border-border"
        >
          Back
        </Button>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="border border-border">
                Cancel
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white border border-border">
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel questionnaire?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to cancel? Your progress will not be
                  saved.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border border-border hover:bg-secondary rounded-lg">
                  No, continue
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancel}
                  className="bg-destructive text-white hover:bg-destructive/90 rounded-lg"
                >
                  Yes, cancel
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={handleNext}>
            {currentStep === totalSteps - 1 ? "Complete" : "Next"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
