/**
 * Provider Order Management Types
 *
 * Type definitions for provider dashboard and order management functionality.
 */

export interface ProviderOrder {
  id: string;
  order_number: string;
  created_at: string;
  user_id: string;
  patient_name: string;
  patient_email?: string;
  shipping_address: {
    first_name: string;
    last_name: string;
    address: string;
    city: string;
    state: string;
    postal_code: string;
    phone_number: string;
  };
  line_items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  quantity: number; // Total quantity of items
  status: ProviderOrderStatus;
  review_status: ReviewStatus;
  activities: {
    status: string;
    date: string;
  }[];
  reviewed_by?: string;
  review_started_at?: string;
  is_locked?: boolean;
  locked_by?: string;
  locked_at?: string;
}

export type ProviderOrderStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";

export type ReviewStatus =
  | "not_started"
  | "in_review"
  | "approved"
  | "rejected";

export interface ProviderDashboardFilters {
  search?: string;
  page: number;
  pageSize: number;
  status?: ProviderOrderStatus;
  reviewStatus?: ReviewStatus;
}

export interface ProviderDashboardData {
  orders: ProviderOrder[];
  totalOrders: number;
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
  error?: string;
}

export interface ProviderLicenseInfo {
  licensedState: string | null;
  fullStateName: string | null;
}

export interface ProviderOrderDashboardProps {
  className?: string;
}

export interface OrderTableProps {
  orders: ProviderOrder[];
  isLoading: boolean;
  onReviewOrder: (orderId: string) => void;
}

export interface OrderCardProps {
  order: ProviderOrder;
  onReviewOrder: (orderId: string) => void;
}

export interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
  isLoading?: boolean;
}

export interface LicensedStateAlertProps {
  licenseInfo: ProviderLicenseInfo;
  hasError?: boolean;
}

export interface OrderPaginationProps {
  currentPage: number;
  totalPages: number;
  searchQuery?: string;
  onPageChange: (page: number) => void;
}
