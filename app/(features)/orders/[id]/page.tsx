import { OrderDetailPage } from "@/features/orders";

interface OrderDetailPageWrapperProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPageWrapper({
  params,
}: OrderDetailPageWrapperProps) {
  const { id } = await params;
  
  return <OrderDetailPage orderId={id} />;
} 