"use client";

import { AlertCircle, Mail, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { createClient } from "@/core/supabase/client";

export default function AccountInactivePage() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-amber-100 rounded-full">
              <AlertCircle className="h-12 w-12 text-amber-600" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Account Inactive
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            Your provider account is currently inactive. You cannot access the
            application or place orders at this time.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Need Help?
                </p>
                <p className="text-sm text-blue-700">
                  Please contact the administrator to activate your account or for
                  more information about your account status.
                </p>
              </div>
            </div>
          </div>

          {/* Sign Out Button */}
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
