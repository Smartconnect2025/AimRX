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

import { ProfileFormValues } from "./types";

interface ContactInfoSectionProps {
  form: UseFormReturn<ProfileFormValues>;
}

export const ContactInfoSection: React.FC<ContactInfoSectionProps> = ({
  form,
}) => {
  return (
    <div className="space-y-6">
      {/* Email Address - Read-only */}
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email Address</FormLabel>
            <FormControl>
              <Input
                {...field}
                disabled
                className="bg-gray-50 cursor-not-allowed"
                placeholder=""
              />
            </FormControl>
            <p className="text-sm text-gray-500 mt-1">
              Email cannot be changed from this form
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Phone Number */}
      <FormField
        control={form.control}
        name="phoneNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Phone Number</FormLabel>
            <FormControl>
              <Input {...field} placeholder="(555) 555-5555" maxLength={14} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
