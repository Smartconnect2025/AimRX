"use client";

import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import {
  MedicalHistoryFormValues,
  severityOptions,
} from "@/features/intake/schemas/medical-history";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface AllergyFormProps {
  form: UseFormReturn<MedicalHistoryFormValues>;
  index: number;
  onRemove: () => void;
}

export function AllergyForm({ form, index, onRemove }: AllergyFormProps) {
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50 border border-border">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Allergy {index + 1}</h4>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4">
        <FormField
          control={form.control}
          name={`allergies.${index}.allergen`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Allergen <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g., Penicillin, Peanuts" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`allergies.${index}.reaction`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Reaction <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the allergic reaction"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`allergies.${index}.severity`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Severity <span className="text-destructive">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {severityOptions.map((severity) => (
                    <SelectItem key={severity} value={severity}>
                      {severity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
