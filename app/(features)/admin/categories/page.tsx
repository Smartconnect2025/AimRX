/**
 * Admin Categories Page
 *
 * Dedicated page for managing product categories.
 * Thin wrapper that imports and renders the CategoriesManagement feature component.
 */

import { Suspense } from "react";
import { CategoriesManagement } from "@/features/admin-dashboard";

export default function AdminCategoriesPage() {
  return (
    <Suspense>
      <CategoriesManagement />
    </Suspense>
  );
}
