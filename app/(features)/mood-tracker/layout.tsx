import DefaultLayout from "@/components/layout/DefaultLayout";

export default function MoodTrackerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DefaultLayout>{children}</DefaultLayout>;
}
