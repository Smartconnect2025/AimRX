/**
 * Provider Order Review Utils
 * 
 * Utility functions for data formatting, validation, and display
 */

import { format } from "date-fns";
import { US_STATES } from "./constants";

/**
 * Format a value for display, handling various data types
 */
export function formatDisplayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "-";
  }
  
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  
  return String(value);
}

/**
 * Format an array of values for display
 */
export function formatArrayValue(
  value: string[] | undefined, 
  separator: string = ", ",
  emptyText: string = "-"
): string {
  if (!value || !Array.isArray(value) || value.length === 0) {
    return emptyText;
  }
  return value.join(separator);
}

/**
 * Format a date string for display
 */
export function formatDate(dateString: string | undefined): string {
  if (!dateString) return "-";
  
  try {
    const date = new Date(dateString);
    return format(date, "MM/dd/yyyy");
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
}

/**
 * Format a date with time for display
 */
export function formatDateTime(dateString: string): string {
  if (!dateString) return "-";
  
  try {
    const date = new Date(dateString);
    return format(date, "MM/dd/yyyy h:mm:ss a");
  } catch (error) {
    console.error("Error formatting datetime:", error);
    return dateString;
  }
}

/**
 * Get full state name from state code
 */
export function getStateName(stateCode: string): string {
  if (!stateCode) return "-";
  const state = US_STATES.find((state) => state.value === stateCode);
  return state ? state.label : stateCode;
}

/**
 * Format height from feet and inches
 */
export function formatHeight(feet?: number, inches?: number): string {
  if (!feet) return "-";
  const inchesDisplay = inches || 0;
  return `${feet}' ${inchesDisplay}"`;
}

/**
 * Format weight with units
 */
export function formatWeight(weight?: number): string {
  if (!weight) return "-";
  return `${weight} lbs`;
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone?: string): string {
  if (!phone) return "-";
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, "");
  
  // Format as (XXX) XXX-XXXX if we have 10 digits
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  return phone;
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/**
 * Get display label for a questionnaire value
 */
export function getQuestionDisplayLabel(
  value: string | undefined,
  options?: Array<{ value: string; label: string }>
): string {
  if (!value) return "-";
  
  if (!options) return value;
  
  const option = options.find(opt => opt.value === value);
  return option ? option.label : value;
}

/**
 * Safe accessor for nested questionnaire data
 */
export function getQuestionnaireValue(
  data: Record<string, unknown>,
  path: string,
  defaultValue: unknown = undefined
): unknown {
  if (!data) return defaultValue;

  const parts = path.split(".");
  let current = data as Record<string, unknown>;

  for (let i = 0; i < parts.length; i++) {
    if (current === undefined || current === null) return defaultValue;

    // Handle array indexing
    if (parts[i].includes("[")) {
      const [name, indexStr] = parts[i].split("[");
      const index = parseInt(indexStr.replace("]", ""));

      const arrayValue = current[name] as unknown[];
      if (!arrayValue || !Array.isArray(arrayValue)) return defaultValue;
      current = arrayValue[index] as Record<string, unknown>;
    } else {
      // Check for flattened notation
      if (i < parts.length - 1 && current[parts[i]] === undefined) {
        // Try the flattened version
        const flatKey = parts.slice(i).join(".");
        if (current[flatKey] !== undefined) return current[flatKey];
        return defaultValue;
      }

      current = current[parts[i]] as Record<string, unknown>;
    }
  }

  return current !== undefined ? current : defaultValue;
}

/**
 * Validate order ID format
 */
export function isValidOrderId(id: string): boolean {
  // Order IDs should be numeric strings (like "100064")
  return /^\d+$/.test(id);
} 