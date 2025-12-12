"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import DefaultLayout from "@/components/layout/DefaultLayout";
import { usePharmacy } from "@/contexts/PharmacyContext";
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
import { ArrowLeft, ArrowRight, Search, Plus, Info } from "lucide-react";

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

interface PharmacyMedication {
  id: string;
  pharmacy_id: string;
  name: string;
  strength: string;
  form: string;
  retail_price_cents: number;
  doctor_markup_percent: number;
  retail_price: number;
  doctor_price: number;
  profit: number;
  category?: string;
  dosage_instructions?: string;
  image_url?: string;
  ndc?: string;
  in_stock?: boolean;
  preparation_time_days?: number;
  notes?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  pharmacy: {
    id: string;
    name: string;
    slug: string;
    primary_color: string;
    tagline: string;
  };
}

export default function PrescriptionStep2Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId");
  const { pharmacy } = usePharmacy();

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
    doctorMarkupPercent: "25", // NEW: Doctor sets their markup percentage
    therapyType: "", // Add therapy type
    // Legacy field for backward compatibility
    strength: "",
    // NEW: Selected pharmacy for this prescription
    selectedPharmacyId: "",
    selectedPharmacyName: "",
    selectedPharmacyColor: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pharmacyMedications, setPharmacyMedications] = useState<PharmacyMedication[]>([]);
  const [showMedicationDropdown, setShowMedicationDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPharmacyAdmin, setIsPharmacyAdmin] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("Weight Loss (GLP-1)");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [expandedMedicationInfo, setExpandedMedicationInfo] = useState<string | null>(null);
  const [selectedPharmacyFilter, setSelectedPharmacyFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"pharmacies" | "medications">("pharmacies");

  // Available categories
  const categories = [
    "Weight Loss (GLP-1)",
    "Peptides & Growth Hormone",
    "Sexual Health",
    "Anti-Aging / NAD+",
    "Bundles",
    "Sleep & Recovery",
    "Immune Health",
    "Traditional Rx",
    "All",
  ];

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

  // Load medications (global for doctors, filtered for pharmacy admins)
  useEffect(() => {
    const loadMedications = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/provider/pharmacy");
        const data = await response.json();

        if (data.success) {
          // Store medications and admin status
          setPharmacyMedications(data.medications || []);
          setIsPharmacyAdmin(data.isPharmacyAdmin || false);

          // If pharmacy admin, set default therapy type
          if (data.isPharmacyAdmin && pharmacy) {
            const defaultTherapyType = pharmacy.slug === "aim" ? "Peptides" : "Traditional";
            setFormData((prev) => ({
              ...prev,
              therapyType: defaultTherapyType,
            }));
          }
        } else {
          console.error("Failed to load medications:", data.error);
        }
      } catch (error) {
        console.error("Error loading medications:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMedications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // Use default markup percentage
    const markupPercent = medication.doctor_markup_percent || 25;

    // Calculate patient price: pharmacy cost × (1 + markup%)
    const pharmacyCost = medication.retail_price;
    const patientPrice = pharmacyCost * (1 + markupPercent / 100);

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
      patientPrice: patientPrice.toFixed(2),
      doctorPrice: pharmacyCost.toFixed(2),
      doctorMarkupPercent: markupPercent.toString(),
      strength: medication.strength,
      // Capture selected pharmacy details
      selectedPharmacyId: medication.pharmacy_id,
      selectedPharmacyName: medication.pharmacy.name,
      selectedPharmacyColor: medication.pharmacy.primary_color,
      // Set therapy type based on medication's pharmacy
      therapyType: medication.pharmacy.slug === "aim" ? "Peptides" : "Traditional",
    };

    console.log("✅ Form data after selection:", newFormData);
    console.log(`💰 Pricing: Pharmacy $${pharmacyCost} + ${markupPercent}% = Patient $${patientPrice.toFixed(2)}`);
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
                {isPharmacyAdmin && pharmacy ? (
                  <div
                    className="px-3 py-1 rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: pharmacy.primary_color || "#1E3A8A" }}
                  >
                    {pharmacy.name}
                  </div>
                ) : formData.selectedPharmacyName ? (
                  <div
                    className="px-3 py-1 rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: formData.selectedPharmacyColor || "#1E3A8A" }}
                  >
                    → {formData.selectedPharmacyName}
                  </div>
                ) : (
                  <div className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-200 text-gray-600">
                    Select medication to choose pharmacy
                  </div>
                )}
              </div>
              <p className="text-muted-foreground mt-2">
                Step 2 of 3: Prescription Details
              </p>
              {isPharmacyAdmin && pharmacy?.tagline && (
                <p className="text-sm text-gray-500 italic mt-1">
                  {pharmacy.tagline}
                </p>
              )}
              {!isPharmacyAdmin && formData.selectedPharmacyName && (
                <p className="text-sm font-medium" style={{ color: formData.selectedPharmacyColor }}>
                  ✓ Prescription will be sent to {formData.selectedPharmacyName}
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

            {/* Therapy Type - Auto-filled based on selected medication */}
            {formData.therapyType && (
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
                  Auto-filled based on selected medication
                </p>
              </div>
            )}

            {/* Medication Catalog - Role-based (Global for doctors, Filtered for admins) */}
            <div className="space-y-2 relative" ref={dropdownRef}>
              <Label htmlFor="medication" className="required">
                {isPharmacyAdmin ? "Select Medication" : "Select Medication (All Pharmacies)"}
              </Label>

              <div className="relative">
                <Input
                  id="medication"
                  placeholder={
                    isLoading
                      ? "Loading medications..."
                      : isPharmacyAdmin
                        ? "Click to select medication..."
                        : "Click to browse medications..."
                  }
                  value={formData.medication}
                  onChange={(e) => {
                    handleInputChange("medication", e.target.value);
                    setShowMedicationDropdown(true);
                  }}
                  onFocus={() => {
                    setShowMedicationDropdown(true);
                    if (!isPharmacyAdmin && !selectedPharmacyFilter) {
                      setViewMode("pharmacies");
                    }
                  }}
                  className={`h-[50px] pr-10 ${errors.medication ? "border-red-500" : ""}`}
                  autoComplete="off"
                  disabled={isLoading}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Dropdown - Role-based display */}
              {showMedicationDropdown && !isLoading && pharmacyMedications.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-300 rounded-md shadow-2xl max-h-[600px] overflow-y-auto">
                  {isPharmacyAdmin ? (
                    <div className="px-4 py-3 text-sm font-semibold border-b sticky top-0 z-10 bg-white"
                         style={{
                           backgroundColor: pharmacy ? `${pharmacy.primary_color}20` : "#F3F4F6",
                           color: pharmacy?.primary_color || "#1F2937"
                         }}>
                      {pharmacy?.name} Medications ({pharmacyMedications.filter((med) =>
                        !formData.medication || med.name.toLowerCase().includes(formData.medication.toLowerCase())
                      ).length} available)
                    </div>
                  ) : viewMode === "pharmacies" ? (
                    /* STEP 1: Pharmacy Selector */
                    <div>
                      <div className="px-4 py-3 border-b bg-gray-50 sticky top-0 z-10">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-gray-900">Select a Pharmacy</h3>
                          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="h-8 w-[180px] text-xs">
                              <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                  {cat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="p-2 space-y-1">
                        {(() => {
                          // Group medications by pharmacy
                          const pharmacyGroups = pharmacyMedications.reduce((acc, med) => {
                            if (!acc[med.pharmacy_id]) {
                              acc[med.pharmacy_id] = {
                                pharmacy: med.pharmacy,
                                count: 0
                              };
                            }
                            acc[med.pharmacy_id].count++;
                            return acc;
                          }, {} as Record<string, { pharmacy: PharmacyMedication['pharmacy'], count: number }>);

                          return Object.entries(pharmacyGroups).map(([pharmacyId, { pharmacy: pharmacyInfo, count }]) => (
                            <button
                              key={pharmacyId}
                              type="button"
                              onClick={() => {
                                setSelectedPharmacyFilter(pharmacyId);
                                setViewMode("medications");
                              }}
                              className="w-full px-3 py-2 border border-gray-200 rounded hover:border-blue-500 hover:bg-blue-50/30 transition-all text-left group"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-900 group-hover:text-blue-700 transition-colors">
                                  {pharmacyInfo.name}
                                </span>
                                <span className="text-xs text-gray-600">
                                  {count} {count === 1 ? 'med' : 'meds'}
                                </span>
                              </div>
                            </button>
                          ));
                        })()}
                      </div>
                    </div>
                  ) : (
                    /* STEP 2: Medications View with Breadcrumb */
                    <div>
                      {/* Breadcrumb Header */}
                      {selectedPharmacyFilter && (() => {
                        const selectedPharmacy = pharmacyMedications.find(m => m.pharmacy_id === selectedPharmacyFilter)?.pharmacy;
                        return selectedPharmacy ? (
                          <div className="px-4 py-3 border-b bg-gray-50 sticky top-0 z-10">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setViewMode("pharmacies");
                                    setSelectedPharmacyFilter(null);
                                  }}
                                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                                >
                                  ← Back to Pharmacies
                                </button>
                                <span className="text-gray-400">/</span>
                                <span className="font-semibold text-gray-900 text-sm">
                                  {selectedPharmacy.name}
                                </span>
                              </div>
                              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="h-8 w-[180px] text-xs">
                                  <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                      {cat}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                  {/* Medications List */}
                  {(isPharmacyAdmin || viewMode === "medications") && (() => {
                    const filteredMeds = pharmacyMedications.filter((med) => {
                      const matchesSearch = !formData.medication || med.name.toLowerCase().includes(formData.medication.toLowerCase());
                      const matchesCategory = isPharmacyAdmin || selectedCategory === "All" || med.category === selectedCategory;
                      const matchesPharmacy = isPharmacyAdmin || !selectedPharmacyFilter || med.pharmacy_id === selectedPharmacyFilter;
                      return matchesSearch && matchesCategory && matchesPharmacy;
                    });

                    // Sort medications alphabetically by name
                    filteredMeds.sort((a, b) => a.name.localeCompare(b.name));

                    if (filteredMeds.length === 0) {
                      return (
                        <div className="p-8 text-center text-gray-500">
                          No medications found matching your criteria
                        </div>
                      );
                    }

                    return filteredMeds.map((med) => (
                      <div key={med.id} className="border-b border-gray-100 last:border-b-0 hover:bg-blue-50/30 transition-colors">
                        <div className="w-full px-4 py-3 flex items-center justify-between gap-4">
                          {/* Left: Medication Info */}
                          <div
                            className="flex-1 cursor-pointer"
                            onClick={() => handleSelectPharmacyMedication(med)}
                          >
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-semibold text-gray-900 text-base">
                                {med.name}
                              </span>
                              {!med.in_stock && (
                                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700">
                                  Out of Stock
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {med.strength} • {med.form}
                            </div>
                          </div>

                          {/* Right: Price and Actions */}
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-lg text-gray-900">${med.retail_price.toFixed(2)}</span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedMedicationInfo(
                                  expandedMedicationInfo === med.id ? null : med.id
                                );
                              }}
                              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                              title="View details"
                            >
                              <Info className={`h-4 w-4 ${expandedMedicationInfo === med.id ? 'text-blue-600' : 'text-gray-400'}`} />
                            </button>

                            <Button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectPharmacyMedication(med);
                              }}
                              size="sm"
                              className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90"
                            >
                              Select
                            </Button>
                          </div>
                        </div>

                        {/* Simplified Medication Details */}
                        {expandedMedicationInfo === med.id && (
                          <div className="px-4 pb-4 bg-gray-50 border-t border-gray-200">
                            <div className="p-6 bg-white rounded-lg space-y-4 max-w-2xl mx-auto">
                              {/* Header */}
                              <div className="pb-4 border-b">
                                <h3 className="text-xl font-bold text-gray-900">{med.name}</h3>
                                <p className="text-gray-600 mt-1">{med.strength} • {med.form}</p>
                              </div>

                              {/* Price - Prominent */}
                              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                                <span className="text-gray-700 font-semibold">Price</span>
                                <span className="text-3xl font-bold text-blue-600">${med.retail_price.toFixed(2)}</span>
                              </div>

                              {/* Stock Status */}
                              <div className="flex items-center gap-2">
                                {med.in_stock !== false ? (
                                  <span className="px-3 py-1.5 rounded-full bg-green-100 text-green-700 font-semibold text-sm">
                                    ✓ In Stock
                                  </span>
                                ) : (
                                  <span className="px-3 py-1.5 rounded-full bg-red-100 text-red-700 font-semibold text-sm">
                                    Out of Stock
                                  </span>
                                )}
                                {med.preparation_time_days && med.preparation_time_days > 0 && (
                                  <span className="text-sm text-gray-600">
                                    • {med.preparation_time_days} {med.preparation_time_days === 1 ? 'day' : 'days'} prep time
                                  </span>
                                )}
                              </div>

                              {/* Dosage Instructions - Key Info */}
                              {med.dosage_instructions && (
                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                  <h4 className="text-sm font-semibold text-blue-900 mb-2">💊 Dosage Instructions</h4>
                                  <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-wrap">
                                    {med.dosage_instructions}
                                  </p>
                                </div>
                              )}

                              {/* Special Notes */}
                              {med.notes && (
                                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                                  <h4 className="text-sm font-semibold text-amber-900 mb-2">⚠️ Important Notes</h4>
                                  <p className="text-sm text-amber-800 leading-relaxed whitespace-pre-wrap">
                                    {med.notes}
                                  </p>
                                </div>
                              )}

                              {/* Select Button in Modal */}
                              <div className="pt-4">
                                <Button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectPharmacyMedication(med);
                                  }}
                                  className="w-full h-12 text-base bg-[#1E3A8A] hover:bg-[#1E3A8A]/90"
                                >
                                  Select This Medication
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              )}

              {!isLoading && pharmacyMedications.length === 0 && (
                <p className="text-sm text-amber-600">
                  No medications available yet.
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
