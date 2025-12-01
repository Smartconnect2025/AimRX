import DefaultLayout from "@/components/layout/DefaultLayout";

export default function TestQuestionnaireLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DefaultLayout>{children}</DefaultLayout>;
}
