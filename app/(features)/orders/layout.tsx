import DefaultLayout from "@/components/layout/DefaultLayout";

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DefaultLayout>{children}</DefaultLayout>;
}
