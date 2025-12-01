/**
 * Provider Order Management Constants
 *
 * Constants for order statuses, pagination, and other configuration values.
 */

import { ProviderOrderStatus, ReviewStatus } from "./types";

export const ORDER_STATUSES: ProviderOrderStatus[] = [
  "pending",
  "approved",
  "rejected",
  "cancelled",
];

export const REVIEW_STATUSES: ReviewStatus[] = [
  "not_started",
  "in_review",
  "approved",
  "rejected",
];

export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 50,
  PAGES_TO_SHOW: 5, // Number of page buttons to show in pagination
} as const;

export const SEARCH_CONFIG = {
  DEBOUNCE_DELAY: 300, // ms
  MIN_SEARCH_LENGTH: 2,
  PLACEHOLDER: "Search patients or orders",
} as const;

export const ORDER_STATUS_STYLES: Record<ProviderOrderStatus, string> = {
  pending: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  approved: "bg-green-500/10 text-green-700 border-green-500/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export const REVIEW_STATUS_STYLES: Record<ReviewStatus, string> = {
  not_started: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  in_review: "bg-orange-500/10 text-orange-700 border-orange-500/20",
  approved: "bg-green-500/10 text-green-700 border-green-500/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

export const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
] as const;
