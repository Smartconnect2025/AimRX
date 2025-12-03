"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import DefaultLayout from "@/components/layout/DefaultLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ArrowRight } from "lucide-react";

const MEDICATION_FORMS = [
  "Tablet",
  "Capsule",
  "Liquid",
  "Cream",
  "Ointment",
  "Gel",
  "Patch",
  "Injection",
  "Inhaler",
  "Drops",
  "Spray",
  "Suppository",
];

const DOSAGE_UNITS = [
  "mg",
  "mL",
  "mcg",
  "g",
  "units",
  "%",
];

export default function PrescriptionStep2Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId");

  const [formData, setFormData] = useState({
    medication: "",
    dosageAmount: "",
    dosageUnit: "mg",
    form: "",
    quantity: "",
    refills: "0",
    sig: "",
    dispenseAsWritten: false,
    pharmacyNotes: "",
    // Legacy field for backward compatibility
    strength: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load saved data from sessionStorage on mount
  useEffect(() => {
    const savedDraft = sessionStorage.getItem("prescriptionDraft");
    const savedData = sessionStorage.getItem("prescriptionData");

    if (savedDraft) {
      // Load from draft (when coming back from step 1)
      setFormData(JSON.parse(savedDraft));
    } else if (savedData) {
      // Load from saved data (when coming back from step 3)
      setFormData(JSON.parse(savedData));
    }
  }, []);

  // Clean up prescription state when unmounting (navigating away)
  useEffect(() => {
    return () => {
      // Only clear if navigating away from prescription wizard
      const isStillInWizard = window.location.pathname.startsWith("/prescriptions/new/");
      if (!isStillInWizard) {
        sessionStorage.removeItem("prescriptionData");
        sessionStorage.removeItem("prescriptionDraft");
        sessionStorage.removeItem("selectedPatientId");
        sessionStorage.removeItem("encounterId");
        sessionStorage.removeItem("appointmentId");
      }
    };
  }, []);

  if (!patientId) {
    return (
      <DefaultLayout>
        <div className="container mx-auto max-w-5xl py-8 px-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              No patient selected
            </h2>
            <Button onClick={() => router.push("/prescriptions/new/step1")}>
              Go Back to Step 1
            </Button>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  const handleInputChange = (
    field: string,
    value: string | boolean | number,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.medication.trim()) {
      newErrors.medication = "Medication name is required";
    }
    if (!formData.dosageAmount || parseFloat(formData.dosageAmount) <= 0) {
      newErrors.dosageAmount = "Dosage amount is required and must be greater than 0";
    }
    if (!formData.dosageUnit) {
      newErrors.dosageUnit = "Dosage unit is required";
    }
    if (!formData.form) {
      newErrors.form = "Medication form is required";
    }
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      newErrors.quantity = "Quantity must be greater than 0";
    }
    if (!formData.sig.trim()) {
      newErrors.sig = "Directions (SIG) are required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      // Combine dosage amount and unit into strength for backward compatibility
      const dataToSave = {
        ...formData,
        strength: `${formData.dosageAmount}${formData.dosageUnit}`,
      };

      // Store form data in sessionStorage
      sessionStorage.setItem("prescriptionData", JSON.stringify(dataToSave));
      sessionStorage.setItem("prescriptionDraft", JSON.stringify(formData));
      sessionStorage.setItem("selectedPatientId", patientId);
      router.push(`/prescriptions/new/step3?patientId=${patientId}`);
    }
  };

  const handleBack = () => {
    // Save draft
    sessionStorage.setItem("prescriptionDraft", JSON.stringify(formData));
    router.push("/prescriptions/new/step1");
  };

  return (
    <DefaultLayout>
      <div className="container mx-auto max-w-4xl py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                New Prescription
              </h1>
              <p className="text-muted-foreground mt-2">
                Step 2 of 3: Prescription Details
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push("/")}>
              Cancel
            </Button>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center gap-2 mt-6">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-semibold">
                ✓
              </div>
              <span className="ml-2 text-sm text-muted-foreground">
                Select Patient
              </span>
            </div>
            <div className="w-12 h-0.5 bg-primary"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                2
              </div>
              <span className="ml-2 font-medium">Prescription Details</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-semibold">
                3
              </div>
              <span className="ml-2 text-sm text-muted-foreground">
                Review & Submit
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Medication Information Card */}
          <div className="bg-white border border-gray-200 rounded-[4px] shadow-sm border-l-4 border-l-[#1E3A8A] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[#1E3A8A]">
              Medication Information
            </h2>

            {/* Medication Name */}
            <div className="space-y-2">
              <Label htmlFor="medication" className="required">
                Medication Name
              </Label>
              <Input
                id="medication"
                placeholder="e.g., Lisinopril"
                value={formData.medication}
                onChange={(e) =>
                  handleInputChange("medication", e.target.value)
                }
                className={`h-[50px] ${errors.medication ? "border-red-500" : ""}`}
              />
              {errors.medication && (
                <p className="text-sm text-red-600">{errors.medication}</p>
              )}
            </div>

            {/* Dosage Amount and Unit - Side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dosageAmount" className="required">
                  Dosage Amount
                </Label>
                <Input
                  id="dosageAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g., 10"
                  value={formData.dosageAmount}
                  onChange={(e) =>
                    handleInputChange("dosageAmount", e.target.value)
                  }
                  className={`h-[50px] ${errors.dosageAmount ? "border-red-500" : ""}`}
                />
                {errors.dosageAmount && (
                  <p className="text-sm text-red-600">{errors.dosageAmount}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dosageUnit" className="required">
                  Dosage Unit
                </Label>
                <Select
                  value={formData.dosageUnit}
                  onValueChange={(value) => handleInputChange("dosageUnit", value)}
                >
                  <SelectTrigger
                    className={`h-[50px] ${errors.dosageUnit ? "border-red-500" : ""}`}
                  >
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOSAGE_UNITS.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.dosageUnit && (
                  <p className="text-sm text-red-600">{errors.dosageUnit}</p>
                )}
              </div>
            </div>

            {/* Form */}
            <div className="space-y-2">
              <Label htmlFor="form" className="required">
                Form
              </Label>
              <Select
                value={formData.form}
                onValueChange={(value) => handleInputChange("form", value)}
              >
                <SelectTrigger
                  className={`h-[50px] ${errors.form ? "border-red-500" : ""}`}
                >
                  <SelectValue placeholder="Select form" />
                </SelectTrigger>
                <SelectContent>
                  {MEDICATION_FORMS.map((form) => (
                    <SelectItem key={form} value={form}>
                      {form}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.form && (
                <p className="text-sm text-red-600">{errors.form}</p>
              )}
            </div>

            {/* Quantity and Refills - Side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity" className="required">
                  Quantity
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  placeholder="e.g., 30"
                  value={formData.quantity}
                  onChange={(e) =>
                    handleInputChange("quantity", e.target.value)
                  }
                  className={`h-[50px] ${errors.quantity ? "border-red-500" : ""}`}
                />
                {errors.quantity && (
                  <p className="text-sm text-red-600">{errors.quantity}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="refills">Refills</Label>
                <Input
                  id="refills"
                  type="number"
                  min="0"
                  max="12"
                  placeholder="0"
                  value={formData.refills}
                  onChange={(e) => handleInputChange("refills", e.target.value)}
                  className="h-[50px]"
                />
              </div>
            </div>
          </div>

          {/* Directions / Sig Card */}
          <div className="bg-white border border-gray-200 rounded-[4px] shadow-sm border-l-4 border-l-[#1E3A8A] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[#1E3A8A]">
              Directions / Sig
            </h2>

            {/* SIG / Directions */}
            <div className="space-y-2">
              <Label htmlFor="sig" className="required">
                SIG (Directions for Patient)
              </Label>
              <Textarea
                id="sig"
                placeholder="e.g., Take 1 tablet by mouth once daily in the morning with food"
                value={formData.sig}
                onChange={(e) => handleInputChange("sig", e.target.value)}
                rows={3}
                className={errors.sig ? "border-red-500" : ""}
              />
              {errors.sig && (
                <p className="text-sm text-red-600">{errors.sig}</p>
              )}
            </div>

            {/* Dispense as Written */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="daw"
                checked={formData.dispenseAsWritten}
                onCheckedChange={(checked) =>
                  handleInputChange("dispenseAsWritten", checked as boolean)
                }
              />
              <Label
                htmlFor="daw"
                className="text-sm font-normal cursor-pointer"
              >
                Dispense as Written (DAW) - No substitutions allowed
              </Label>
            </div>

            {/* Pharmacy Notes */}
            <div className="space-y-2">
              <Label htmlFor="pharmacyNotes">Notes to Pharmacy (Optional)</Label>
              <Textarea
                id="pharmacyNotes"
                placeholder="Any special instructions for the pharmacist..."
                value={formData.pharmacyNotes}
                onChange={(e) =>
                  handleInputChange("pharmacyNotes", e.target.value)
                }
                rows={3}
                className="bg-[#F8FAFC] border-[#1E3A8A] rounded-[4px]"
              />
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="bg-white border border-gray-200 rounded-[4px] p-6">
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Patient Selection
              </Button>
              <Button onClick={handleNext} size="lg">
                Continue to Review
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
