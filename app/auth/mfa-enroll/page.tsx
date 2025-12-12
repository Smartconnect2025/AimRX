"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@core/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Copy, Check } from "lucide-react";
import QRCode from "qrcode";

export default function MFAEnrollPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [factorId, setFactorId] = useState<string>("");
  const supabase = createClient();

  useEffect(() => {
    enrollMFA();
  }, []);

  const enrollMFA = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("You must be logged in to set up MFA");
        router.push("/auth/login");
        return;
      }

      // Enroll a new TOTP factor
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `${user.email}'s Authenticator`,
      });

      if (error) throw error;

      if (data) {
        setFactorId(data.id);
        setSecret(data.totp.secret);

        // Generate QR code
        const otpauthUrl = data.totp.uri;
        const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
        setQrCode(qrCodeDataUrl);
      }
    } catch (error) {
      console.error("MFA enrollment error:", error);
      toast.error("Failed to set up MFA. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    toast.success("Secret copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const verifyAndEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Verify the code
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verificationCode,
      });

      if (error) throw error;

      toast.success("Multi-Factor Authentication enabled successfully!");

      // Redirect to home
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (error) {
      console.error("MFA verification error:", error);
      toast.error("Invalid verification code. Please try again.");
    } finally {
      setIsLoading(false);
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Set Up Two-Factor Authentication</h1>
            <p className="text-sm text-gray-600">Secure your account with an authenticator app</p>
          </div>

          {isLoading && !qrCode ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00AEEF] mx-auto"></div>
              <p className="text-sm text-gray-600 mt-4">Setting up MFA...</p>
            </div>
          ) : (
            <>
              {/* Instructions */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Instructions:</h3>
                <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                  <li>Download an authenticator app (Google Authenticator, Authy, etc.)</li>
                  <li>Scan the QR code below or enter the secret key manually</li>
                  <li>Enter the 6-digit code from your app to verify</li>
                </ol>
              </div>

              {/* QR Code */}
              {qrCode && (
                <div className="mb-6">
                  <div className="bg-gray-50 rounded-lg p-6 text-center border-2 border-gray-200">
                    <img src={qrCode} alt="QR Code" className="mx-auto w-48 h-48" />
                  </div>
                </div>
              )}

              {/* Secret Key */}
              {secret && (
                <div className="mb-6">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Or enter this secret key manually:</Label>
                  <div className="flex gap-2">
                    <Input
                      value={secret}
                      readOnly
                      className="font-mono text-sm flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={copySecret}
                      className="shrink-0"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {/* Verification Form */}
              <form onSubmit={verifyAndEnable} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-sm font-medium">Verification Code</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    required
                    disabled={isLoading}
                    className="h-12 text-center text-2xl tracking-widest font-mono"
                    autoComplete="off"
                  />
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
                    "Verify and Enable MFA"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push("/")}
                  disabled={isLoading}
                >
                  Skip for now
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
