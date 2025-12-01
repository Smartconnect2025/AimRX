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
 * @returns A Supabase client instance configured for browser environments
 */
export function createClient() {
  return createBrowserClient(
    envConfig.NEXT_PUBLIC_SUPABASE_URL,
    envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
