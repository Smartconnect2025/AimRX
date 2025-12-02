"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@core/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { crmEventTriggers } from "@/core/services/crm";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();
  const redirectUrl = decodeURIComponent(searchParams.get("redirect") || "/");

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

        // Chat feature removed - CometChat integration disabled
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
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="font-heading text-2xl font-semibold mb-2">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground mb-1">
          Secure e-prescribing portal for Westside Pharmacy providers
        </p>
        <p className="text-sm text-muted-foreground">
          Use your credentials to access your account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex items-center justify-end">
          <Link
            href="/auth/forgot-password"
            className="text-sm font-medium text-primary hover:text-primary/80"
          >
            Forgot Password?
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/register"
            className="font-medium text-primary hover:text-primary/80"
          >
            Sign up now
          </Link>
        </p>
      </div>
    </div>
  );
}
