"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@core/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { crmEventTriggers } from "@/core/services/crm";
import { Eye, EyeOff } from "lucide-react";

const SAFE_ACTIVITY_MESSAGES = [
  "A provider just placed an order from Texas",
  "A new compounding pharmacy joined from Florida",
  "15 regenerative orders shipped in the last hour",
  "Another clinic activated their account in California",
  "28 orders fulfilled today",
  "A pharmacy in New York just went live",
  "3 new providers registered in the last 30 minutes",
  "42 prescriptions processed this morning",
  "A doctor from Colorado just joined the network",
  "Another regenerative order shipped to Arizona",
];

export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [onlineCount, setOnlineCount] = useState(2847);
  const supabase = createClient();
  const redirectUrl = decodeURIComponent(searchParams.get("redirect") || "/");

  // Rotate activity messages
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % SAFE_ACTIVITY_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Simulate live online count fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount((prev) => prev + Math.floor(Math.random() * 3) - 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      if (data.user?.id && data.user?.email) {
        // Send Login event to CRM (non-blocking)
        crmEventTriggers.userLoggedIn(data.user.id, data.user.email);
      }

      toast.success("You have successfully logged in.");

      // Navigate to home - let middleware handle role-based routing and intake checks
      router.push(redirectUrl || "/");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "An unknown error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#00AEEF] overflow-hidden flex flex-col relative">
        {/* Subtle animated helix/DNA background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
        </div>

        {/* Top-right live counter */}
        <div className="absolute top-8 right-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-6 py-3 text-white font-semibold shadow-2xl z-20">
          <span className="text-green-300 text-2xl mr-2">●</span>
          {onlineCount.toLocaleString()} providers & pharmacies online
        </div>

        {/* Top-center logo and headline */}
        <div className="pt-8 pb-4 text-center z-10">
          <div className="flex flex-col items-center gap-3">
            {/* Glowing AIM logo */}
            <div className="text-7xl drop-shadow-2xl animate-pulse">✝</div>
            <h1 className="text-4xl font-bold text-white drop-shadow-2xl">AIM Marketplace</h1>
            <p className="text-xl text-white/90 font-semibold">The Amazon of Regenerative Medicine</p>
            <p className="text-base text-white/80">200+ compounding pharmacies · 48-hour nationwide delivery</p>
          </div>
        </div>

        {/* Centered login card */}
        <div className="flex-1 flex items-center justify-center px-4 py-8 z-10">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
              <p className="text-gray-600">Sign in to access the marketplace</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-lg font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-14 text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-lg font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-14 text-lg pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-[#00AEEF] hover:text-[#0098D4]"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full h-14 text-lg font-bold bg-[#00AEEF] hover:bg-[#0098D4] text-white shadow-lg transition-all duration-300 animate-pulse"
                disabled={isLoading}
                style={{ animationDuration: "2s" }}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  "SIGN IN"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                New here?{" "}
                <Link
                  href="/auth/register"
                  className="font-semibold text-[#00AEEF] hover:text-[#0098D4]"
                >
                  Create account
                </Link>
              </p>
            </div>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-auto z-10">
          {/* Bottom corners */}
          <div className="flex items-center justify-between px-8 pb-4">
            <div className="text-white/80 text-sm font-medium">
              <p>For Doctors · Prescribe from any pharmacy</p>
            </div>
            <div className="text-white/80 text-sm font-medium">
              <p>For Pharmacies · Get nationwide orders</p>
            </div>
          </div>

          {/* Bottom live activity bar */}
          <div className="bg-black/40 backdrop-blur-md border-t border-white/10 py-4">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-2 text-white">
                  <span className="animate-pulse text-green-400 text-xl">●</span>
                  <span className="text-sm font-medium transition-all duration-500">
                    {SAFE_ACTIVITY_MESSAGES[currentMessage]}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
