/**
 * Provider Dashboard Page
 * 
 * Main provider dashboard with sessions and availability management.
 * Thin wrapper that imports and renders the ProviderDashboard feature component.
 */

import { ProviderDashboard } from "@/features/provider-dashboard";

export default function ProviderPage() {
  return <ProviderDashboard />;
} 