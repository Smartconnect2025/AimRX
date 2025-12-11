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
  "A provider just placed an order",
  "New clinic joined the network",
  "Peptide prescription received",
  "Regenerative therapy in process",
  "Another pharmacy activated their account",
  "Provider consultation completed",
  "Compounding request submitted",
  "New regenerative treatment started",
];

export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const supabase = createClient();
  const redirectUrl = decodeURIComponent(searchParams.get("redirect") || "/");

  // Fade in on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Rotate activity messages
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % SAFE_ACTIVITY_MESSAGES.length);
    }, 4000);
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

        {/* Top-center logo and headline */}
        <div className="pt-8 pb-4 text-center z-10">
          <div className="flex flex-col items-center gap-3">
            {/* Glowing teal AIM logo */}
            <div className="text-7xl drop-shadow-2xl animate-pulse" style={{ color: "#00AEEF", textShadow: "0 0 30px rgba(0, 174, 239, 0.6)" }}>✝</div>
            <h1 className="text-4xl font-bold text-white drop-shadow-2xl">AIM Marketplace</h1>
            <p className="text-xl text-white/90 font-semibold">The Amazon of Regenerative Medicine</p>
            <p className="text-base text-white/80">Nationwide compounding network</p>
            <p className="text-sm text-white/70 italic max-w-2xl mt-2">"Elevating Patient Care with AI-Driven Clinical Innovations"</p>
          </div>
        </div>

        {/* Centered login card with fade-in */}
        <div className={`flex-1 flex flex-col items-center justify-center px-4 py-8 z-10 transition-opacity duration-1000 ${isVisible ? "opacity-100" : "opacity-0"}`}>
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
                    placeholder=""
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
                className="w-full h-16 text-xl font-bold bg-[#00AEEF] hover:bg-[#00AEEF] text-white shadow-2xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,174,239,0.6)]"
                disabled={isLoading}
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

          {/* Elegant Access Request Cards */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
            {/* Doctor Card */}
            <Link href="/request-doctor-access" className="block group">
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-xl border-2 border-[#00AEEF]/20 hover:border-[#00AEEF] transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:shadow-[#00AEEF]/30">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00AEEF] to-[#0098D4] flex items-center justify-center text-white text-2xl font-bold group-hover:scale-110 transition-transform duration-300">
                    Dr
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#00AEEF] transition-colors">For Doctors</h3>
                    <p className="text-sm text-gray-600">Join the network</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-4">Empower your practice with regenerative medicine. Access peptides, PRP, and more.</p>
                <div className="flex items-center justify-between">
                  <span className="text-[#00AEEF] font-semibold group-hover:translate-x-2 transition-transform">Request Provider Access →</span>
                </div>
              </div>
            </Link>

            {/* Pharmacy Card */}
            <Link href="/request-pharmacy-access" className="block group">
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-xl border-2 border-[#1E3A8A]/20 hover:border-[#1E3A8A] transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:shadow-[#1E3A8A]/30">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] flex items-center justify-center text-white text-2xl font-bold group-hover:scale-110 transition-transform duration-300">
                    Rx
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#1E3A8A] transition-colors">For Pharmacies</h3>
                    <p className="text-sm text-gray-600">Grow your business</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-4">Join AIM's regenerative network and receive orders from providers nationwide.</p>
                <div className="flex items-center justify-between">
                  <span className="text-[#1E3A8A] font-semibold group-hover:translate-x-2 transition-transform">Apply to Join Network →</span>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-auto z-10">
          {/* Bottom live activity bar - smooth scroll */}
          <div className="bg-black/40 backdrop-blur-md border-t border-white/10 py-4 overflow-hidden">
            <div className="relative">
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

          {/* Footer */}
          <div className="text-center py-3 text-gray-400 text-xs">
            By invitation only • Built exclusively for AIM Medical Technologies
          </div>
        </div>
    </div>
  );
}
