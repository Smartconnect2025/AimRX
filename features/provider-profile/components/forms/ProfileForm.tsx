"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";

import { ContactInfoSection } from "../profile/ContactInfoSection";
import { PersonalInfoSection } from "../profile/PersonalInfoSection";
import { NPISection } from "../profile/NPISection";
import { MedicalLicenseSection } from "../profile/MedicalLicenseSection";
import { AddressSection } from "../profile/AddressSection";
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
  const [tierLevel, setTierLevel] = useState<string>("Not set");

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormValidationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      avatarUrl: "",
      npiNumber: "",
      medicalLicenses: [],
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

  // Fetch tier level from API for the current provider
  useEffect(() => {
    async function fetchTierLevel() {
      if (!profile?.id) return;

      try {
        // Use the provider-specific endpoint (doesn't require admin access)
        const response = await fetch('/api/provider/tier');
        if (response.ok) {
          const data = await response.json();
          if (data.tier_level) {
            setTierLevel(data.tier_level);
          }
        }
      } catch (error) {
        console.error('Failed to fetch tier level:', error);
      }
    }

    fetchTierLevel();
  }, [profile?.id]);

  useEffect(() => {
    if (profile) {
      // Parse medical licenses from database
      let medicalLicenses: Array<{ licenseNumber: string; state: string }> = [];
      if (profile.medical_licenses) {
        try {
          if (typeof profile.medical_licenses === 'string') {
            medicalLicenses = JSON.parse(profile.medical_licenses);
          } else if (Array.isArray(profile.medical_licenses)) {
            medicalLicenses = profile.medical_licenses;
          }
        } catch (e) {
          console.error('Failed to parse medical licenses:', e);
        }
      }

      form.reset({
        firstName: profile.first_name || "",
        lastName: profile.last_name || "",
        email: profile.email || "",
        phoneNumber: profile.phone_number || "",
        avatarUrl: profile.avatar_url || "",
        npiNumber: profile.npi_number || "",
        medicalLicenses: medicalLicenses,
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
        paymentDetails: (() => {
          const details = profile.payment_details as unknown as Record<string, string> | null;
          if (details) {
            return {
              bankName: details.bank_name || "",
              accountHolderName: details.account_holder_name || "",
              accountNumber: details.account_number || "",
              routingNumber: details.routing_number || "",
              accountType: details.account_type || "checking",
              swiftCode: details.swift_code || "",
            };
          }
          return {
            bankName: "",
            accountHolderName: "",
            accountNumber: "",
            routingNumber: "",
            accountType: "checking",
            swiftCode: "",
          };
        })(),
      });
    }
  }, [profile, form]);

  async function onSubmit(data: ProfileFormValues) {
    const success = await updatePersonalInfo(data);
    if (success) {
      form.reset(form.getValues());

      // Refetch tier level after successful save
      try {
        const response = await fetch('/api/provider/tier');
        if (response.ok) {
          const tierData = await response.json();
          if (tierData.tier_level) {
            setTierLevel(tierData.tier_level);
          }
        }
      } catch (error) {
        console.error('Failed to refresh tier level:', error);
      }
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
            <PersonalInfoSection form={form} tierLevel={tierLevel} />

            <Separator className="bg-gray-200" />

            <ContactInfoSection form={form} />

            <Separator className="bg-gray-200" />

            <NPISection form={form} />

            <Separator className="bg-gray-200" />

            <MedicalLicenseSection form={form} />

            <Separator className="bg-gray-200" />

            <AddressSection form={form} />

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
