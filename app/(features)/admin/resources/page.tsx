/**
 * Admin Resources Page
 *
 * Dedicated page for managing educational resources.
 * Thin wrapper that imports and renders the ResourcesManagement feature component.
 */

import { ResourcesManagement } from "@/features/admin-dashboard";

export default function AdminResourcesPage() {
  return <ResourcesManagement />;
}
