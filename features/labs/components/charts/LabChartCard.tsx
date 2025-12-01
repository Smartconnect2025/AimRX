import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { ReactNode } from "react";

interface LabChartCardProps {
  title: string;
  children: ReactNode;
  hasCriticalValues?: boolean;
  className?: string;
}

export const LabChartCard = ({
  title,
  children,
  hasCriticalValues,
  className,
}: LabChartCardProps) => {
  return (
    <Card className={`border-0 rounded-2xl ${className || ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              {title}
            </CardTitle>
            {hasCriticalValues && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Critical
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-3 pb-3">{children}</CardContent>
    </Card>
  );
};
