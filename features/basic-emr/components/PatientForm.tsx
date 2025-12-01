"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

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
        // Show appropriate success message
        if (isEditing) {
          toast.success("Patient information updated successfully");
          router.push(`/basic-emr/patients/${patient?.id}`);
        } else {
          toast.success(
            `Patient account created successfully! The patient will receive login instructions via email.`,
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

              <div className="flex justify-between pt-6">
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
