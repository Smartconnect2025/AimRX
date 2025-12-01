"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useUser } from "@core/auth";
import { createClient } from "@core/supabase";
import { toast } from "sonner";
import { useState } from "react";

interface IntakeHeaderProps {
  showExitButton?: boolean;
  onExitClick?: () => void;
}

/**
 * IntakeHeader - Simplified header for the intake process
 *
 * Features:
 * - Minimal branding (logo only)
 * - Optional exit button for users to leave intake process
 * - Distraction-free design optimized for form completion
 * - Mobile responsive
 * - No navigation elements that could distract from conversion
 */
export function IntakeHeader({
  showExitButton = true,
  onExitClick,
}: IntakeHeaderProps) {
  const router = useRouter();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleExit = async () => {
    if (onExitClick) {
      onExitClick();
      return;
    }

    try {
      setIsLoading(true);

      if (user) {
        // If user is logged in, sign them out and redirect to login
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        toast("You have been signed out.");
        window.location.href = "/auth/login";
      } else {
        // If no user, redirect to home
        router.push("/");
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred while signing out.";
      toast(errorMessage, {
        className: "bg-destructive text-destructive-foreground",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm border-b border-border">
      <div className="container max-w-5xl h-16 px-4 md:px-4 justify-self-center">
        <div className="h-full flex items-center justify-between">
          {/* Logo - Centered */}
          <div className="flex items-center">
            <Image
              src="/logo.svg"
              alt="Logo"
              width={120}
              height={28}
              priority
              className="w-auto"
            />
          </div>

          {/* Exit Button - Right aligned */}
          <div className="flex-1 flex justify-end">
            {showExitButton && (
              <Button
                variant="secondary"
                size="default"
                onClick={handleExit}
                disabled={isLoading}
                aria-label="Exit intake process"
              >
                Log out
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
