import { Metadata } from "next";
import { MedicationQuestionnaire } from "@/features/medication-questionnaire/MedicationQuestionnaire";

export const metadata: Metadata = {
  title: "Medical Questionnaire | TFA Components",
  description: "Complete medical questionnaire for safe medication therapy",
};

export default function Page() {
  return <MedicationQuestionnaire />;
} 