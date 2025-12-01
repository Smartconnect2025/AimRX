import { MedicationRequirement } from "./types";

// Define medication requirements based on product categories and specific medications
export const medicationRequirements: Record<string, MedicationRequirement> = {
  // Weight loss medications
  "orlistat": {
    productId: "orlistat",
    requiresPregnancyQuestions: true,
    requiresWeightLossQuestions: true,
    specificWarnings: [
      "May cause digestive side effects",
      "Not suitable for people with chronic malabsorption syndrome"
    ]
  },
  "garcinia-cambogia-extract": {
    productId: "garcinia-cambogia-extract",
    requiresPregnancyQuestions: true,
    requiresWeightLossQuestions: true,
    specificWarnings: [
      "May interact with diabetes medications",
      "Not recommended during pregnancy or breastfeeding"
    ]
  },
  "green-tea-extract": {
    productId: "green-tea-extract",
    requiresPregnancyQuestions: true,
    requiresWeightLossQuestions: true,
    specificWarnings: [
      "Contains caffeine - may cause jitters or sleep issues",
      "May affect blood sugar levels"
    ]
  },
  "raspberry-ketones": {
    productId: "raspberry-ketones",
    requiresPregnancyQuestions: true,
    requiresWeightLossQuestions: true,
    specificWarnings: [
      "Limited clinical research available",
      "May interact with stimulant medications"
    ]
  },
  "chromium-picolinate": {
    productId: "chromium-picolinate",
    requiresPregnancyQuestions: true,
    requiresWeightLossQuestions: true,
    specificWarnings: [
      "May affect blood sugar levels",
      "Not suitable for people with kidney or liver disease"
    ]
  }
};

/**
 * Check if a product requires a medical questionnaire
 */
export function needsQuestionnaire(productId: string): boolean {
  return productId in medicationRequirements;
}

/**
 * Get questionnaire requirements for a specific product
 */
export function getQuestionnaireRequirements(productId: string): MedicationRequirement | null {
  return medicationRequirements[productId] || null;
}

/**
 * Check if any items in the cart require a questionnaire
 */
export function cartRequiresQuestionnaire(cartItems: Array<{ productId: string }>): boolean {
  return cartItems.some(item => needsQuestionnaire(item.productId));
}

/**
 * Get all medications from cart that require questionnaires
 */
export function getMedicationsRequiringQuestionnaire(
  cartItems: Array<{ productId: string; name: string; category?: string }>
) {
  return cartItems
    .filter(item => needsQuestionnaire(item.productId))
    .map(item => ({
      id: item.productId,
      name: item.name,
      category: item.category || "medication",
      requirements: getQuestionnaireRequirements(item.productId)!
    }));
}

/**
 * Determine which question sections are needed based on medications
 */
export function getRequiredQuestionSections(medications: Array<{ id: string }>) {
  const requirements = medications
    .map(med => getQuestionnaireRequirements(med.id))
    .filter(Boolean) as MedicationRequirement[];

  return {
    requiresPregnancyQuestions: requirements.some(req => req.requiresPregnancyQuestions),
    requiresWeightLossQuestions: requirements.some(req => req.requiresWeightLossQuestions),
    allWarnings: requirements.flatMap(req => req.specificWarnings || [])
  };
}

/**
 * Check if user has completed questionnaire for specific medications
 * This would typically check against a database or localStorage
 */
export function hasCompletedQuestionnaire(
  userId: string | null, 
  medicationIds: string[]
): boolean {
  // For now, check localStorage (in production, this would be a database call)
  if (!userId) return false;
  
  try {
    const completed = localStorage.getItem(`questionnaire_${userId}`);
    if (!completed) return false;
    
    const completedMedications = JSON.parse(completed);
    return medicationIds.every(id => completedMedications.includes(id));
  } catch {
    return false;
  }
}

/**
 * Mark questionnaire as completed for specific medications
 */
export function markQuestionnaireCompleted(
  userId: string,
  medicationIds: string[]
): void {
  try {
    const existing = localStorage.getItem(`questionnaire_${userId}`);
    const completedMedications = existing ? JSON.parse(existing) : [];
    
    const updated = [...new Set([...completedMedications, ...medicationIds])];
    localStorage.setItem(`questionnaire_${userId}`, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save questionnaire completion:", error);
  }
} 