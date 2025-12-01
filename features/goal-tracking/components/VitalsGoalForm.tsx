"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { GoalFormData, VitalType } from "../types";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@core/auth";

const vitalTypes = [
  { value: "weight", label: "Weight (lbs)", unit: "lbs" },
  { value: "blood_pressure", label: "Blood Pressure", unit: "mmHg" },
] as const;

const timeframeOptions = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Custom" },
] as const;

const formSchema = z.object({
  type: z.enum(["patient", "provider"]),
  vital_type: z.enum(["weight", "blood_pressure"]),
  target_value: z.string().min(1, "Target value is required"),
  timeframe: z.enum(["daily", "weekly", "monthly", "custom"]),
  description: z.string().optional(),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
});

interface VitalsGoalFormProps {
  onSubmit: (data: GoalFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function VitalsGoalForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
}: VitalsGoalFormProps) {
  const { userRole } = useUser();
  const isProvider = userRole === "provider";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "patient",
      vital_type: "weight",
      target_value: "",
      timeframe: "weekly",
      description: "",
      start_date: new Date(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });

  const selectedVitalType = form.watch("vital_type");
  // const selectedType = form.watch("type"); // Not used in current implementation

  const getPlaceholderText = (vitalType: VitalType) => {
    switch (vitalType) {
      case "weight":
        return "e.g., 150";
      case "blood_pressure":
        return "e.g., 120 (systolic target)";
      default:
        return "";
    }
  };

  const getTargetDescription = (vitalType: VitalType) => {
    switch (vitalType) {
      case "weight":
        return "Target weight in pounds";
      case "blood_pressure":
        return "Target systolic blood pressure (the top number)";
      default:
        return "";
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Goal Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select goal type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="patient">Personal Goal</SelectItem>
                  {isProvider && (
                    <SelectItem value="provider">Provider Goal</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vital_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vital Sign</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vital sign to track" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {vitalTypes.map((vital) => (
                    <SelectItem key={vital.value} value={vital.value}>
                      {vital.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="target_value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{getTargetDescription(selectedVitalType)}</FormLabel>
              <FormControl>
                <Input
                  placeholder={getPlaceholderText(selectedVitalType)}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="timeframe"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Timeframe</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {timeframeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any additional notes about this goal..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Goal"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
