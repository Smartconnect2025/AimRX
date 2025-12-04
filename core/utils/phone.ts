/**
 * Formats a phone number as the user types
 * Takes raw digits and formats them as +1 (555) 123-4567
 *
 * @param value - The input value (can include any characters)
 * @returns Formatted phone number string
 */
export function formatPhoneNumber(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');

  // If empty, return empty string
  if (digits.length === 0) {
    return '';
  }

  // Take only the first 10 digits (US phone number)
  const truncated = digits.slice(0, 10);

  // Format based on how many digits we have
  if (truncated.length <= 3) {
    return `+1 (${truncated}`;
  } else if (truncated.length <= 6) {
    return `+1 (${truncated.slice(0, 3)}) ${truncated.slice(3)}`;
  } else {
    return `+1 (${truncated.slice(0, 3)}) ${truncated.slice(3, 6)}-${truncated.slice(6)}`;
  }
}

/**
 * Extracts just the digits from a formatted phone number
 * Useful for storing in database
 *
 * @param formatted - The formatted phone number
 * @returns Just the 10 digits
 */
export function extractPhoneDigits(formatted: string): string {
  return formatted.replace(/\D/g, '').slice(0, 10);
}
