/**
 * Supabase Client Module
 *
 * Creates and provides a Supabase client for browser/client-side operations.
 */
import { createBrowserClient } from "@supabase/ssr";
import { envConfig } from "@core/config";

// Generate a unique tab ID that persists for the session
function getTabId(): string {
  if (typeof window === "undefined") return "server";

  const storageKey = "__tab_id__";
  let tabId = sessionStorage.getItem(storageKey);

  if (!tabId) {
    // Create a unique ID for this tab using timestamp + random string
    tabId = `tab-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem(storageKey, tabId);
  }

  return tabId;
}

/**
 * Create a Supabase client for client-side usage
 *
 * Uses sessionStorage with a unique storage key per tab to ensure
 * complete isolation between tabs. Each tab can have a different user
 * logged in simultaneously.
 *
 * @returns A Supabase client instance configured for browser environments
 */
export function createClient() {
  const tabId = getTabId();

  return createBrowserClient(
    envConfig.NEXT_PUBLIC_SUPABASE_URL,
    envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        storage: typeof window !== "undefined" ? window.sessionStorage : undefined,
        storageKey: `sb-auth-${tabId}`,
        flowType: "pkce",
      },
    }
  );
}
