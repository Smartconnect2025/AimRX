"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Goal } from "../types";

// Legacy GoalFormData interface for backward compatibility
interface LegacyGoalFormData {
  type?: "common" | "provider" | "custom";
  metric: string;
  description?: string;
  category?:
    | "exercise"
    | "nutrition"
    | "medication"
    | "sleep"
    | "mental_health"
    | "vital_signs"
    | "other";
  target_value: string;
  unit?: string;
  start_date?: Date;
  end_date?: Date;
  timeframe: "daily" | "weekly" | "monthly" | "custom";
}
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

const typeOptions = [
  { value: "common", label: "Personal" },
  { value: "provider", label: "Provider" },
  { value: "custom", label: "Custom" },
];
const metricOptions = [
  { value: "steps", label: "Steps" },
  { value: "sleep", label: "Sleep Hours" },
  { value: "water", label: "Water Intake" },
  { value: "exercise", label: "Exercise Minutes" },
  { value: "medication_lipitor", label: "Medication Adherence - Lipitor" },
  { value: "journaling", label: "Journaling" },
  { value: "deep_breathing", label: "Deep Breathing" },
];
const timeframeOptions = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Custom" },
];

const formSchema = z.object({
  type: z.enum(["common", "provider", "custom"]),
  metric: z.string().min(1, "Metric is required"),
  target_value: z.string().min(1, "Target value is required"),
  timeframe: z.enum(["daily", "weekly", "monthly", "custom"]),
  description: z.string().optional(),
  unit: z.string().optional(),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  category: z
    .enum([
      "exercise",
      "nutrition",
      "medication",
      "sleep",
      "mental_health",
      "vital_signs",
      "other",
    ])
    .optional(),
});

interface GoalFormProps {
  onSubmit: (data: LegacyGoalFormData) => void;
  initialData?: Partial<Goal>;
}

export function GoalForm({ onSubmit, initialData }: GoalFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          type:
            (initialData.type as "common" | "provider" | "custom") || "common",
          metric: initialData.metric || "",
          target_value: initialData.target_value || "",
          timeframe:
            (initialData.timeframe as
              | "daily"
              | "weekly"
              | "monthly"
              | "custom") || "daily",
          description: initialData.description || "",
          unit: initialData.unit || "",
          start_date: initialData.start_date
            ? new Date(initialData.start_date)
            : undefined,
          end_date: initialData.end_date
            ? new Date(initialData.end_date)
            : undefined,
          category: initialData.category as
            | "exercise"
            | "nutrition"
            | "medication"
            | "sleep"
            | "mental_health"
            | "vital_signs"
            | "other"
            | undefined,
        }
      : {
          type: "common",
          metric: "",
          target_value: "",
          timeframe: "daily",
          description: "",
          unit: "",
          start_date: undefined,
          end_date: undefined,
          category: undefined,
        },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => onSubmit(data))}
        className="space-y-6"
      >
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {typeOptions.map((option) => (
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
          name="metric"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Metric</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {metricOptions.map((option) => (
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
          name="target_value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Value</FormLabel>
              <FormControl>
                <Input placeholder="Enter target value" {...field} />
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter goal description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" variant="default">
          {initialData ? "Update Goal" : "Create Goal"}
        </Button>
      </form>
    </Form>
  );
}
