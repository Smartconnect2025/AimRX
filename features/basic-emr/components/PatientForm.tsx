"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { loadStripe, StripeCardElement } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@core/auth";

import { US_STATES } from "../constants";
import {
  patientFormSchema,
  PatientFormValues,
  formatPhoneNumber,
  genderOptions,
  languageOptions,
} from "../schemas";
import { CreatePatientData } from "../services/patientService";
import { useEmrStore } from "../store/emr-store";
import { GenderEnum, Patient } from "../types";

interface PatientFormProps {
  patient?: Patient;
  isEditing?: boolean;
}

export function PatientForm({ patient, isEditing = false }: PatientFormProps) {
  const router = useRouter();
  const { user } = useUser();
  const createPatient = useEmrStore((state) => state.createPatient);
  const updatePatientAsync = useEmrStore((state) => state.updatePatientAsync);
  const loading = useEmrStore((state) => state.loading);
  const error = useEmrStore((state) => state.error);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cardElement, setCardElement] = useState<StripeCardElement | null>(null);
  const [saveCard, setSaveCard] = useState(true);
  const [hasExistingCard, setHasExistingCard] = useState(false);

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      firstName: patient?.firstName || "",
      lastName: patient?.lastName || "",
      email: patient?.email || "",
      phone: patient?.phone || "",
      dateOfBirth: patient?.dateOfBirth || "",
      gender: patient?.gender || GenderEnum.Male,
      address: {
        street: patient?.address?.street || "",
        city: patient?.address?.city || "",
        state: patient?.address?.state || "",
        zipCode: patient?.address?.zipCode || "",
      },
      emergencyContact: patient?.emergencyContact,
      insurance: patient?.insurance,
      preferredLanguage:
        (patient?.preferredLanguage as
          | "English"
          | "Spanish"
          | "French"
          | "Portuguese"
          | "Mandarin") || "English",
    },
  });

  useEffect(() => {
    if (!user) {
      toast.error("Please log in to access patient forms");
      router.push("/auth");
    }
  }, [user, router]);

  // Initialize Stripe card element
  useEffect(() => {
    let isMounted = true;

    const initializeStripe = async () => {
      const stripe = await stripePromise;
      if (!stripe || !isMounted) return;

      const elements = stripe.elements();
      const card = elements.create("card", {
        style: {
          base: {
            fontSize: "16px",
            color: "#1f2937",
            fontFamily: "Inter, sans-serif",
            "::placeholder": {
              color: "#9ca3af",
            },
          },
          invalid: {
            color: "#ef4444",
            iconColor: "#ef4444",
          },
        },
        hidePostalCode: true,
      });

      // Wait for DOM to be ready
      const cardElement = document.getElementById("card-element");
      if (cardElement) {
        card.mount("#card-element");
        setCardElement(card);
      }
    };

    // Only initialize for new patients or if no card exists
    if (!isEditing || !hasExistingCard) {
      initializeStripe();
    }

    return () => {
      isMounted = false;
      if (cardElement) {
        cardElement.unmount();
      }
    };
  }, [isEditing, hasExistingCard]);

  // Check if patient has existing card when editing
  useEffect(() => {
    const checkExistingCard = async () => {
      if (isEditing && patient?.id) {
        try {
          const response = await fetch(`/api/patients/${patient.id}/payment-method`);
          const data = await response.json();
          if (data.success && data.hasPaymentMethod) {
            setHasExistingCard(true);
          }
        } catch (error) {
          console.error("Error checking existing card:", error);
        }
      }
    };

    checkExistingCard();
  }, [isEditing, patient?.id]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Please log in to access patient forms
          </h2>
          <Button onClick={() => router.push("/auth")}>Go to Login</Button>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: PatientFormValues) => {
    if (!user?.id) {
      toast.error("Please log in to save patient data");
      return;
    }

    setIsSubmitting(true);

    const patientData: CreatePatientData = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      address: data.address
        ? {
            street: data.address.street,
            city: data.address.city,
            state: data.address.state,
            zipCode: data.address.zipCode,
          }
        : undefined,
      emergencyContact: data.emergencyContact,
      insurance: data.insurance
        ? {
            ...data.insurance,
            groupNumber: data.insurance.groupNumber || "",
          }
        : undefined,
      preferredLanguage: data.preferredLanguage,
    };

    try {
      let result;
      if (isEditing && patient?.id) {
        result = await updatePatientAsync(patient.id, user.id, patientData);
      } else {
        result = await createPatient(user.id, patientData);
      }

      if (result) {
        // Save payment method if card element exists and saveCard is true
        if (saveCard && cardElement && !hasExistingCard) {
          try {
            const stripe = await stripePromise;
            if (!stripe) throw new Error("Stripe not loaded");

            const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
              type: "card",
              card: cardElement,
            });

            if (pmError) {
              toast.error(`Card error: ${pmError.message}`);
            } else if (paymentMethod) {
              const saveResponse = await fetch(`/api/patients/${result.id}/payment-method`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentMethodId: paymentMethod.id }),
              });

              const saveData = await saveResponse.json();
              if (saveData.success) {
                toast.success("Payment method saved successfully! ✓");
              } else {
                toast.error("Failed to save payment method");
              }
            }
          } catch (cardError) {
            console.error("Error saving card:", cardError);
            toast.error("Patient saved, but failed to save payment method");
          }
        }

        // Show appropriate success message
        if (isEditing) {
          toast.success("Patient information updated successfully");
          router.push(`/basic-emr/patients/${patient?.id}`);
        } else {
          toast.success(
            `Patient account created successfully! ${saveCard && cardElement ? "Card saved for 1-click prescriptions!" : ""}`,
          );
          router.push(`/basic-emr/patients/${result.id}`);
        }
      }
    } catch (error) {
      console.error("Error saving patient:", error);
      toast.error("Failed to save patient data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const isFormDisabled = loading || isSubmitting;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-8">
          {isEditing ? "Edit Patient" : "Create New Patient"}
        </h1>

        {loading && !isSubmitting && (
          <div className="text-center py-4">
            <div className="text-gray-500">Loading...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <Card className="rounded-sm border border-gray-200 p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">
                        First Name <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter first name"
                          className="w-full border-gray-300 rounded-lg"
                          disabled={isFormDisabled}
                          {...field}
                        />
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
                      <FormLabel className="text-gray-700 font-medium">
                        Last Name <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter last name"
                          className="w-full border-gray-300 rounded-lg"
                          disabled={isFormDisabled}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">
                        Date of Birth{" "}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className="w-full border-gray-300 rounded-lg"
                          disabled={isFormDisabled}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">
                        Gender <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex space-x-6 mt-3"
                          disabled={isFormDisabled}
                        >
                          {genderOptions.map((genderOption) => (
                            <div
                              key={genderOption}
                              className="flex items-center space-x-2"
                            >
                              <RadioGroupItem
                                value={genderOption}
                                id={genderOption.toLowerCase()}
                                className="text-primary"
                              />
                              <Label
                                htmlFor={genderOption.toLowerCase()}
                                className="text-gray-700 cursor-pointer"
                              >
                                {genderOption}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">
                        Phone Number <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(555) 555-5555"
                          className="w-full border-gray-300 rounded-lg"
                          disabled={isFormDisabled}
                          {...field}
                          onChange={(e) => {
                            field.onChange(formatPhoneNumber(e.target.value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">
                        Email <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john@example.com"
                          className="w-full border-gray-300 rounded-lg"
                          disabled={isFormDisabled}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address.street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      Street Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123 Main St"
                        className="w-full border-gray-300 rounded-lg"
                        disabled={isFormDisabled}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="address.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">
                        City
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="City name"
                          className="w-full border-gray-300 rounded-lg"
                          disabled={isFormDisabled}
                          {...field}
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
                  name="address.state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">
                        State
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isFormDisabled}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full border-gray-300 rounded-lg">
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {US_STATES.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
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
                  name="address.zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">
                        ZIP Code
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="12345"
                          className="w-full border-gray-300 rounded-lg"
                          disabled={isFormDisabled}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="preferredLanguage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      Preferred Language
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isFormDisabled}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full border-gray-300 rounded-lg">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {languageOptions.map((language) => (
                          <SelectItem key={language} value={language}>
                            {language}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* PAYMENT METHOD SECTION */}
              <div className="col-span-1 md:col-span-2 pt-6 border-t-2 border-gray-200">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    💳 Payment Method
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Save a payment method for instant 1-click prescription charges
                  </p>
                </div>

                {hasExistingCard ? (
                  <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-600 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl">
                        ✓
                      </div>
                      <div>
                        <p className="font-bold text-green-800 text-lg">Card on File</p>
                        <p className="text-sm text-green-700">
                          This patient has a saved payment method. Future prescriptions will charge automatically!
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-700 font-medium mb-2 block">
                        Credit/Debit Card {!isEditing && <span className="text-red-500">*</span>}
                      </Label>
                      <div
                        id="card-element"
                        className="p-4 border border-gray-300 rounded-lg bg-white"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Test card: 4242 4242 4242 4242 • Any future date • Any 3-digit CVC
                      </p>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="save-card"
                        checked={saveCard}
                        onCheckedChange={(checked) => setSaveCard(checked as boolean)}
                        disabled={isFormDisabled}
                        className="mt-1"
                      />
                      <div>
                        <label
                          htmlFor="save-card"
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          Save card for automatic future charges
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          Recommended: Enables 1-click prescription charges
                        </p>
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-800 font-semibold flex items-center gap-2">
                        <span className="text-lg">✓</span>
                        With a card on file, future prescriptions charge automatically - no popups, no delays!
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="col-span-1 md:col-span-2 flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isFormDisabled}
                  className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isFormDisabled}
                  variant="default"
                  className="px-6 py-2 rounded-lg"
                >
                  {isSubmitting
                    ? "Saving..."
                    : isEditing
                      ? "Update Patient"
                      : "Create & View Chart"}
                </Button>
              </div>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}
