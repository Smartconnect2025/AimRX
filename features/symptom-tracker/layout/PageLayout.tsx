import React from "react";
import { cn } from "@/utils/tailwind-utils";

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
  noPadding?: boolean;
  withLandscapeOptimization?: boolean;
}

const PageLayout = ({
  children,
  className = "bg-background",
  fullWidth = false,
  noPadding = false,
  withLandscapeOptimization = false,
}: PageLayoutProps) => {
  return (
    <div
      className={cn(
        "min-h-screen bg-secondary",
        withLandscapeOptimization && "landscape-compact",
        className,
      )}
    >
      <div
        className={cn(
          "content-spacing",
          !noPadding && "py-16",
          withLandscapeOptimization && "landscape-scrollable",
        )}
      >
        <div
          className={cn(
            "container-responsive mx-auto px-4",
            fullWidth ? "max-w-full" : "max-w-5xl",
            "ultra-wide-constraint",
            fullWidth && "ultra-wide-reset",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default PageLayout;
