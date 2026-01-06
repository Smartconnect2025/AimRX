"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";

import { ContactInfoSection } from "../profile/ContactInfoSection";
import { PersonalInfoSection } from "../profile/PersonalInfoSection";
import { PaymentBillingSection } from "../profile/PaymentBillingSection";
import {
  profileFormValidationSchema,
  ProfileFormValues,
} from "../profile/types";
import { useProviderProfile } from "../../hooks/use-provider-profile";
import { Button } from "@/components/ui/button";
import { PasswordChangeForm } from "./PasswordChangeForm";
import { Loader2 } from "lucide-react";

export function ProfileForm() {
  const { profile, updatePersonalInfo, isSubmitting } = useProviderProfile();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormValidationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dob: undefined,
      gender: "male",
      email: "",
      phoneNumber: "",
      avatarUrl: "",
      physicalAddress: {
        street: "",
        city: "",
        state: "",
        zip: "",
        country: "USA",
      },
      billingAddress: {
        street: "",
        city: "",
        state: "",
        zip: "",
        country: "USA",
      },
      taxId: "",
      paymentMethod: "bank_transfer",
      paymentSchedule: "monthly",
      paymentDetails: {
        bankName: "",
        accountHolderName: "",
        accountNumber: "",
        routingNumber: "",
        accountType: "checking",
        swiftCode: "",
      },
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        firstName: profile.first_name || "",
        lastName: profile.last_name || "",
        dob: profile.date_of_birth
          ? new Date(profile.date_of_birth)
          : undefined,
        gender: profile.gender || "male",
        email: profile.email || "", // Use provider email from database
        phoneNumber: profile.phone_number || "",
        avatarUrl: profile.avatar_url || "",
        physicalAddress: (profile.physical_address as unknown as Record<string, string> | null) || {
          street: "",
          city: "",
          state: "",
          zip: "",
          country: "USA",
        },
        billingAddress: (profile.billing_address as unknown as Record<string, string> | null) || {
          street: "",
          city: "",
          state: "",
          zip: "",
          country: "USA",
        },
        taxId: profile.tax_id || "",
        paymentMethod: profile.payment_method || "bank_transfer",
        paymentSchedule: profile.payment_schedule || "monthly",
        paymentDetails: (profile.payment_details as unknown as Record<string, string> | null) || {
          bankName: "",
          accountHolderName: "",
          accountNumber: "",
          routingNumber: "",
          accountType: "checking",
          swiftCode: "",
        },
      });
    }
  }, [profile, form]);

  async function onSubmit(data: ProfileFormValues) {
    const success = await updatePersonalInfo(data);
    if (success) {
      form.reset(form.getValues());
    }
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
        </div>

        <Form {...form}>
          <form
            id="profile-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="p-6 space-y-6"
          >
            <PersonalInfoSection form={form} />

            <Separator className="bg-gray-200" />

            <ContactInfoSection form={form} />

            <Separator className="bg-gray-200" />

            <PaymentBillingSection form={form} />

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                variant="default"
                className="px-6"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <PasswordChangeForm />
    </div>
  );
}
