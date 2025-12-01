/**
 * Admin Products Page
 *
 * Dedicated page for managing products and categories.
 * Thin wrapper that imports and renders the ProductsManagement feature component.
 */

import { Suspense } from "react";
import { ProductsManagement } from "@/features/admin-dashboard";

export default function AdminProductsPage() {
  return (
    <Suspense>
      <ProductsManagement />
    </Suspense>
  );
}
