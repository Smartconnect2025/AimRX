/**
 * Admin Dashboard Feature
 * Exports all components, types, and utilities for the admin dashboard feature
 */

// Export main components
export { AdminDashboard } from "./AdminDashboard";

// Export reusable components
export { MetricCard } from "./components/MetricCard";
export { PatientsManagement } from "./components/PatientsManagement";
export { ProvidersManagement } from "./components/ProvidersManagement";
export { ResourcesManagement } from "./components/ResourcesManagement";
export { TagsManagement } from "./components/TagsManagement";
export { ProductsManagement } from "./components/ProductsManagement";
export { CategoriesManagement } from "./components/CategoriesManagement";

// Export hooks
export { useAdminDashboard } from "./hooks/useAdminDashboard";

// Export services
export {
  getDashboardMetrics,
  getMonthlyComparison,
} from "./services/adminService";

// Export utils
export * from "./utils";

// Export types
export * from "./types";
