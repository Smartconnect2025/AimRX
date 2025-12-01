import React from "react";
import { Goal } from "../types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  CheckCircle2,
  Trash2,
  HeartPulse,
  UserCircle,
  CalendarDays,
  Clock,
  PlusCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Utility: get label for metric
const metricLabels: Record<string, string> = {
  steps: "Steps",
  sleep: "Sleep Hours",
  water: "Water Intake",
  exercise: "Exercise Minutes",
  medication_lipitor: "Medication Adherence - Lipitor",
  journaling: "Journaling",
  deep_breathing: "Deep Breathing",
};
const getMetricLabel = (goal: Goal) => metricLabels[goal.metric] || goal.metric;

// Utility: get badge for type
const typeBadge = (type: string) => {
  if (type === "provider")
    return (
      <Badge
        variant="outline"
        className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1"
      >
        <HeartPulse className="h-3 w-3 mr-1" />
        Provider
      </Badge>
    );
  return (
    <Badge
      variant="outline"
      className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1"
    >
      <UserCircle className="h-3 w-3 mr-1" />
      Personal
    </Badge>
  );
};

// Utility: get tracking source badge
const trackingSourceIcons: Record<string, React.ReactElement> = {
  "apple-health": <span className="text-red-500"></span>,
  fitbit: <span className="text-blue-500">📶</span>,
  manual: <UserCircle className="w-3 h-3" />,
};
const getTrackingSourceBadge = (source?: string) => {
  if (!source) return null;
  let label = source.replace(/[-_]/g, " ");
  label = label.charAt(0).toUpperCase() + label.slice(1);
  return (
    <Badge
      variant="outline"
      className="flex items-center gap-1 bg-gray-50 text-gray-600 border-gray-200"
    >
      {trackingSourceIcons[source] || <UserCircle className="w-3 h-3" />}{" "}
      {label}
    </Badge>
  );
};

// Utility: get status color
const statusColor = (status?: string) => {
  switch (status) {
    case "on-track":
      return "border-green-400 bg-green-50";
    case "behind":
      return "border-red-200 bg-red-50";
    case "achieved":
      return "border-green-400 bg-green-50";
    default:
      return "";
  }
};

interface GoalCardProps {
  goal: Goal;
  onUpdateProgress?: (goal: Goal) => void;
  onDeleteGoal?: (goalId: string) => void;
}

export function GoalCard({
  goal,
  onUpdateProgress,
  onDeleteGoal,
}: GoalCardProps) {
  const canManuallyUpdate =
    goal.tracking_source === "manual" || !goal.tracking_source;
  const roundedProgress = goal.progress
    ? Number(Number(goal.progress).toFixed(1))
    : 0;
  const metricUnit = goal.unit || "";
  const displayValue = roundedProgress
    ? `${roundedProgress}%${goal.target_value ? ` (${Math.round((roundedProgress / 100) * Number(goal.target_value))} ${metricUnit})` : ""}`
    : "0%";

  return (
    <Card className={`rounded-lg shadow-sm ${statusColor(goal.status)}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-start gap-2 flex-wrap">
              <CardTitle className="text-base break-words leading-tight">
                {getMetricLabel(goal)}
              </CardTitle>
              {typeBadge(goal.type)}
            </div>
            <p className="text-sm text-muted-foreground">
              Target: {goal.target_value}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canManuallyUpdate && (
                <DropdownMenuItem onClick={() => onUpdateProgress?.(goal)}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Update Progress
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onDeleteGoal?.(goal.id)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Goal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span className="font-medium">
            {goal.type === "provider" || goal.unit
              ? displayValue
              : `${roundedProgress}%`}
          </span>
        </div>
        <Progress value={roundedProgress || 0} className="h-2 mt-1" />
        <div style={{ minHeight: "2.5rem" }}>
          {goal.description ? (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {goal.description}
            </p>
          ) : (
            <div className="mt-2" />
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {getTrackingSourceBadge(goal.tracking_source)}
        </div>
        {canManuallyUpdate && goal.status !== "achieved" && (
          <Button
            onClick={() => onUpdateProgress?.(goal)}
            className="w-full mt-4"
            size="sm"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Log Progress
          </Button>
        )}
      </CardContent>
      <CardFooter className="pt-1 pb-4">
        <div className="w-full flex flex-wrap justify-between text-xs text-muted-foreground">
          <div className="flex items-center">
            <Clock className="mr-1 h-3 w-3" />
            <span>
              {goal.timeframe === "custom" && goal.end_date
                ? `Due: ${new Date(goal.end_date).toLocaleDateString()}`
                : `${goal.timeframe}`}
            </span>
          </div>
          <div className="flex items-center">
            <CalendarDays className="mr-1 h-3 w-3" />
            <span>
              Created{" "}
              {formatDistanceToNow(goal.created_at, { addSuffix: true })}
            </span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
