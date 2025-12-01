import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Clock, DollarSign } from "lucide-react";
import { LabPanel } from "../types/lab";

interface LabCardProps {
  panel: LabPanel;
  onSchedule: (panelId: string) => void;
}

export const LabCard = ({ panel }: LabCardProps) => {
  const getUrgencyBadge = () => {
    if (panel.urgency === "high" || panel.timeSensitive) {
      return (
        <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">
          HIGH PRIORITY
        </Badge>
      );
    }
    return null;
  };

  return (
    <Card className="w-full h-full flex flex-col border-0 rounded-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between mb-2">
          <CardTitle className="text-lg leading-tight">{panel.name}</CardTitle>
          <div className="flex-shrink-0 ml-2">{getUrgencyBadge()}</div>
        </div>
        <CardDescription className="text-sm leading-relaxed">
          {panel.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Key Information Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-md">
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="text-sm font-medium">{panel.estimatedTime}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-md">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cost</p>
              <p className="text-sm font-medium">${panel.price}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Requirements Section - Fixed Height */}
        <div className="py-3 min-h-[4rem] flex flex-col justify-start">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Requirements
          </p>
          <div className="space-y-1">
            {panel.fastingRequired && (
              <div className="flex items-center gap-2 text-xs">
                <AlertTriangle className="h-3 w-3 text-amber-500" />
                <span className="text-amber-700">
                  Fasting required (12 hours)
                </span>
              </div>
            )}
            {panel.timeSensitive && (
              <div className="flex items-center gap-2 text-xs">
                <AlertTriangle className="h-3 w-3 text-orange-500" />
                <span className="text-orange-700">Time-sensitive test</span>
              </div>
            )}
            {!panel.fastingRequired && !panel.timeSensitive && (
              <p className="text-xs text-muted-foreground">
                No special requirements
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Biomarkers Section - Fixed Position */}
        <div className="py-3 mt-auto">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Biomarkers Tested ({panel.biomarkers.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {panel.biomarkers.map((biomarker) => (
              <Badge
                key={biomarker}
                variant="secondary"
                className="text-xs px-2 py-1"
              >
                {biomarker}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-4">
        <Button onClick={() => {}} variant="default" size="default" disabled>
          Order Test
        </Button>
      </CardFooter>
    </Card>
  );
};
