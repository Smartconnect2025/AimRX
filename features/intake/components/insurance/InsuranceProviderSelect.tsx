"use client";

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
import { UseFormReturn } from "react-hook-form";
import {
  InsuranceFormValues,
  insuranceProviders,
} from "../../schemas/insurance";

interface InsuranceProviderSelectProps {
  form: UseFormReturn<InsuranceFormValues>;
}

export function InsuranceProviderSelect({
  form,
}: InsuranceProviderSelectProps) {
  return (
    <FormField
      control={form.control}
      name="provider"
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            Insurance Provider<span className="text-destructive">*</span>
          </FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger className="bg-white w-full">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {insuranceProviders.map((provider) => (
                <SelectItem key={provider} value={provider}>
                  {provider}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
