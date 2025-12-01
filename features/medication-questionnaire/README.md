# Medication Questionnaire Feature

## Overview

This feature provides a medical questionnaire system for users subscribing to medications for the first time. It ensures safe medication dispensing by collecting comprehensive medical history and medication-specific information.

## Components

- **MedicationQuestionnaireModal**: Main modal component for the questionnaire
- **QuestionnaireForm**: Multi-step form for medical information collection
- **MedicationSpecificQuestions**: Dynamic questions based on the medication being prescribed

## Integration

- Triggers before checkout for first-time medication subscribers
- Blocks checkout process if questionnaire is incomplete
- Integrates with cart system to identify medications requiring questionnaires

## Question Categories

1. **General Medical History** (reused from intake):
   - Current medical conditions
   - Current medications
   - Drug allergies

2. **Medication-Specific Questions** (new):
   - Pregnancy/breastfeeding status (for weight loss medications)
   - Previous experience with similar medications
   - Current symptoms and goals
   - Contraindication screening

## Usage

```tsx
import { MedicationQuestionnaireModal } from "@/features/medication-questionnaire";

// Check if questionnaire is required before checkout
const requiresQuestionnaire = cartItems.some(item => 
  needsQuestionnaire(item.productId)
);

// Show modal if required
<MedicationQuestionnaireModal 
  open={showQuestionnaire}
  medications={cartMedications}
  onComplete={() => handleComplete()}
  onCancel={() => handleCancel()}
/>
``` 