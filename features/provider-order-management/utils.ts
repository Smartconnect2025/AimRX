/**
 * Provider Order Management Utilities
 *
 * Utility functions for formatting dates, handling statuses, and other helpers.
 */

import { format } from "date-fns";
import {
  ORDER_STATUS_STYLES,
  REVIEW_STATUS_STYLES,
  US_STATES,
} from "./constants";
import { ProviderOrderStatus, ReviewStatus } from "./types";
import { cn } from "@/utils/tailwind-utils";

/**
 * Format a date string for display in the dashboard
 */
export function formatOrderDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return format(date, "M/d/yyyy");
  } catch {
    return "Invalid Date";
  }
}

/**
 * Format a date string for display with time
 */
export function formatOrderDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return format(date, "M/d/yyyy h:mm a");
  } catch {
    return "Invalid Date";
  }
}

/**
 * Get CSS classes for order status styling
 */
export function getOrderStatusClassName(status: ProviderOrderStatus): string {
  const baseClasses =
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border";
  const statusClasses =
    ORDER_STATUS_STYLES[status] || "bg-gray-100 text-gray-800 border-gray-200";
  return cn(baseClasses, statusClasses);
}

/**
 * Get CSS classes for review status styling
 */
export function getReviewStatusClassName(status: ReviewStatus): string {
  const baseClasses =
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border";
  const statusClasses =
    REVIEW_STATUS_STYLES[status] || "bg-gray-100 text-gray-800 border-gray-200";
  return cn(baseClasses, statusClasses);
}

/**
 * Get full state name from state code
 */
export function getStateName(stateCode: string | null): string {
  if (!stateCode) return "";
  const state = US_STATES.find((state) => state.value === stateCode);
  return state ? state.label : stateCode;
}

/**
 * Format patient name for display (first name + last initial)
 */
export function formatPatientName(
  firstName: string,
  lastName: string,
  fullName = false,
): string {
  if (!firstName && !lastName) return "Unknown";

  if (fullName) {
    return `${firstName} ${lastName}`.trim();
  }

  // For privacy, show first name + last initial
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : "";
  return `${firstName} ${lastInitial}`.trim();
}

/**
 * Calculate total quantity from line items
 */
export function calculateTotalQuantity(
  lineItems: { quantity: number }[],
): number {
  return lineItems.reduce((total, item) => total + (item.quantity || 0), 0);
}

/**
 * Check if search query matches order data
 */
export function searchMatches(
  searchQuery: string,
  order: {
    order_number: string;
    patient_name: string;
    created_at: string;
  },
): boolean {
  if (!searchQuery) return true;

  const query = searchQuery.toLowerCase().trim();

  // Check order number (exact match)
  if (order.order_number.toLowerCase().includes(query)) return true;

  // Check patient name
  if (order.patient_name.toLowerCase().includes(query)) return true;

  // Check date (MM/DD/YYYY format)
  const formattedDate = formatOrderDate(order.created_at);
  if (formattedDate.includes(query)) return true;

  return false;
}

/**
 * Parse search query to determine search type
 */
export function parseSearchQuery(query: string): {
  type: "id" | "date" | "text";
  value: string;
} {
  const trimmedQuery = query.trim();

  // Check if it's a numeric ID
  if (/^\d+$/.test(trimmedQuery)) {
    return { type: "id", value: trimmedQuery };
  }

  // Check if it's a date (MM/DD/YYYY format)
  const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
  if (dateRegex.test(trimmedQuery)) {
    return { type: "date", value: trimmedQuery };
  }

  // Default to text search
  return { type: "text", value: trimmedQuery };
}

/**
 * Generate pagination page numbers to display
 */
export function generatePaginationPages(
  currentPage: number,
  totalPages: number,
  maxPages = 5,
): number[] {
  if (totalPages <= maxPages) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const halfMax = Math.floor(maxPages / 2);
  let start = Math.max(1, currentPage - halfMax);
  const end = Math.min(totalPages, start + maxPages - 1);

  // Adjust start if we're near the end
  if (end - start + 1 < maxPages) {
    start = Math.max(1, end - maxPages + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/**
 * Debounce function for search input
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Check if an order is locked for review
 */
export function isOrderLocked(order: {
  is_locked?: boolean;
  locked_by?: string;
  locked_at?: string;
}): boolean {
  return Boolean(order.is_locked && order.locked_by && order.locked_at);
}

/**
 * Format order lock information for display
 */
export function formatLockInfo(order: {
  is_locked?: boolean;
  locked_by?: string;
  locked_at?: string;
}): string | null {
  if (!isOrderLocked(order)) return null;

  const lockedAt = order.locked_at
    ? formatOrderDateTime(order.locked_at)
    : "Unknown time";
  return `Locked by ${order.locked_by} at ${lockedAt}`;
}
