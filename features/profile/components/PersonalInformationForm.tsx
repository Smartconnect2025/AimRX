"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/utils/tailwind-utils";
import { toast } from "sonner";
import type { UserProfile, PersonalInformationFormData } from "../types";
import { personalInformationSchema } from "../types";
import { useProfile } from "../hooks/useProfile";
import { getInitials } from "../utils";
import { useAvatarUpload } from "@/hooks";
import { useUser } from "@core/auth";

interface PersonalInformationFormProps {
  profile: UserProfile;
}

export function PersonalInformationForm({
  profile,
}: PersonalInformationFormProps) {
  const { updatePersonalInformation, updateAvatarUrl, refreshProfile } =
    useProfile();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<Date | undefined>(
    profile.dateOfBirth ? new Date(profile.dateOfBirth) : undefined,
  );

  // Avatar upload functionality
  const {
    isUploading: isAvatarUploading,
    previewUrl,
    handleFileSelect,
    handleAvatarClick,
    fileInputRef,
    getOptimizedUrl,
  } = useAvatarUpload({
    userId: user?.id || "",
    currentAvatarUrl: profile.avatarUrl,
    onAvatarUpdate: async (newAvatarUrl) => {
      // Update the profile with new avatar URL
      const result = await updateAvatarUrl(newAvatarUrl);
      if (!result.success) {
        toast.error(result.message);
      } else {
        // Refresh the profile to update the header
        await refreshProfile();
        // Dispatch event to update header immediately
        window.dispatchEvent(new CustomEvent("avatar-updated"));

        // Update CometChat user avatar (non-blocking)
        try {
          await fetch("/api/cometchat/user/update-avatar", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ avatarUrl: newAvatarUrl }),
          });
        } catch (error) {
          console.warn("Failed to update CometChat avatar:", error);
        }
      }
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PersonalInformationFormData>({
    resolver: zodResolver(personalInformationSchema),
    defaultValues: {
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      displayName: profile.displayName || "",
      dateOfBirth: profile.dateOfBirth || "",
      gender: (profile.gender || "") as PersonalInformationFormData["gender"],
    },
  });

  // Update form values when profile changes
  useEffect(() => {
    setValue("firstName", profile.firstName || "");
    setValue("lastName", profile.lastName || "");
    setValue("displayName", profile.displayName || "");
    setValue("dateOfBirth", profile.dateOfBirth || "");
    setValue(
      "gender",
      (profile.gender || "") as PersonalInformationFormData["gender"],
    );

    // Update date state
    setDate(profile.dateOfBirth ? new Date(profile.dateOfBirth) : undefined);
  }, [profile, setValue]);

  // Watch form values for real-time updates
  const watchedFirstName = watch("firstName");
  const watchedLastName = watch("lastName");

  const onSubmit = async (data: PersonalInformationFormData) => {
    setIsSubmitting(true);

    try {
      const result = await updatePersonalInformation(data);

      if (result.success) {
        toast.success("Personal information updated successfully");
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
        <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
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
                {getInitials(watchedFirstName, watchedLastName)}
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
              {watchedFirstName || profile.firstName}{" "}
              {watchedLastName || profile.lastName}
            </h3>
          </div>
          <input
            ref={fileInputRef}
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
          <div>
            <Label htmlFor="firstName">
              First Name <span className="text-destructive">*</span>
            </Label>
            <Input id="firstName" {...register("firstName")} className="mt-1" />
            {errors.firstName && (
              <p className="text-red-500 text-sm mt-1">
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="lastName">
              Last Name <span className="text-destructive">*</span>
            </Label>
            <Input id="lastName" {...register("lastName")} className="mt-1" />
            {errors.lastName && (
              <p className="text-red-500 text-sm mt-1">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        {/* Date of Birth and Gender */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>
              Date of Birth <span className="text-destructive">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "bg-white w-full justify-start text-left font-normal mt-1 border border-gray-200 hover:bg-white",
                    !date && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? (
                    format(date, "MMMM do, yyyy")
                  ) : (
                    <span>December 31st, 1989</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border border-gray-200">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => {
                    setDate(newDate);
                    setValue(
                      "dateOfBirth",
                      newDate ? format(newDate, "yyyy-MM-dd") : "",
                    );
                  }}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="gender">
              Gender <span className="text-destructive">*</span>
            </Label>
            <Select
              onValueChange={(value) =>
                setValue(
                  "gender",
                  value as PersonalInformationFormData["gender"],
                )
              }
              defaultValue={profile.gender || undefined}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && (
              <p className="text-red-500 text-sm mt-1">
                {errors.gender.message}
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
