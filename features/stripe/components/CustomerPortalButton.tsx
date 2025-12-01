"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2, Settings } from "lucide-react";

interface CustomerPortalButtonProps {
  returnUrl?: string;
  className?: string;
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  children?: React.ReactNode;
}

export function CustomerPortalButton({
  returnUrl,
  className,
  variant = "outline",
  size = "default",
  children,
}: CustomerPortalButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenPortal = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/customer-portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          return_url: returnUrl,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to the Stripe Customer Portal
        window.location.href = data.portal_url;
      } else {
        setError(data.error || "Failed to open customer portal");
        console.error("Customer portal error:", data);
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      setError("Network error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleOpenPortal}
        disabled={isLoading}
        variant={variant}
        size={size}
        className={className}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Settings className="h-4 w-4 mr-2" />
        )}
        {children || "Manage Subscriptions"}
        {!isLoading && <ExternalLink className="h-4 w-4 ml-2" />}
      </Button>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
