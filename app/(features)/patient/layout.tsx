import DefaultLayout from "@/components/layout/DefaultLayout";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DefaultLayout>{children}</DefaultLayout>;
}
