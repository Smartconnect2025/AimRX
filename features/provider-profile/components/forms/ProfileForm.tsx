"use client";

import React, { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useFormPersistence } from "@/hooks/useFormPersistence";

import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";

import { ContactInfoSection } from "../profile/ContactInfoSection";
import { PersonalInfoSection } from "../profile/PersonalInfoSection";
import { MedicalLicenseSection } from "../profile/MedicalLicenseSection";
import { SignatureSection } from "../profile/SignatureSection";
import {
  profileFormValidationSchema,
  ProfileFormValues,
} from "../profile/types";
import { useProviderProfile } from "../../hooks/use-provider-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PasswordChangeForm } from "./PasswordChangeForm";
import { NotificationPreferences } from "../NotificationPreferences";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useUser } from "@core/auth";
import { createClient } from "@core/supabase";

export function ProfileForm() {
  const { user } = useUser();
  const { profile, updatePersonalInfo, isSubmitting } = useProviderProfile();
  const [tierLevel, setTierLevel] = useState<string>("Not set");
  const [groupInfo, setGroupInfo] = useState<{
    name: string;
    platform_manager_name: string | null;
  } | null>(null);
  const hasResetFromDbRef = useRef(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormValidationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      companyName: "",
      avatarUrl: "",
      signatureUrl: "",
      npiNumber: "",
      medicalLicenses: [],
      physicalAddress: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "USA",
      },
      billingAddress: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
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
      defaultShippingFee: 40,
    },
    mode: "onChange",
  });

  const [billingSameAsPhysical, setBillingSameAsPhysical] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { clearPersistedData } = useFormPersistence({
    storageKey: `provider-profile-${user?.id || "draft"}`,
    watch: form.watch,
    setValue: form.setValue,
    excludeFields: ["paymentDetails"] as (keyof ProfileFormValues)[],
    disabled: !user?.id,
  });

  useEffect(() => {
    if (user?.id) {
      try {
        localStorage.removeItem(`provider-payment-billing-${user.id}`);
      } catch (_e) {}
    }
  }, [user?.id]);

  // Fetch tier level from API for the current provider
  useEffect(() => {
    async function fetchTierLevel() {
      if (!profile?.id) return;

      try {
        // Use the provider-specific endpoint (doesn't require admin access)
        const response = await fetch("/api/provider/tier");
        if (response.ok) {
          const data = await response.json();
          if (data.tier_level) {
            setTierLevel(data.tier_level);
          }
        }
      } catch (error) {
        console.error("Failed to fetch tier level:", error);
      }
    }

    fetchTierLevel();
  }, [profile?.id]);

  // Fetch group info when profile loads
  useEffect(() => {
    async function fetchGroup() {
      if (!profile?.group_id) {
        setGroupInfo(null);
        return;
      }

      const supabase = createClient();
      const { data: group } = await supabase
        .from("groups")
        .select("name, platform_manager_id")
        .eq("id", profile.group_id)
        .single();

      if (group) {
        let pmName: string | null = null;
        if (group.platform_manager_id) {
          const { data: pm } = await supabase
            .from("platform_managers")
            .select("name")
            .eq("id", group.platform_manager_id)
            .single();
          pmName = pm?.name || null;
        }
        setGroupInfo({ name: group.name, platform_manager_name: pmName });
      }
    }

    fetchGroup();
  }, [profile?.group_id]);

  useEffect(() => {
    if (profile && !hasResetFromDbRef.current) {
      hasResetFromDbRef.current = true;

      // Check for persisted localStorage data
      const storageKey = `provider-profile-${user?.id || "draft"}`;
      let persistedData: Partial<ProfileFormValues> = {};
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          persistedData = JSON.parse(saved);
        }
      } catch (e) {
        console.error("Failed to parse persisted data:", e);
      }

      // Parse medical licenses from database
      let medicalLicenses: Array<{ licenseNumber: string; state: string }> = [];
      if (profile.medical_licenses) {
        try {
          if (typeof profile.medical_licenses === "string") {
            medicalLicenses = JSON.parse(profile.medical_licenses);
          } else if (Array.isArray(profile.medical_licenses)) {
            medicalLicenses = profile.medical_licenses;
          }
        } catch (e) {
          console.error("Failed to parse medical licenses:", e);
        }
      }

      // Build DB values
      const dbValues: ProfileFormValues = {
        firstName: profile.first_name || "",
        lastName: profile.last_name || "",
        email: profile.email || "",
        phoneNumber: profile.phone_number || "",
        companyName: profile.company_name || "",
        avatarUrl: profile.avatar_url || "",
        signatureUrl: profile.signature_url || "",
        npiNumber: profile.npi_number || "",
        medicalLicenses: medicalLicenses,
        physicalAddress: (() => {
          const addr = profile.physical_address as { street?: string; city?: string; state?: string; zipCode?: string; country?: string } | null;
          return {
            street: addr?.street || "",
            city: addr?.city || "",
            state: addr?.state || "",
            zipCode: addr?.zipCode || "",
            country: addr?.country || "USA",
          };
        })(),
        billingAddress: (profile.billing_address as unknown as Record<
          string,
          string
        > | null) || {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "USA",
        },
        taxId: profile.tax_id || "",
        paymentMethod: profile.payment_method || "bank_transfer",
        paymentSchedule: profile.payment_schedule || "monthly",
        defaultShippingFee: profile.default_shipping_fee ?? 40,
        paymentDetails: (() => {
          const details = profile.payment_details as unknown as Record<
            string,
            string
          > | null;
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
      };

      const mergedValues: ProfileFormValues = {
        ...dbValues,
        ...persistedData,
        paymentDetails: dbValues.paymentDetails,
      };

      form.reset(mergedValues);

      const pa = dbValues.physicalAddress;
      const ba = dbValues.billingAddress;
      if (ba && pa && pa.street && ba.street === pa.street && ba.city === pa.city && ba.state === pa.state && ba.zipCode === pa.zipCode) {
        setBillingSameAsPhysical(true);
      }
    }
  }, [profile, form, user?.id]);

  async function onSubmit(data: ProfileFormValues) {
    if (billingSameAsPhysical) {
      data.billingAddress = { ...data.physicalAddress };
    }

    const success = await updatePersonalInfo(data);
    if (success) {
      clearPersistedData();
      form.reset(form.getValues());
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);

      try {
        localStorage.removeItem(`provider-payment-billing-${user?.id}`);
      } catch (_e) {}

      try {
        const response = await fetch("/api/provider/tier");
        if (response.ok) {
          const tierData = await response.json();
          if (tierData.tier_level) {
            setTierLevel(tierData.tier_level);
          }
        }
      } catch (error) {
        console.error("Failed to refresh tier level:", error);
      }
    }
  }

  function handleBillingSameToggle(checked: boolean) {
    setBillingSameAsPhysical(checked);
    if (checked) {
      const physical = form.getValues("physicalAddress");
      form.setValue("billingAddress", { ...physical }, { shouldDirty: true });
    }
  }

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form
          id="profile-form"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
            </div>

            <div className="p-6 space-y-6">
              <PersonalInfoSection form={form} tierLevel={tierLevel} />

              <Separator className="bg-gray-200" />

              {groupInfo && (
                <>
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold">Group Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="groupName">Group</Label>
                        <Input
                          id="groupName"
                          value={groupInfo.name}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="platformManager">Platform Manager</Label>
                        <Input
                          id="platformManager"
                          value={groupInfo.platform_manager_name || "Not assigned"}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-gray-200" />
                </>
              )}

              <ContactInfoSection form={form} />

              <Separator className="bg-gray-200" />

              <MedicalLicenseSection form={form} />

              <Separator className="bg-gray-200" />

              <SignatureSection form={form} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm mt-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Payment & Billing</h2>
              <p className="text-sm text-gray-500 mt-1">Your address and payment information</p>
            </div>

            <div className="p-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle data-testid="text-physical-address-title">Physical Address</CardTitle>
                  <CardDescription>Your primary practice or office location</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="physicalStreet">Street Address</Label>
                    <Input
                      id="physicalStreet"
                      data-testid="input-physical-street"
                      {...form.register("physicalAddress.street")}
                      placeholder="123 Main St"
                    />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="physicalCity">City</Label>
                      <Input
                        id="physicalCity"
                        data-testid="input-physical-city"
                        {...form.register("physicalAddress.city")}
                        placeholder="New York"
                      />
                    </div>
                    <div>
                      <Label htmlFor="physicalState">State</Label>
                      <Input
                        id="physicalState"
                        data-testid="input-physical-state"
                        {...form.register("physicalAddress.state")}
                        placeholder="NY"
                      />
                    </div>
                    <div>
                      <Label htmlFor="physicalZip">ZIP</Label>
                      <Input
                        id="physicalZip"
                        data-testid="input-physical-zip"
                        {...form.register("physicalAddress.zipCode")}
                        placeholder="10001"
                      />
                    </div>
                    <div>
                      <Label htmlFor="physicalCountry">Country</Label>
                      <Input
                        id="physicalCountry"
                        data-testid="input-physical-country"
                        {...form.register("physicalAddress.country")}
                        placeholder="USA"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle data-testid="text-billing-address-title">Billing Address</CardTitle>
                  <CardDescription>Where you would like to receive payments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2 pb-2">
                    <input
                      type="checkbox"
                      id="sameAsPhysical"
                      data-testid="checkbox-same-as-physical"
                      checked={billingSameAsPhysical}
                      onChange={(e) => handleBillingSameToggle(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="sameAsPhysical" className="text-sm font-normal cursor-pointer">
                      Same as Physical Address
                    </Label>
                  </div>
                  <div>
                    <Label htmlFor="billingStreet">Street Address</Label>
                    <Input
                      id="billingStreet"
                      data-testid="input-billing-street"
                      {...form.register("billingAddress.street")}
                      disabled={billingSameAsPhysical}
                      className={billingSameAsPhysical ? "bg-gray-100 cursor-not-allowed" : ""}
                      placeholder="123 Main St"
                    />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="billingCity">City</Label>
                      <Input
                        id="billingCity"
                        data-testid="input-billing-city"
                        {...form.register("billingAddress.city")}
                        disabled={billingSameAsPhysical}
                        className={billingSameAsPhysical ? "bg-gray-100 cursor-not-allowed" : ""}
                        placeholder="New York"
                      />
                    </div>
                    <div>
                      <Label htmlFor="billingState">State</Label>
                      <Input
                        id="billingState"
                        data-testid="input-billing-state"
                        {...form.register("billingAddress.state")}
                        disabled={billingSameAsPhysical}
                        className={billingSameAsPhysical ? "bg-gray-100 cursor-not-allowed" : ""}
                        placeholder="NY"
                      />
                    </div>
                    <div>
                      <Label htmlFor="billingZip">ZIP</Label>
                      <Input
                        id="billingZip"
                        data-testid="input-billing-zip"
                        {...form.register("billingAddress.zipCode")}
                        disabled={billingSameAsPhysical}
                        className={billingSameAsPhysical ? "bg-gray-100 cursor-not-allowed" : ""}
                        placeholder="10001"
                      />
                    </div>
                    <div>
                      <Label htmlFor="billingCountry">Country</Label>
                      <Input
                        id="billingCountry"
                        data-testid="input-billing-country"
                        {...form.register("billingAddress.country")}
                        disabled={billingSameAsPhysical}
                        className={billingSameAsPhysical ? "bg-gray-100 cursor-not-allowed" : ""}
                        placeholder="USA"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="taxId">Tax ID / EIN</Label>
                    <Input
                      id="taxId"
                      data-testid="input-tax-id"
                      {...form.register("taxId")}
                      placeholder="XX-XXXXXXX"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-200 py-4 px-6 mt-8 rounded-lg shadow-lg z-10">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
              {saveSuccess ? (
                <div className="flex items-center gap-2 text-green-600 animate-in fade-in duration-300" data-testid="text-save-success">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-medium">All changes saved successfully</span>
                </div>
              ) : (
                <div />
              )}
              <Button
                type="submit"
                data-testid="button-save-profile"
                className="px-8 py-2.5 bg-[#66cdcc] hover:bg-[#55bcbb] text-white font-medium min-w-[200px]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving all changes...
                  </>
                ) : (
                  "Save All Changes"
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>

      <NotificationPreferences />

      <PasswordChangeForm />
    </div>
  );
}
