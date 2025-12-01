"use client";

import React from "react";
import { VitalsGoal, VitalEntry } from "../types";
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
  Trash2,
  HeartPulse,
  UserCircle,
  CalendarDays,
  Clock,
  PlusCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface VitalsGoalCardProps {
  goal: VitalsGoal;
  vitalEntries: VitalEntry[];
  onLogVital?: () => void;
  onDeleteGoal?: (goalId: string) => void;
}

export function VitalsGoalCard({
  goal,
  vitalEntries,
  onLogVital,
  onDeleteGoal,
}: VitalsGoalCardProps) {
  // Calculate progress based on most recent vital entry
  const calculateProgress = () => {
    if (!vitalEntries.length) return 0;

    const latestEntry = vitalEntries[vitalEntries.length - 1];
    const targetValue = parseFloat(goal.target_value);

    if (goal.vital_type === "weight") {
      const currentWeight = latestEntry.value || 0;
      // For weight goals, we assume the goal is to reach or stay under the target
      if (currentWeight <= targetValue) return 100;
      // Calculate how close they are (this is simplified - real logic might be more complex)
      const difference = Math.abs(currentWeight - targetValue);
      const progress = Math.max(0, 100 - (difference / targetValue) * 100);
      return Math.min(100, progress);
    } else if (goal.vital_type === "blood_pressure") {
      const currentSystolic = latestEntry.systolic || 0;
      // For blood pressure, goal is to be at or below target systolic
      if (currentSystolic <= targetValue) return 100;
      // Calculate progress (simplified)
      const difference = currentSystolic - targetValue;
      const progress = Math.max(0, 100 - (difference / targetValue) * 100);
      return Math.min(100, progress);
    }

    return 0;
  };

  // Get current value display
  const getCurrentValueDisplay = () => {
    if (!vitalEntries.length) return "No data";

    const latestEntry = vitalEntries[vitalEntries.length - 1];

    if (goal.vital_type === "weight") {
      return `${latestEntry.value || 0} lbs`;
    } else if (goal.vital_type === "blood_pressure") {
      return `${latestEntry.systolic || 0}/${latestEntry.diastolic || 0} mmHg`;
    }

    return "No data";
  };

  const progress = calculateProgress();
  const currentValue = getCurrentValueDisplay();

  // Get goal type badge
  const getTypeBadge = (type: string) => {
    if (type === "provider") {
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1"
        >
          <HeartPulse className="h-3 w-3 mr-1" />
          Provider Goal
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1"
      >
        <UserCircle className="h-3 w-3 mr-1" />
        Personal Goal
      </Badge>
    );
  };

  // Get vital type label
  const getVitalLabel = (vitalType: string) => {
    switch (vitalType) {
      case "weight":
        return "Weight Goal";
      case "blood_pressure":
        return "Blood Pressure Goal";
      default:
        return "Vital Goal";
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
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

  return (
    <Card className={`rounded-lg shadow-sm ${getStatusColor(goal.status)}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-start gap-2 flex-wrap">
              <CardTitle className="text-base break-words leading-tight">
                {getVitalLabel(goal.vital_type)}
              </CardTitle>
              {getTypeBadge(goal.type)}
            </div>
            <p className="text-sm text-muted-foreground">
              Target: {goal.target_value}{" "}
              {goal.vital_type === "weight" ? "lbs" : "mmHg"}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2 mt-1" />

        <div className="mt-3">
          <div className="text-sm text-muted-foreground">Current Value</div>
          <div className="text-lg font-semibold">{currentValue}</div>
        </div>

        {goal.description && (
          <div className="mt-3">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {goal.description}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-3">
          <Badge
            variant="outline"
            className="bg-gray-50 text-gray-600 border-gray-200 flex items-center gap-1"
          >
            <UserCircle className="w-3 h-3" />
            Manual Entry
          </Badge>
        </div>

        <Button onClick={onLogVital} className="w-full mt-4" size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Log {goal.vital_type === "weight" ? "Weight" : "Blood Pressure"}
        </Button>
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
