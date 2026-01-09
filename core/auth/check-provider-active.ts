/**
 * Provider Active Status Check
 * Helper function to check if a provider is active in API routes
 */

import { createServerClient } from "@/core/supabase/server";

/**
 * Check if a provider user is active
 * @param userId - The user ID to check
 * @returns true if provider is active, false if inactive or not found
 */
export async function checkProviderActive(userId: string): Promise<boolean> {
  try {
    const supabase = await createServerClient();

    // Query database to check is_active status
    const { data: provider, error } = await supabase
      .from("providers")
      .select("is_active")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error checking provider active status:", error);
      // On error, allow access to avoid blocking legitimate users
      return true;
    }

    if (!provider) {
      // Provider record doesn't exist yet (new provider)
      // Allow access so they can complete setup
      return true;
    }

    // Return the is_active status (defaults to true if null/undefined)
    return provider.is_active !== false;
  } catch (error) {
    console.error("Error checking provider active status:", error);
    // On error, allow access to avoid blocking legitimate users
    return true;
  }
}
