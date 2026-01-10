"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProfileFormValues } from "./types";

interface NPINumberSectionProps {
  form: UseFormReturn<ProfileFormValues>;
}

export const NPINumberSection: React.FC<NPINumberSectionProps> = ({ form }) => {
  const npiValue = form.watch("npiNumber");

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold">National Provider Identifier</h3>
      <div>
        <Label htmlFor="npiNumber">NPI Number</Label>
        <Input
          id="npiNumber"
          type="text"
          maxLength={10}
          placeholder="1234567890"
          value={npiValue || ""}
          onChange={(e) => form.setValue("npiNumber", e.target.value)}
          className="max-w-md"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Your 10-digit National Provider Identifier
        </p>
      </div>
    </div>
  );
};
