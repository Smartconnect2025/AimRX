import { Metadata } from "next";
import { QuestionnaireExample } from "@/features/questionnaire/example/QuestionnaireExample";

export const metadata: Metadata = {
  title: "Medical Questionnaire | TFA Components",
  description: "Complete medical questionnaire for safe medication therapy",
};

export default function Page() {
  return <QuestionnaireExample />;
}
