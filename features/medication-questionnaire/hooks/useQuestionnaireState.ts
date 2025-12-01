"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/features/cart/hooks/useCart";

import type { MedicationQuestionnaireData } from "../types";

export function useQuestionnaireState() {
  const { items: cartItems } = useCart();
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Check if questionnaire is required for current cart items (weight loss medications)
  const requiresQuestionnaire = cartItems.some(
    (item) => item.category_name === "WEIGHT LOSS",
  );

  // Get weight loss medications that need questionnaires
  const questionnairedMedications = cartItems
    .filter((item) => item.category_name === "WEIGHT LOSS")
    .map((item) => ({
      id: item.slug,
      name: item.name,
      category: item.category_name || "medication",
    }));

  // Check if user has completed questionnaire (simple localStorage check)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const questionnaireCompleted = localStorage.getItem(
        "questionnaireCompleted",
      );
      setIsCompleted(!!questionnaireCompleted);
    }
  }, [cartItems]);

  const handleStartQuestionnaire = () => {
    setShowQuestionnaire(true);
  };

  const handleCompleteQuestionnaire = async (
    data: MedicationQuestionnaireData,
  ) => {
    try {
      // In production, this would save to database
      console.log("Questionnaire completed:", data);

      // Mark as completed in localStorage using simple flag
      localStorage.setItem("questionnaireCompleted", "true");

      setIsCompleted(true);
      setShowQuestionnaire(false);

      return Promise.resolve();
    } catch (error) {
      console.error("Failed to save questionnaire:", error);
      return Promise.reject(error);
    }
  };

  const handleCancelQuestionnaire = () => {
    setShowQuestionnaire(false);
  };

  // Check if checkout should be blocked
  const shouldBlockCheckout = requiresQuestionnaire && !isCompleted;

  return {
    // State
    showQuestionnaire,
    isCompleted,
    requiresQuestionnaire,
    shouldBlockCheckout,
    questionnairedMedications,

    // Actions
    handleStartQuestionnaire,
    handleCompleteQuestionnaire,
    handleCancelQuestionnaire,
  };
}
