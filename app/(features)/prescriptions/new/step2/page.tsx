"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
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
import { ArrowLeft, ArrowRight, Search, Plus } from "lucide-react";

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
    vialSize: "",
    dosageAmount: "",
    dosageUnit: "mg",
    form: "",
    quantity: "",
    refills: "0",
    sig: "",
    dispenseAsWritten: false,
    pharmacyNotes: "",
    patientPrice: "",
    doctorPrice: "",
    therapyType: "", // Add therapy type
    // Legacy field for backward compatibility
    strength: "",
  });

  interface PharmacyMedication {
    id: string;
    name: string;
    strength: string;
    form: string;
    retail_price_cents: number;
    doctor_markup_percent: number;
  }

  interface Pharmacy {
    id: string;
    name: string;
    slug: string;
    primary_color: string | null;
    tagline: string | null;
  }

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pharmacyMedications, setPharmacyMedications] = useState<PharmacyMedication[]>([]);
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [showMedicationDropdown, setShowMedicationDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Demo only: Show additional medication cards (not submitted to API)
  const [demoMedicationCount, setDemoMedicationCount] = useState(1);

  // Load saved data from sessionStorage on mount
  useEffect(() => {
    const savedDraft = sessionStorage.getItem("prescriptionDraft");
    const savedData = sessionStorage.getItem("prescriptionData");

    console.log("📋 Step 2: Checking sessionStorage on mount");
    console.log("💾 prescriptionDraft:", savedDraft);
    console.log("💾 prescriptionData:", savedData);

    if (savedDraft) {
      // Load from draft (when coming back from step 1)
      const draftData = JSON.parse(savedDraft);
      console.log("✅ Step 2: Loading from draft:", draftData);
      setFormData(draftData);
    } else if (savedData) {
      // Load from saved data (when coming back from step 3)
      const parsedData = JSON.parse(savedData);
      console.log("✅ Step 2: Loading from prescriptionData:", parsedData);
      setFormData(parsedData);
    } else {
      console.log("✅ Step 2: No saved data, starting fresh");
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

  // Load pharmacy and medications on mount
  useEffect(() => {
    const loadPharmacyData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/provider/pharmacy");
        const data = await response.json();

        if (data.success) {
          setPharmacy(data.pharmacy);
          setPharmacyMedications(data.medications || []);

          // Set default therapy type based on pharmacy
          const defaultTherapyType = data.pharmacy.slug === "aim" ? "Peptides" : "Traditional";
          setFormData((prev) => ({
            ...prev,
            therapyType: defaultTherapyType,
          }));
        } else {
          console.error("Failed to load pharmacy:", data.error);
        }
      } catch (error) {
        console.error("Error loading pharmacy:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPharmacyData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMedicationDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  const handleSelectPharmacyMedication = (medication: PharmacyMedication) => {
    console.log("🔍 Selected medication from pharmacy:", medication);

    // Calculate prices based on retail and markup
    const retailPrice = medication.retail_price_cents / 100;
    const doctorPrice = retailPrice * (1 + medication.doctor_markup_percent / 100);

    const newFormData = {
      ...formData,
      medication: medication.name,
      vialSize: medication.strength,
      dosageAmount: medication.strength.match(/\d+/)?.[0] || "",
      dosageUnit: medication.strength.match(/[a-zA-Z]+/)?.[0] || "mg",
      form: medication.form,
      quantity: "1",
      refills: "0",
      sig: "",
      dispenseAsWritten: false,
      pharmacyNotes: "",
      patientPrice: retailPrice.toFixed(2),
      doctorPrice: doctorPrice.toFixed(2),
      strength: medication.strength,
    };

    console.log("✅ Form data after selection:", newFormData);
    setFormData(newFormData);
    setShowMedicationDropdown(false);
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
        _timestamp: Date.now(), // Add timestamp to verify freshness
      };

      console.log("🟢 Step 2 → saving data:", dataToSave);
      console.log("🔑 Saving to key: prescriptionFormData");

      // CLEAR ALL OLD DATA
      sessionStorage.clear();

      // Store FRESH form data in sessionStorage
      sessionStorage.setItem("prescriptionFormData", JSON.stringify(dataToSave));
      sessionStorage.setItem("selectedPatientId", patientId);

      console.log("✅ Data saved. Navigating to Step 3...");
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
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  New Prescription
                </h1>
                {pharmacy && (
                  <div
                    className="px-3 py-1 rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: pharmacy.primary_color || "#1E3A8A" }}
                  >
                    {pharmacy.name}
                  </div>
                )}
              </div>
              <p className="text-muted-foreground mt-2">
                Step 2 of 3: Prescription Details
              </p>
              {pharmacy?.tagline && (
                <p className="text-sm text-gray-500 italic mt-1">
                  {pharmacy.tagline}
                </p>
              )}
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

            {/* Therapy Type - Read Only based on Pharmacy */}
            <div className="space-y-2">
              <Label htmlFor="therapyType" className="required">
                Therapy Type
              </Label>
              <Input
                id="therapyType"
                value={formData.therapyType}
                readOnly
                className="h-[50px] bg-gray-100 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500">
                {pharmacy?.slug === "aim"
                  ? "AIM Medical Technologies specializes in Peptide therapy"
                  : "Traditional pharmaceutical medications"}
              </p>
            </div>

            {/* Medication Name - Dropdown from Pharmacy */}
            <div className="space-y-2 relative" ref={dropdownRef}>
              <Label htmlFor="medication" className="required">
                Medication Name
              </Label>
              <div className="relative">
                <Input
                  id="medication"
                  placeholder={isLoading ? "Loading medications..." : "Click to select medication..."}
                  value={formData.medication}
                  onChange={(e) => {
                    handleInputChange("medication", e.target.value);
                    setShowMedicationDropdown(true);
                  }}
                  onFocus={() => setShowMedicationDropdown(true)}
                  className={`h-[50px] pr-10 ${errors.medication ? "border-red-500" : ""}`}
                  autoComplete="off"
                  disabled={isLoading}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Dropdown with pharmacy medications */}
              {showMedicationDropdown && !isLoading && pharmacyMedications.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border-2 rounded-md shadow-lg max-h-60 overflow-y-auto"
                     style={{ borderColor: pharmacy?.primary_color || "#1E3A8A" }}>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-600 border-b"
                       style={{ backgroundColor: `${pharmacy?.primary_color}20` }}>
                    {pharmacy?.name} Medications ({pharmacyMedications.filter((med) =>
                      !formData.medication || med.name.toLowerCase().includes(formData.medication.toLowerCase())
                    ).length} available)
                  </div>
                  {pharmacyMedications
                    .filter((med) =>
                      !formData.medication || med.name.toLowerCase().includes(formData.medication.toLowerCase())
                    )
                    .map((med) => (
                      <button
                        key={med.id}
                        type="button"
                        onClick={() => handleSelectPharmacyMedication(med)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="font-medium text-gray-900">
                          {med.name}
                        </div>
                        <div className="text-sm text-gray-600 mt-1 flex items-center gap-4">
                          <span>Strength: {med.strength}</span>
                          <span>Form: {med.form}</span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          <span className="mr-3">Patient: ${(med.retail_price_cents / 100).toFixed(2)}</span>
                          <span>Doctor: ${((med.retail_price_cents / 100) * (1 + med.doctor_markup_percent / 100)).toFixed(2)}</span>
                        </div>
                      </button>
                    ))}
                </div>
              )}

              {!isLoading && pharmacyMedications.length === 0 && (
                <p className="text-sm text-amber-600">
                  No medications available for this pharmacy yet.
                </p>
              )}

              {errors.medication && (
                <p className="text-sm text-red-600">{errors.medication}</p>
              )}
            </div>

            {/* Vial Size */}
            <div className="space-y-2">
              <Label htmlFor="vialSize">
                Vial Size
              </Label>
              <Input
                id="vialSize"
                placeholder="e.g., 2.5mg/0.5ml"
                value={formData.vialSize}
                onChange={(e) =>
                  handleInputChange("vialSize", e.target.value)
                }
                className="h-[50px]"
              />
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

          {/* Pricing Card */}
          <div className="bg-white border border-gray-200 rounded-[4px] shadow-sm border-l-4 border-l-[#1E3A8A] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[#1E3A8A]">
              Pricing
            </h2>

            {/* Pricing - Side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patientPrice">
                  Patient Price
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    id="patientPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.patientPrice}
                    onChange={(e) =>
                      handleInputChange("patientPrice", e.target.value)
                    }
                    className="h-[50px] pl-7"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctorPrice">
                  Doctor Price
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    id="doctorPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.doctorPrice}
                    onChange={(e) =>
                      handleInputChange("doctorPrice", e.target.value)
                    }
                    className="h-[50px] pl-7"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Demo: Additional Medication Cards (Display Only) */}
          {Array.from({ length: demoMedicationCount - 1 }).map((_, index) => (
            <div
              key={`demo-med-${index}`}
              className="bg-white border border-gray-200 rounded-[4px] shadow-sm border-l-4 border-l-green-600 p-6 space-y-4 opacity-75"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-green-600">
                  Medication {index + 2} <span className="text-sm text-gray-500">(Demo - Not Submitted)</span>
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDemoMedicationCount(demoMedicationCount - 1)}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              </div>
              <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded border border-gray-200">
                <p className="font-medium mb-2">📋 For Demo Purposes Only</p>
                <p>This additional medication card is for presentation demonstration. Only the first medication above will be submitted to the system.</p>
                <p className="mt-2">Full multi-medication support coming in next release.</p>
              </div>
            </div>
          ))}

          {/* Add Another Medication Button (Demo) */}
          {demoMedicationCount < 8 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setDemoMedicationCount(demoMedicationCount + 1)}
              className="w-full h-16 border-2 border-dashed border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A]/5"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Another Medication ({demoMedicationCount}/8)
            </Button>
          )}

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
