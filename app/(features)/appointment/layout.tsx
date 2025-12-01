import DefaultLayout from "@/components/layout/DefaultLayout";

export default function AppointmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DefaultLayout>{children}</DefaultLayout>;
}
