import { IntakeLayout } from "@/features/intake";

export default function IntakeSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <IntakeLayout>{children}</IntakeLayout>;
}
