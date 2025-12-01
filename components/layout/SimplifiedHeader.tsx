"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@core/auth";
import { useUserProfile } from "@/hooks";
import { createClient } from "@core/supabase";
import { toast } from "sonner";
import { useState } from "react";

interface SimplifiedHeaderProps {
  showBackButton?: boolean;
  onBackButtonClick?: () => void;
  logoOnLeft?: boolean;
}

export function SimplifiedHeader({
  showBackButton,
  onBackButtonClick,
  logoOnLeft = false,
}: SimplifiedHeaderProps) {
  const router = useRouter();
  const { user } = useUser();
  const { profile, getAvatarUrl, getInitials } = useUserProfile();
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleBackClick = () => {
    if (onBackButtonClick) {
      onBackButtonClick();
    } else {
      router.back();
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast("You have been logged out.");

      // Use window.location.href to ensure full page reload
      window.location.href = "/auth/login";
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
      <div className="container mx-auto h-16 px-4 md:px-4 justify-self-center">
        <div className="h-full w-full flex items-center justify-between">
          {!logoOnLeft && (
            <div className="flex-1">
              {showBackButton && (
                <Button variant="ghost" size="icon" onClick={handleBackClick}>
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              )}
            </div>
          )}

          <div className="cursor-pointer">
            <Image
              src="/logo.svg"
              alt="Logo"
              width={120}
              height={28}
              priority
              className="w-auto"
            />
          </div>

          <div className="flex-1 flex justify-end">
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div
                    className="relative h-10 w-10 p-0 flex items-center justify-center cursor-pointer hover:bg-accent rounded-full disabled:opacity-50"
                    aria-disabled={isLoading}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={getAvatarUrl(32)} alt="Profile" />
                      <AvatarFallback className="text-xs">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-[200px] border border-border"
                >
                  <div className="px-2 pt-2 text-sm text-muted-foreground">
                    {profile?.firstName && profile?.lastName
                      ? `${profile.firstName} ${profile.lastName}`
                      : user.email && user.email.length > 20
                        ? `${user.email.substring(0, 24)}...`
                        : user.email}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    disabled={isLoading}
                    onClick={handleLogout}
                  >
                    {isLoading ? "Signing out..." : "Sign out"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
