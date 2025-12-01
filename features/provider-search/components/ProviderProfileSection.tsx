"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProviderProfileSectionProps } from "../types/provider-profile";
import { cn } from "@/utils/tailwind-utils";

export function ProviderProfileSection({
  title,
  children,
  className,
}: ProviderProfileSectionProps) {
  return (
    <Card className={cn("border-0 shadow-sm", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}
