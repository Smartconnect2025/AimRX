"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@core/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Copy, Check, KeyRound } from "lucide-react";
import QRCode from "qrcode";

function generateRecoveryCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 8; i++) {
    const part1 = Math.random().toString(36).substring(2, 7).toUpperCase();
    const part2 = Math.random().toString(36).substring(2, 7).toUpperCase();
    codes.push(`${part1}-${part2}`);
  }
  return codes;
}

export default function MFAEnrollPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [codesCopied, setCodesCopied] = useState(false);
  const [factorId, setFactorId] = useState<string>("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [codesAcknowledged, setCodesAcknowledged] = useState(false);
  const supabase = createClient();
  const redirectUrl = decodeURIComponent(searchParams.get("redirect") || "/");

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

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `${user.email}'s Authenticator`,
      });

      if (error) throw error;

      if (data) {
        setFactorId(data.id);
        setSecret(data.totp.secret);

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

  const copyRecoveryCodes = () => {
    const codesText = recoveryCodes.join("\n");
    navigator.clipboard.writeText(codesText);
    setCodesCopied(true);
    toast.success("Recovery codes copied to clipboard!");
    setTimeout(() => setCodesCopied(false), 2000);
  };

  const verifyAndEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verificationCode,
      });

      if (error) throw error;

      const codes = generateRecoveryCodes();
      setRecoveryCodes(codes);

      await fetch("/api/auth/mfa/complete-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recoveryCodes: codes }),
      });

      toast.success("Two-Factor Authentication enabled successfully!");
    } catch (error) {
      console.error("MFA verification error:", error);
      toast.error("Invalid verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    window.location.href = redirectUrl || "/";
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#00AEEF] flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      </div>

      <div className="w-full max-w-md z-10">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2" data-testid="text-mfa-title">
              {recoveryCodes.length > 0 ? "Save Your Recovery Codes" : "Set Up Two-Factor Authentication"}
            </h1>
            <p className="text-sm text-gray-600">
              {recoveryCodes.length > 0
                ? "Save these codes somewhere safe. You can use them to sign in if you lose your authenticator device."
                : "Secure your account with an authenticator app"}
            </p>
          </div>

          {recoveryCodes.length > 0 ? (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <KeyRound className="h-5 w-5 text-amber-600" />
                  <h3 className="text-sm font-semibold text-amber-800">Important</h3>
                </div>
                <p className="text-xs text-amber-700">
                  Each code can only be used once. Store them in a secure location like a password manager.
                  These codes will not be shown again.
                </p>
              </div>

              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-2">
                  {recoveryCodes.map((code, index) => (
                    <div
                      key={index}
                      className="font-mono text-sm text-center bg-white rounded px-3 py-2 border border-gray-100"
                      data-testid={`text-recovery-code-${index}`}
                    >
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={copyRecoveryCodes}
                data-testid="button-copy-codes"
              >
                {codesCopied ? (
                  <><Check className="h-4 w-4 mr-2" /> Copied!</>
                ) : (
                  <><Copy className="h-4 w-4 mr-2" /> Copy All Codes</>
                )}
              </Button>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="acknowledge"
                  checked={codesAcknowledged}
                  onChange={(e) => setCodesAcknowledged(e.target.checked)}
                  className="rounded border-gray-300"
                  data-testid="checkbox-acknowledge"
                />
                <label htmlFor="acknowledge" className="text-xs text-gray-600">
                  I have saved my recovery codes in a safe place
                </label>
              </div>

              <Button
                type="button"
                className="w-full h-12 bg-[#00AEEF] hover:bg-[#0098D4] text-white font-semibold"
                onClick={handleContinue}
                disabled={!codesAcknowledged}
                data-testid="button-continue"
              >
                Continue to AIM RX
              </Button>
            </div>
          ) : isLoading && !qrCode ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00AEEF] mx-auto"></div>
              <p className="text-sm text-gray-600 mt-4">Setting up MFA...</p>
            </div>
          ) : (
            <>
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Instructions:</h3>
                <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                  <li>Download an authenticator app (Google Authenticator, Authy, etc.)</li>
                  <li>Scan the QR code below with your authenticator app</li>
                  <li>Enter the 6-digit code from your app to verify</li>
                </ol>
              </div>

              {qrCode && (
                <div className="mb-6">
                  <div className="bg-gray-50 rounded-lg p-6 text-center border-2 border-gray-200">
                    <img src={qrCode} alt="QR Code" className="mx-auto w-48 h-48" data-testid="img-qr-code" />
                  </div>
                </div>
              )}

              {secret && (
                <div className="mb-6">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Or enter this key manually:</Label>
                  <div className="flex gap-2">
                    <Input
                      value={secret}
                      readOnly
                      className="font-mono text-xs flex-1"
                      data-testid="input-secret-key"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={copySecret}
                      className="shrink-0"
                      data-testid="button-copy-secret"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}

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
                    data-testid="input-verification-code"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-[#00AEEF] hover:bg-[#0098D4] text-white font-semibold"
                  disabled={isLoading || verificationCode.length !== 6}
                  data-testid="button-verify-enable"
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

                <p className="text-xs text-gray-500 text-center">
                  Two-factor authentication is required for all AIM RX accounts.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
