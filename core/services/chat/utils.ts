/**
 * CometChat Utility Functions
 *
 * Reusable utilities for CometChat operations across the application.
 */

/**
 * Generate a display name from an email address
 * @param email - The email address
 * @returns A formatted display name
 */
export function generateDisplayNameFromEmail(email: string): string {
  if (!email) return "User";

  // Get the part before @
  const localPart = email.split("@")[0];

  // Split by dots, underscores, hyphens, AND plus signs, then capitalize each part
  return localPart
    .split(/[._+-]+/) // Split by one or more of these characters (added + to the list)
    .filter((part) => part.length > 0) // Remove empty strings
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Generate a display name from user data (prioritizes full name over email)
 * @param user - User object with potential name fields
 * @returns A formatted display name
 */
export function generateDisplayNameFromUser(user: {
  first_name?: string;
  last_name?: string;
  name?: string;
  email?: string;
}): string {
  // Priority: full name > name > email > fallback
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }
  if (user.name) {
    return user.name;
  }
  if (user.email) {
    return generateDisplayNameFromEmail(user.email);
  }
  return "User";
}

/**
 * Validate and clean a display name
 * @param name - The display name to validate
 * @returns A cleaned display name or fallback
 */
export function validateDisplayName(name: string): string {
  if (!name || typeof name !== "string") return "User";

  const cleaned = name.trim();
  if (cleaned.length === 0) return "User";
  if (cleaned.length > 50) return cleaned.substring(0, 50); // Limit length

  return cleaned;
}

/**
 * Sanitize a name for CometChat compatibility
 * Removes special characters that CometChat might reject
 * @param name - The name to sanitize
 * @returns A sanitized name safe for CometChat
 */
export function sanitizeNameForCometChat(name: string): string {
  if (!name || typeof name !== "string") return "User";

  // Remove or replace special characters that CometChat typically rejects
  // Allow: letters, numbers, spaces, hyphens, apostrophes
  // Remove: + = & % # @ ! * ( ) [ ] { } < > ; : ? / \ | ` ~ " and other special chars
  let sanitized = name
    .replace(/[+=%#@!*()\[\]{}<>;:?/\\|`~"]/g, "") // Remove special chars
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .trim();

  // If result is empty after sanitization, use fallback
  if (sanitized.length === 0) return "User";

  // Limit length to 50 characters
  if (sanitized.length > 50) {
    sanitized = sanitized.substring(0, 50).trim();
  }

  return sanitized;
}

/**
 * Validate CometChat configuration
 * @returns True if all required environment variables are set
 */
export function isCometChatConfigured(): boolean {
  const requiredVars = [
    process.env.NEXT_PUBLIC_COMETCHAT_APP_ID,
    process.env.NEXT_PUBLIC_COMETCHAT_REGION,
    process.env.NEXT_PUBLIC_COMETCHAT_AUTH_KEY,
  ];

  return requiredVars.every((value) => value && value.trim() !== "");
}

/**
 * Get CometChat configuration for debugging
 * @returns Configuration object (without sensitive data)
 */
export function getCometChatConfig() {
  return {
    appId: process.env.NEXT_PUBLIC_COMETCHAT_APP_ID,
    region: process.env.NEXT_PUBLIC_COMETCHAT_REGION,
    authKeyExists: !!process.env.NEXT_PUBLIC_COMETCHAT_AUTH_KEY,
    isConfigured: isCometChatConfigured(),
  };
}
