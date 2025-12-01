"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";

import {
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

import { PracticeDetailsValues } from "./types";
import { US_STATES } from "@/core/constants/provider-enums";

interface AddressSectionProps {
  form: UseFormReturn<PracticeDetailsValues>;
}

export const AddressSection: React.FC<AddressSectionProps> = ({ form }) => {
  return (
    <div className="space-y-6">
      {/* Street Address 1 */}
      <FormField
        control={form.control}
        name="streetAddress1"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Street Address Line 1 <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Input {...field} className="mt-1" placeholder="123 Main St" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Street Address 2 */}
      <FormField
        control={form.control}
        name="streetAddress2"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Street Address Line 2</FormLabel>
            <FormControl>
              <Input {...field} className="mt-1" placeholder="Apt 4B" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* City, State, ZIP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                City <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="mt-1"
                  placeholder="San Francisco"
                  onChange={(e) => {
                    // remove numbers in realtime
                    const value = e.target.value.replace(/[0-9]/g, "");
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                State <span className="text-destructive">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="California" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
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
          name="zipCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                ZIP/Postal Code <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} className="mt-1" placeholder="94105" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
