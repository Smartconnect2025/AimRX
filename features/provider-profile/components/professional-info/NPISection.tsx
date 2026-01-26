"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { ProfessionalInfoValues } from "./types";

interface NPISectionProps {
  form: UseFormReturn<ProfessionalInfoValues>;
}

export const NPISection: React.FC<NPISectionProps> = ({ form }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold">National Provider Identifier</h3>
      <FormField
        control={form.control}
        name="npiNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>NPI Number</FormLabel>
            <FormControl>
              <Input
                className="mt-1 max-w-md"
                {...field}
                placeholder="1234567890"
                maxLength={10}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
              />
            </FormControl>
            <FormDescription className="text-xs text-muted-foreground">
              Your 10-digit National Provider Identifier (NPI) number
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
