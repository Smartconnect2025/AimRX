import DefaultLayout from "@/components/layout/DefaultLayout";

export default function LabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DefaultLayout>{children}</DefaultLayout>;
}
