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
 * Uses cookies for session storage to ensure compatibility with SSR middleware.
 * This allows the session to be shared between client and server components.
 *
 * @returns A Supabase client instance configured for browser environments
 */
export function createClient() {
  return createBrowserClient(
    envConfig.NEXT_PUBLIC_SUPABASE_URL,
    envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
