"use client";

import { ReactNode } from "react";
import { IntakeHeader } from "./IntakeHeader";

interface IntakeLayoutProps {
  children: ReactNode;
  showExitButton?: boolean;
  onExitClick?: () => void;
}

/**
 * IntakeLayout - Layout wrapper for intake pages
 *
 * Provides:
 * - Simplified header optimized for form completion
 * - Consistent layout across all intake pages
 * - Distraction-free environment
 * - Mobile responsive design
 */
export function IntakeLayout({
  children,
  showExitButton = true,
  onExitClick,
}: IntakeLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <IntakeHeader showExitButton={showExitButton} onExitClick={onExitClick} />
      <main className="flex-1 w-full">{children}</main>
    </div>
  );
}
