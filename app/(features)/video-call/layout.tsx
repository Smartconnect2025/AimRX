import DefaultLayout from "@/components/layout/DefaultLayout";

export default function VideoCallLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DefaultLayout>{children}</DefaultLayout>;
}
