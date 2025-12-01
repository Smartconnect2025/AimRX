"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { TrackerModal } from "@/features/shared";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const vitalTypes = [
  { value: "weight", label: "Weight" },
  { value: "blood_pressure", label: "Blood Pressure" },
] as const;

const formSchema = z
  .object({
    type: z.enum(["weight", "blood_pressure"]),
    weight: z.number().min(1).max(1000).optional(),
    systolic: z.number().min(70).max(250).optional(),
    diastolic: z.number().min(40).max(150).optional(),
  })
  .refine(
    (data) => {
      if (data.type === "weight") {
        return data.weight !== undefined && data.weight > 0;
      }
      if (data.type === "blood_pressure") {
        return (
          data.systolic !== undefined &&
          data.diastolic !== undefined &&
          data.systolic > 0 &&
          data.diastolic > 0
        );
      }
      return false;
    },
    {
      message: "Please provide all required values for the selected vital type",
      path: ["root"],
    },
  );

type FormData = z.infer<typeof formSchema>;

interface ManualVitalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVitalLogged?: () => void;
}

export function ManualVitalsModal({
  isOpen,
  onClose,
  onVitalLogged,
}: ManualVitalsModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "weight",
    },
  });

  const selectedType = form.watch("type");

  const handleSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);

      const payload: Record<string, unknown> = {
        type: data.type,
      };

      if (data.type === "weight") {
        payload.value = data.weight;
      } else if (data.type === "blood_pressure") {
        payload.systolic = data.systolic;
        payload.diastolic = data.diastolic;
      }

      const response = await fetch("/api/vitals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to log vital");
      }

      toast.success(
        `${data.type === "weight" ? "Weight" : "Blood pressure"} logged successfully!`,
      );

      form.reset();
      onClose();
      onVitalLogged?.();
    } catch (error) {
      console.error("Failed to log vital:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to log vital",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <TrackerModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Log Vital Signs"
      description="Manually record your weight or blood pressure"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vital Type</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Reset other fields when type changes
                    form.setValue("weight", undefined);
                    form.setValue("systolic", undefined);
                    form.setValue("diastolic", undefined);
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vital type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vitalTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedType === "weight" && (
            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight (lbs)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter weight in pounds"
                      step="0.1"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value ? parseFloat(value) : undefined);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {selectedType === "blood_pressure" && (
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="systolic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Systolic (mmHg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="120"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value ? parseInt(value) : undefined);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="diastolic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diastolic (mmHg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="80"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value ? parseInt(value) : undefined);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Logging..." : "Log Vital"}
            </Button>
          </div>
        </form>
      </Form>
    </TrackerModal>
  );
}
