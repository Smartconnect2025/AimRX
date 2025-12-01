import DefaultLayout from "@/components/layout/DefaultLayout";

export default function SymptomTrackerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DefaultLayout>{children}</DefaultLayout>;
}
