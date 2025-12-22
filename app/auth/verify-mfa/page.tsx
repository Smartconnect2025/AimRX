"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { createClient } from "@core/supabase/client";

export default function VerifyMFAPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const userId = searchParams.get("userId");
  const email = searchParams.get("email");

  useEffect(() => {
    // Redirect if no userId or email
    if (!userId || !email) {
      router.push("/auth/login");
    }
  }, [userId, email, router]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleInputChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);

    if (!/^\d+$/.test(pastedData)) return;

    const newCode = pastedData.split("").concat(Array(6).fill("")).slice(0, 6);
    setCode(newCode);

    // Focus last filled input or first empty input
    const nextEmptyIndex = newCode.findIndex(c => !c);
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();
  };

  const handleVerify = async () => {
    const fullCode = code.join("");

    if (fullCode.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    setIsVerifying(true);

    try {
      // Verify the code
      const response = await fetch("/api/auth/mfa/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code: fullCode }),
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.error || "Invalid code");
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }

      // Get session from Supabase
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        toast.error("Session expired. Please login again.");
        router.push("/auth/login");
        return;
      }

      toast.success("Verification successful!");

      // Redirect to home or intended page
      const redirectTo = searchParams.get("redirectTo") || "/";
      router.push(redirectTo);
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Failed to verify code");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    setIsResending(true);

    try {
      const response = await fetch("/api/auth/mfa/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, email }),
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.error || "Failed to resend code");
        return;
      }

      toast.success("New code sent to your email");
      setCountdown(60);
      setCanResend(false);
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (error) {
      console.error("Resend error:", error);
      toast.error("Failed to resend code");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="font-heading text-2xl font-semibold mb-2">
          Verify Your Email
        </h1>
        <p className="text-muted-foreground">
          We sent a 6-digit code to <strong>{email}</strong>
        </p>
      </div>

      <div className="space-y-6">
        {/* Code Input */}
        <div className="flex justify-center gap-2" onPaste={handlePaste}>
          {code.map((digit, index) => (
            <Input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-14 text-center text-2xl font-semibold"
              disabled={isVerifying}
            />
          ))}
        </div>

        {/* Verify Button */}
        <Button
          onClick={handleVerify}
          className="w-full"
          disabled={isVerifying || code.join("").length !== 6}
        >
          {isVerifying ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Verifying...
            </>
          ) : (
            "Verify Code"
          )}
        </Button>

        {/* Resend Code */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Didn't receive the code?
          </p>
          {canResend ? (
            <Button
              variant="link"
              onClick={handleResendCode}
              disabled={isResending}
              className="p-0 h-auto font-medium"
            >
              {isResending ? "Sending..." : "Resend Code"}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Resend code in {countdown}s
            </p>
          )}
        </div>

        {/* Back to Login */}
        <div className="text-center pt-4">
          <Button
            variant="link"
            onClick={() => router.push("/auth/login")}
            className="text-sm"
          >
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
}
