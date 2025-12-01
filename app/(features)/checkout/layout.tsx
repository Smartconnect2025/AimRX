import DefaultLayout from "@/components/layout/DefaultLayout";

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DefaultLayout>{children}</DefaultLayout>;
}
