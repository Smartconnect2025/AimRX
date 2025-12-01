"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { UserProfile, ContactInformationFormData } from "../types";
import { contactInformationSchema } from "../types";
import { useProfile } from "../hooks/useProfile";
import { US_STATES, getStateCode } from "../constants/states";
import { formatPhoneNumber } from "@/utils/format-phoneNumber";

interface ContactInformationFormProps {
  profile: UserProfile;
}

export function ContactInformationForm({
  profile,
}: ContactInformationFormProps) {
  const { updateContactInformation } = useProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ContactInformationFormData>({
    resolver: zodResolver(contactInformationSchema),
    defaultValues: {
      email: profile.email || "",
      phoneNumber: formatPhoneNumber(profile.phoneNumber || ""),
      streetAddressLine1: profile.streetAddressLine1 || "",
      streetAddressLine2: profile.streetAddressLine2 || "",
      city: profile.city || "",
      state: profile.state || "",
      zipPostalCode: profile.zipPostalCode || "",
    },
  });

  // Handle phone number formatting
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setValue("phoneNumber", formatted);
  };

  // Update form values when profile changes
  useEffect(() => {
    setValue("email", profile.email || "");
    setValue("phoneNumber", formatPhoneNumber(profile.phoneNumber || ""));
    setValue("streetAddressLine1", profile.streetAddressLine1 || "");
    setValue("streetAddressLine2", profile.streetAddressLine2 || "");
    setValue("city", profile.city || "");
    setValue("state", getStateCode(profile.state || ""));
    setValue("zipPostalCode", profile.zipPostalCode || "");
  }, [profile, setValue]);

  const onSubmit = async (data: ContactInformationFormData) => {
    setIsSubmitting(true);

    try {
      const result = await updateContactInformation(data);

      if (result.success) {
        toast.success("Contact information updated successfully");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          Contact Information
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        {/* Email Address */}
        <div>
          <Label htmlFor="email">
            Email Address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            className="mt-1"
            placeholder="jd@topfrightapps.com"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Phone Number */}
        <div>
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <div className="flex items-center gap-3 mt-1">
            <Input
              id="phoneNumber"
              {...register("phoneNumber")}
              onChange={handlePhoneNumberChange}
              placeholder="(555) 555-5555"
              className="flex-1"
              maxLength={14} // Max length for formatted phone number
            />
          </div>
          {errors.phoneNumber && (
            <p className="text-red-500 text-sm mt-1">
              {errors.phoneNumber.message}
            </p>
          )}
        </div>

        {/* Street Address */}
        <div>
          <Label htmlFor="streetAddressLine1">
            Street Address Line 1 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="streetAddressLine1"
            {...register("streetAddressLine1")}
            placeholder="123 Main St"
            className="mt-1"
          />
          {errors.streetAddressLine1 && (
            <p className="text-red-500 text-sm mt-1">
              {errors.streetAddressLine1.message}
            </p>
          )}
        </div>

        {/* Street Address Line 2 */}
        <div>
          <Label htmlFor="streetAddressLine2">Street Address Line 2</Label>
          <Input
            id="streetAddressLine2"
            {...register("streetAddressLine2")}
            placeholder="Apt 4B"
            className="mt-1"
          />
          {errors.streetAddressLine2 && (
            <p className="text-red-500 text-sm mt-1">
              {errors.streetAddressLine2.message}
            </p>
          )}
        </div>

        {/* City, State, ZIP */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label htmlFor="city">
              City <span className="text-destructive">*</span>
            </Label>
            <Input
              id="city"
              {...register("city")}
              placeholder="San Francisco"
              className="mt-1"
              onChange={(e) => {
                // remove numbers in realtime
                const value = e.target.value.replace(/[0-9]/g, "");
                setValue("city", value);
              }}
            />
            {errors.city && (
              <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="state">
              State <span className="text-destructive">*</span>
            </Label>
            <Select
              onValueChange={(value) => setValue("state", value)}
              defaultValue={getStateCode(profile.state || "") || undefined}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="California" />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map((state) => (
                  <SelectItem key={state.value} value={state.value}>
                    {state.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.state && (
              <p className="text-red-500 text-sm mt-1">
                {errors.state.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="zipPostalCode">
              ZIP/Postal Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="zipPostalCode"
              {...register("zipPostalCode")}
              placeholder="94105"
              className="mt-1"
            />
            {errors.zipPostalCode && (
              <p className="text-red-500 text-sm mt-1">
                {errors.zipPostalCode.message}
              </p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-start">
          <Button
            type="submit"
            disabled={isSubmitting}
            variant="default"
            className="px-6"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
