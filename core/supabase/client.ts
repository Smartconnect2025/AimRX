/**
 * Supabase Client Module
 *
 * Creates and provides a Supabase client for browser/client-side operations.
 */
import { createBrowserClient } from "@supabase/ssr";
import { envConfig } from "@core/config";

/**
 * Create a Supabase client for client-side usage
 *
 * Uses sessionStorage instead of localStorage to allow different users
 * to be logged in simultaneously in different tabs/windows.
 *
 * @returns A Supabase client instance configured for browser environments
 */
export function createClient() {
  return createBrowserClient(
    envConfig.NEXT_PUBLIC_SUPABASE_URL,
    envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        storage: typeof window !== "undefined" ? window.sessionStorage : undefined,
        storageKey: "supabase.auth.token",
        flowType: "pkce",
      },
    }
  );
}
