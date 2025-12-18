"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import React from "react";
import { UseFormReturn } from "react-hook-form";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/utils/tailwind-utils";
import { GENDER_OPTIONS } from "@/core/constants/provider-enums";
import { useAvatarUpload } from "@/hooks";
import { useUser } from "@core/auth";
import { useProviderProfile } from "../../hooks/use-provider-profile";

import { ProfileFormValues } from "./types";

interface PersonalInfoSectionProps {
  form: UseFormReturn<ProfileFormValues>;
}

export const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({
  form,
}) => {
  const { user } = useUser();
  const { updateAvatarUrl, refreshProfile } = useProviderProfile();

  // Avatar upload functionality
  const {
    isUploading: isAvatarUploading,
    previewUrl,
    handleFileSelect,
    handleAvatarClick,
    fileInputRef: avatarFileInputRef,
    getOptimizedUrl,
  } = useAvatarUpload({
    userId: user?.id || "",
    currentAvatarUrl: form.watch("avatarUrl"),
    onAvatarUpdate: async (newAvatarUrl) => {
      form.setValue("avatarUrl", newAvatarUrl);
      // Also update the database immediately
      const success = await updateAvatarUrl(newAvatarUrl);
      if (success) {
        // Refresh the profile to update the header
        await refreshProfile();
        // Dispatch event to update header immediately
        window.dispatchEvent(new CustomEvent("avatar-updated"));
      }
    },
  });

  // Get initials from first and last name for avatar fallback
  const getInitials = () => {
    const firstName = form.watch("firstName") || "";
    const lastName = form.watch("lastName") || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Profile Picture and Basic Info */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <Avatar
            className="w-16 h-16 bg-blue-100 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleAvatarClick}
          >
            <AvatarImage
              src={previewUrl || getOptimizedUrl(64)}
              alt="Profile Picture"
            />
            <AvatarFallback className="text-blue-600 font-semibold text-lg">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          {isAvatarUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-medium text-gray-900">
            {form.watch("firstName") || ""} {form.watch("lastName") || ""}
          </h3>
        </div>
        <input
          ref={avatarFileInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
        />
      </div>

      {/* Name Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                First Name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} className="mt-1" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Last Name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} className="mt-1" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Date of Birth and Gender */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="dob"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Date of Birth <span className="text-destructive">*</span>
              </FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "bg-white w-full justify-start text-left font-normal mt-1 border border-gray-200 hover:bg-white",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? (
                        format(field.value, "MMMM do, yyyy")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border border-gray-200">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Gender <span className="text-destructive">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {GENDER_OPTIONS.map((option) => (
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
      </div>
    </div>
  );
};
