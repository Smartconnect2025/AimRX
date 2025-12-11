"use client";

import { useEffect } from "react";
import { createBrowserClient } from "@core/supabase/client";

export default function GoToLoginPage() {
  useEffect(() => {
    const logout = async () => {
      const supabase = createBrowserClient();
      await supabase.auth.signOut({ scope: "local" });
      window.location.href = "/auth/login";
    };
    logout();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting to sign in page...</h1>
        <p className="text-gray-600">Please wait...</p>
      </div>
    </div>
  );
}
