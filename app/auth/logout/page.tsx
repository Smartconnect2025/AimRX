"use client";

import { useEffect } from "react";
import { createBrowserClient } from "@core/supabase/client";

export default function LogoutPage() {
  useEffect(() => {
    const logout = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Note: HttpOnly cookies (user_role, user_role_cache, mfa_pending, etc.)
      // are automatically cleared by the middleware when user logs out

      await supabase.auth.signOut({ scope: "local" });
      window.location.href = "/auth/login";
    };
    logout();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Signing out...</h1>
        <p className="text-gray-600">Please wait while we sign you out.</p>
      </div>
    </div>
  );
}
