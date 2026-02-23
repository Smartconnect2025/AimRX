import { createClient } from "@supabase/supabase-js";
import { envConfig } from "@core/config";

/**
 * Supabase admin client for cron jobs.
 * Uses service role key — bypasses RLS. No cookies needed.
 */
export function createCronClient() {
  return createClient(
    envConfig.NEXT_PUBLIC_SUPABASE_URL,
    envConfig.SUPABASE_SERVICE_ROLE_KEY,
  );
}
