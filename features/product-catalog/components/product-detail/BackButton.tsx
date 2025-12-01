"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface BackButtonProps {
  fallbackUrl?: string;
  className?: string;
  fallbackParam?: string;
}

export function BackButton({
  fallbackUrl,
  className,
  fallbackParam,
}: BackButtonProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleBackClick = () => {
    const hasFallbackParam = searchParams.get(fallbackParam || "") === "true";

    if (hasFallbackParam && fallbackUrl) {
      // Navigate to fallback URL when fallback parameter is present
      router.push(fallbackUrl);
    } else {
      // Use default browser back functionality
      router.back();
    }
  };

  return (
    <button
      onClick={handleBackClick}
      className={`inline-flex items-center hover:text-blue-600 my-8 cursor-pointer text-slate-700 transition-colors ${className || ""}`}
    >
      <ChevronLeft className="mr-2 h-6 w-6" />
      Back
    </button>
  );
}
