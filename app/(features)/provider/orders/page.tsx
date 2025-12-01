/**
 * Provider Orders Management Page
 * 
 * Provider order review and management interface.
 * Thin wrapper that imports and renders the ProviderOrderDashboard feature component.
 */

import { ProviderOrderDashboard } from "@/features/provider-order-management";

export default function ProviderOrdersPage() {
  return <ProviderOrderDashboard />;
} 