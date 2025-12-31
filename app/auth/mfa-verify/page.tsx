"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@core/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield } from "lucide-react";

export default function MFAVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [factorId, setFactorId] = useState<string>("");
  const supabase = createClient();
  const redirectUrl = decodeURIComponent(searchParams.get("redirect") || "/");

  useEffect(() => {
    checkMFAChallenge();
  }, []);

  const checkMFAChallenge = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Session expired. Please log in again.");
        router.push("/auth/login");
        return;
      }

      // Get the user's enrolled MFA factors
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();

      if (factorsError) throw factorsError;

      const totpFactor = factors?.totp?.find((f) => f.status === "verified");

      if (!totpFactor) {
        // No MFA set up, redirect to home
        router.push(redirectUrl || "/");
        return;
      }

      setFactorId(totpFactor.id);
    } catch (error) {
      console.error("MFA check error:", error);
      toast.error("Failed to verify MFA status.");
      router.push("/auth/login");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!factorId) {
        throw new Error("No MFA factor found");
      }

      // Create a challenge and verify the code
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verificationCode,
      });

      if (error) throw error;

      toast.success("Authentication successful!");

      // Navigate to intended destination
      router.push(redirectUrl || "/");
    } catch (error) {
      console.error("MFA verification error:", error);
      toast.error("Invalid verification code. Please try again.");
      setVerificationCode("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = async () => {
    setIsLoading(true);
    try {
      // Sign out the user to clear the session completely
      const { error } = await supabase.auth.signOut({ scope: 'global' });

      if (error) {
        console.error("Sign out error:", error);
      }

      // Wait for signout to complete
      await new Promise(resolve => setTimeout(resolve, 300));

      // Use window.location for a hard redirect to ensure clean state
      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Sign out error:", error);
      window.location.href = "/auth/login";
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#00AEEF] flex items-center justify-center p-4">
      {/* Subtle animated background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      </div>

      <div className="w-full max-w-md z-10">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Two-Factor Authentication</h1>
            <p className="text-sm text-gray-600">Enter the code from your authenticator app</p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm font-medium">Verification Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                required
                disabled={isLoading}
                className="h-14 text-center text-3xl tracking-widest font-mono"
                autoComplete="off"
                autoFocus
              />
              <p className="text-xs text-gray-500 text-center">Enter the 6-digit code from your authenticator app</p>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-[#00AEEF] hover:bg-[#0098D4] text-white font-semibold"
              disabled={isLoading || verificationCode.length !== 6}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleBackToLogin}
                className="text-sm text-[#00AEEF] hover:text-[#0098D4] font-medium"
                disabled={isLoading}
              >
                Back to Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
