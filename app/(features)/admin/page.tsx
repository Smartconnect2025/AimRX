/**
 * Admin Dashboard Page
 *
 * Main admin dashboard page with administrative tools and overview.
 * Thin wrapper that imports and renders the AdminDashboard feature component.
 */

import { AdminDashboard } from "@/features/admin-dashboard";

export default function AdminPage() {
  return <AdminDashboard />;
}
