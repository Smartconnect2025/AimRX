import React from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricsCardProps {
  title: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  footer?: string;
  centerContent?: boolean;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  icon: Icon,
  footer,
  centerContent = false
}) => {
  return (
    <Card className="border-gray-100 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={`text-sm font-medium ${centerContent ? 'text-center w-full sm:text-left sm:w-auto' : ''}`}>
          <span className="sm:hidden">{title}</span>
          <span className="hidden sm:inline">{title}</span>
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground hidden sm:block" />}
      </CardHeader>
      <CardContent>
        <div className={`text-xl sm:text-2xl font-bold ${centerContent ? 'text-center sm:text-left flex items-center justify-center sm:justify-start gap-1' : ''}`}>
          {value}
        </div>
        {footer && <p className="text-xs text-muted-foreground text-center sm:text-left">{footer}</p>}
      </CardContent>
    </Card>
  );
}; 