// Video call utility functions

/**
 * Generates a video call URL for an appointment or booking
 * @param id - The appointment or booking ID
 * @returns A formatted video call URL relative to the current host
 */
export const generateVideoCallUrl = (id: string): string => {
  // Ensure id is a valid string and not empty
  if (typeof id !== "string" || id.trim() === "") {
    console.error("generateVideoCallUrl: Invalid or empty ID provided.");
    return "/appointment/invalid-id"; // Or handle error as appropriate
  }
  return `/appointment/${id.trim()}`;
};

/**
 * Generates a video call URL with additional parameters
 * @param id - The appointment or booking ID
 * @param options - Additional options for the video call
 * @returns A formatted video call URL with parameters, relative to the current host
 */
export const generateVideoCallUrlWithOptions = (
  id: string,
  options?: {
    providerId?: string;
    patientId?: string;
    type?: string;
  },
): string => {
  const baseUrl = generateVideoCallUrl(id); // This will now be a relative path

  if (!options) return baseUrl;

  const params = new URLSearchParams();

  if (options.providerId) params.append("provider", options.providerId);
  if (options.patientId) params.append("patient", options.patientId);
  if (options.type) params.append("type", options.type);

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

/**
 * Validates if a video call URL is valid (based on the new relative path structure)
 * @param url - The URL to validate
 * @returns Boolean indicating if the URL is valid
 */
export const isValidVideoCallUrl = (url: string): boolean => {
  if (typeof url !== "string") return false;
  // Check if it starts with /appointment/ and has something after it
  return url.startsWith("/appointment/") && url.length > "/appointment/".length;
};
