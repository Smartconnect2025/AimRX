/**
 * Provider Order Management Feature Exports
 * 
 * Main barrel file for the provider order management feature.
 */

// Main component
export { ProviderOrderDashboard } from "./components/ProviderOrderDashboard";

// Individual components
export { 
  OrderTable, 
  OrderCard, 
  SearchBar, 
  LicensedStateAlert, 
  OrderPagination 
} from "./components";

// Hooks
export { useProviderOrders } from "./hooks";

// Services
export { providerOrderService } from "./services/providerOrderService";

// Types
export type {
  ProviderOrder,
  ProviderOrderStatus,
  ReviewStatus,
  ProviderDashboardFilters,
  ProviderDashboardData,
  ProviderLicenseInfo,
  ProviderOrderDashboardProps,
  OrderTableProps,
  OrderCardProps,
  SearchBarProps,
  LicensedStateAlertProps,
  OrderPaginationProps
} from "./types";

// Constants
export {
  ORDER_STATUSES,
  REVIEW_STATUSES,
  PAGINATION_CONFIG,
  SEARCH_CONFIG,
  ORDER_STATUS_STYLES,
  REVIEW_STATUS_STYLES,
  US_STATES
} from "./constants";

// Utilities
export {
  formatOrderDate,
  formatOrderDateTime,
  getOrderStatusClassName,
  getReviewStatusClassName,
  getStateName,
  formatPatientName,
  calculateTotalQuantity,
  searchMatches,
  parseSearchQuery,
  generatePaginationPages,
  debounce,
  isOrderLocked,
  formatLockInfo
} from "./utils"; 