/**
 * Provider Order Review Page
 * 
 * Dynamic route for reviewing individual orders
 */

import { ProviderOrderReviewPage } from "@/features/provider-order-review";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProviderOrderReviewRoute({ params }: PageProps) {
  const { id } = await params;
  
  return <ProviderOrderReviewPage orderId={id} />;
} 