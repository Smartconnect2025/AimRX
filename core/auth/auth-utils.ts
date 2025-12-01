/**
 * Authentication Utilities
 *
 * Contains helper functions for user authentication and JWT processing.
 */
import { User, SupabaseClient } from "@supabase/supabase-js";

/**
 * Serialize user data consistently for client-side use
 *
 * Creates a safe subset of user data to pass to the client
 *
 * @param user - Supabase User object or null
 * @returns A serialized user object with only safe fields or null
 */
export function serializeUser(user: User | null) {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
  };
}

/**
 * Type for serialized user data
 */
export type SerializedUser = ReturnType<typeof serializeUser>;

/**
 * Fetch user role from database when JWT claims don't contain it
 *
 * @param userId - The user's ID
 * @param supabase - Supabase client instance (browser or server)
 * @returns The user role string or null if not found
 */
export async function fetchUserRoleFromDatabase(
  userId: string,
  supabase: SupabaseClient,
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (error) {
      // No record found or other error - default to "user"
      return "user";
    }

    const role = data?.role || "user";
    return role;
  } catch {
    return "user";
  }
}

/**
 * Get user role from the database
 *
 * @param userId - The user's ID for database fallback
 * @param supabase - Supabase client instance (browser or server)
 * @returns The user role string or null if not found
 */
export async function getUserRole(
  userId: string | undefined,
  supabase: SupabaseClient,
): Promise<string | null> {
  // Fallback to database if JWT doesn't contain role and we have userId
  if (userId) {
    return await fetchUserRoleFromDatabase(userId, supabase);
  }

  return "user";
}

/**
 * Shared auth result type used across components
 */
export interface AuthResult {
  user: SerializedUser;
  userRole: string | null;
}
