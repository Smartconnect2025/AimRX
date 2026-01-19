"use client";

import React, { useState, useEffect } from "react";
import { useStatePersistence } from "@/hooks/useStatePersistence";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createClient } from "@core/supabase";
import { toast } from "sonner";
import { useUser } from "@core/auth";

export function PaymentBillingForm() {
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [billingSameAsPhysical, setBillingSameAsPhysical] = useState(true);

  const [formData, setFormData] = useState({
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
    paymentDetails: {
      bank_name: "",
      account_holder_name: "",
      account_number: "",
      routing_number: "",
      account_type: "checking",
      swift_code: "",
    },
    paymentMethod: "bank_transfer",
    paymentSchedule: "monthly",
    discountRate: "",
  });

  // Persist form data to localStorage
  const { clearPersistedData } = useStatePersistence({
    storageKey: `provider-payment-form-${user?.id || 'draft'}`,
    state: formData,
    setState: setFormData,
    disabled: false, // Always persist for providers
  });

  // Load existing data
  useEffect(() => {
    const loadProviderData = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      const supabase = createClient();

      try {
        const { data, error } = await supabase
          .from("providers")
          .select("physical_address, billing_address, tax_id, payment_details, payment_method, payment_schedule, discount_rate")
          .eq("user_id", user.id)
          .single();

        if (error) throw error;

        if (data) {
          setFormData({
            physicalAddress: data.physical_address || {
              street: "",
              city: "",
              state: "",
              zip: "",
              country: "USA",
            },
            billingAddress: data.billing_address || {
              street: "",
              city: "",
              state: "",
              zip: "",
              country: "USA",
            },
            taxId: data.tax_id || "",
            paymentDetails: data.payment_details || {
              bank_name: "",
              account_holder_name: "",
              account_number: "",
              routing_number: "",
              account_type: "checking",
              swift_code: "",
            },
            paymentMethod: data.payment_method || "bank_transfer",
            paymentSchedule: data.payment_schedule || "monthly",
            discountRate: data.discount_rate || "",
          });
        }
      } catch (error) {
        console.error("Error loading provider data:", error);
        toast.error("Failed to load payment information");
      } finally {
        setIsLoading(false);
      }
    };

    loadProviderData();
  }, [user?.id]);

  // Handle billing address same as physical address checkbox
  const handleBillingSameAsPhysical = (checked: boolean) => {
    setBillingSameAsPhysical(checked);
    if (checked) {
      // Copy physical address to billing address
      setFormData({
        ...formData,
        billingAddress: {
          street: formData.physicalAddress.street,
          city: formData.physicalAddress.city,
          state: formData.physicalAddress.state,
          zip: formData.physicalAddress.zip,
          country: formData.physicalAddress.country,
        },
      });
    }
  };

  // Auto-populate billing address on mount when checkbox is checked by default
  useEffect(() => {
    if (billingSameAsPhysical && !isLoading) {
      // Copy physical address to billing address when form loads
      if (formData.physicalAddress.street || formData.physicalAddress.city) {
        setFormData({
          ...formData,
          billingAddress: {
            street: formData.physicalAddress.street,
            city: formData.physicalAddress.city,
            state: formData.physicalAddress.state,
            zip: formData.physicalAddress.zip,
            country: formData.physicalAddress.country,
          },
        });
      }
    }
  }, [billingSameAsPhysical, isLoading, formData.physicalAddress.street, formData.physicalAddress.city, formData.physicalAddress.state, formData.physicalAddress.zip, formData.physicalAddress.country]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsSubmitting(true);

    const supabase = createClient();

    try {
      // Check if all required fields are complete
      const hasPaymentDetails = formData.paymentDetails.bank_name &&
        formData.paymentDetails.account_holder_name &&
        formData.paymentDetails.account_number &&
        formData.paymentDetails.routing_number;

      const hasPhysicalAddress = formData.physicalAddress.street &&
        formData.physicalAddress.city &&
        formData.physicalAddress.state &&
        formData.physicalAddress.zip;

      const hasBillingAddress = formData.billingAddress.street &&
        formData.billingAddress.city &&
        formData.billingAddress.state &&
        formData.billingAddress.zip;

      const profileComplete = hasPaymentDetails && hasPhysicalAddress && hasBillingAddress;

      const { error } = await supabase
        .from("providers")
        .update({
          physical_address: formData.physicalAddress,
          billing_address: formData.billingAddress,
          tax_id: formData.taxId || null,
          payment_details: formData.paymentDetails,
          payment_method: formData.paymentMethod,
          payment_schedule: formData.paymentSchedule,
          discount_rate: formData.discountRate || null,
          is_active: profileComplete, // Automatically activate when profile is complete
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      // Clear persisted form data on successful save
      clearPersistedData();

      if (profileComplete) {
        toast.success("Profile completed! Your account is now active.");
      } else {
        toast.success("Payment and billing information updated successfully");
      }
    } catch (error) {
      console.error("Error updating payment information:", error);
      toast.error("Failed to update payment information");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Physical Address */}
      <Card>
        <CardHeader>
          <CardTitle>Physical Address</CardTitle>
          <CardDescription>Your primary practice or office location</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="physicalStreet">Street Address</Label>
            <Input
              id="physicalStreet"
              value={formData.physicalAddress.street}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  physicalAddress: {
                    ...formData.physicalAddress,
                    street: e.target.value,
                  },
                })
              }
              placeholder="123 Main St"
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label htmlFor="physicalCity">City</Label>
              <Input
                id="physicalCity"
                value={formData.physicalAddress.city}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    physicalAddress: {
                      ...formData.physicalAddress,
                      city: e.target.value,
                    },
                  })
                }
                placeholder="New York"
              />
            </div>
            <div>
              <Label htmlFor="physicalState">State</Label>
              <Input
                id="physicalState"
                value={formData.physicalAddress.state}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    physicalAddress: {
                      ...formData.physicalAddress,
                      state: e.target.value,
                    },
                  })
                }
                placeholder="NY"
              />
            </div>
            <div>
              <Label htmlFor="physicalZip">ZIP</Label>
              <Input
                id="physicalZip"
                value={formData.physicalAddress.zip}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    physicalAddress: {
                      ...formData.physicalAddress,
                      zip: e.target.value,
                    },
                  })
                }
                placeholder="10001"
              />
            </div>
            <div>
              <Label htmlFor="physicalCountry">Country</Label>
              <Input
                id="physicalCountry"
                value={formData.physicalAddress.country}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    physicalAddress: {
                      ...formData.physicalAddress,
                      country: e.target.value,
                    },
                  })
                }
                placeholder="USA"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Address */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Address</CardTitle>
          <CardDescription>Where you would like to receive payments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Same as Physical Address Checkbox */}
          <div className="flex items-center space-x-2 pb-2">
            <input
              type="checkbox"
              id="sameAsPhysical"
              checked={billingSameAsPhysical}
              onChange={(e) => handleBillingSameAsPhysical(e.target.checked)}
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
              value={formData.billingAddress.street}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  billingAddress: {
                    ...formData.billingAddress,
                    street: e.target.value,
                  },
                })
              }
              placeholder="123 Main St"
              disabled={billingSameAsPhysical}
              className={billingSameAsPhysical ? "bg-gray-100 cursor-not-allowed" : ""}
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label htmlFor="billingCity">City</Label>
              <Input
                id="billingCity"
                value={formData.billingAddress.city}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    billingAddress: {
                      ...formData.billingAddress,
                      city: e.target.value,
                    },
                  })
                }
                placeholder="New York"
                disabled={billingSameAsPhysical}
                className={billingSameAsPhysical ? "bg-gray-100 cursor-not-allowed" : ""}
              />
            </div>
            <div>
              <Label htmlFor="billingState">State</Label>
              <Input
                id="billingState"
                value={formData.billingAddress.state}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    billingAddress: {
                      ...formData.billingAddress,
                      state: e.target.value,
                    },
                  })
                }
                placeholder="NY"
                disabled={billingSameAsPhysical}
                className={billingSameAsPhysical ? "bg-gray-100 cursor-not-allowed" : ""}
              />
            </div>
            <div>
              <Label htmlFor="billingZip">ZIP</Label>
              <Input
                id="billingZip"
                value={formData.billingAddress.zip}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    billingAddress: {
                      ...formData.billingAddress,
                      zip: e.target.value,
                    },
                  })
                }
                placeholder="10001"
                disabled={billingSameAsPhysical}
                className={billingSameAsPhysical ? "bg-gray-100 cursor-not-allowed" : ""}
              />
            </div>
            <div>
              <Label htmlFor="billingCountry">Country</Label>
              <Input
                id="billingCountry"
                value={formData.billingAddress.country}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    billingAddress: {
                      ...formData.billingAddress,
                      country: e.target.value,
                    },
                  })
                }
                placeholder="USA"
                disabled={billingSameAsPhysical}
                className={billingSameAsPhysical ? "bg-gray-100 cursor-not-allowed" : ""}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="taxId">Tax ID / EIN</Label>
            <Input
              id="taxId"
              value={formData.taxId}
              onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
              placeholder="XX-XXXXXXX"
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
          <CardDescription>How you would like to receive payments from AIMRX</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer (ACH)</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="paymentSchedule">Payment Schedule</Label>
              <Select
                value={formData.paymentSchedule}
                onValueChange={(value) => setFormData({ ...formData, paymentSchedule: value })}
              >
                <SelectTrigger id="paymentSchedule">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="discountRate">Discount Rate (volume-based)</Label>
            <Input
              id="discountRate"
              value={formData.discountRate}
              onChange={(e) => setFormData({ ...formData, discountRate: e.target.value })}
              placeholder="e.g., 20% volume discount"
            />
          </div>
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card>
        <CardHeader>
          <CardTitle>Bank Account Details</CardTitle>
          <CardDescription>Your bank account information for direct deposits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                value={formData.paymentDetails.bank_name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    paymentDetails: {
                      ...formData.paymentDetails,
                      bank_name: e.target.value,
                    },
                  })
                }
                placeholder="Chase Bank"
              />
            </div>
            <div>
              <Label htmlFor="accountHolderName">Account Holder Name</Label>
              <Input
                id="accountHolderName"
                value={formData.paymentDetails.account_holder_name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    paymentDetails: {
                      ...formData.paymentDetails,
                      account_holder_name: e.target.value,
                    },
                  })
                }
                placeholder="Dr. John Doe"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                type="text"
                value={formData.paymentDetails.account_number}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    paymentDetails: {
                      ...formData.paymentDetails,
                      account_number: e.target.value,
                    },
                  })
                }
                placeholder="********1234"
                className="tracking-wider"
              />
            </div>
            <div>
              <Label htmlFor="routingNumber">Routing Number</Label>
              <Input
                id="routingNumber"
                value={formData.paymentDetails.routing_number}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    paymentDetails: {
                      ...formData.paymentDetails,
                      routing_number: e.target.value,
                    },
                  })
                }
                placeholder="021000021"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="accountType">Account Type</Label>
              <Select
                value={formData.paymentDetails.account_type}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    paymentDetails: {
                      ...formData.paymentDetails,
                      account_type: value,
                    },
                  })
                }
              >
                <SelectTrigger id="accountType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Checking</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="swiftCode">SWIFT Code (Optional)</Label>
              <Input
                id="swiftCode"
                value={formData.paymentDetails.swift_code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    paymentDetails: {
                      ...formData.paymentDetails,
                      swift_code: e.target.value,
                    },
                  })
                }
                placeholder="For international transfers"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting} className="bg-[#66cdcc] hover:bg-[#55bcbb]">
          {isSubmitting ? "Saving..." : "Save Payment & Billing Information"}
        </Button>
      </div>
    </form>
  );
}
