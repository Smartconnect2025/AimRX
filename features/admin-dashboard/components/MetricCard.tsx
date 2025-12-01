"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/tailwind-utils";
import { formatNumber, formatGrowth, getGrowthColor } from "../utils";

export interface MetricCardProps {
  title: string;
  value: number;
  growth: number;
  isLoading?: boolean;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  growth,
  isLoading = false,
  className,
}) => {
  return (
    <Card className={cn("py-6", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-4 w-24" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{formatNumber(value)}</div>
            <p className={cn("text-xs pt-2", getGrowthColor(growth))}>
              {formatGrowth(growth)} from last month
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};
