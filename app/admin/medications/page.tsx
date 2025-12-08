"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pill, Plus, CheckCircle2, AlertCircle, DollarSign } from "lucide-react";

interface Medication {
  id: string;
  pharmacy_id: string;
  name: string;
  strength: string | null;
  form: string | null;
  ndc: string | null;
  retail_price_cents: number;
  doctor_markup_percent: number;
  category: string | null;
  dosage_instructions: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export default function MedicationManagementPage() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Medication form state
  const [medicationForm, setMedicationForm] = useState({
    name: "",
    strength: "",
    form: "Injection",
    ndc: "",
    retail_price: "", // Store as dollars for UI
    doctor_markup_percent: "25",
    category: "Weight Loss (GLP-1)",
    dosage_instructions: "",
    image_url: "",
  });
  const [isCreatingMedication, setIsCreatingMedication] = useState(false);
  const [medicationResult, setMedicationResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);

  // Categories
  const categories = [
    "Weight Loss (GLP-1)",
    "Peptides & Growth Hormone",
    "Sexual Health",
    "Anti-Aging / NAD+",
    "Bundles",
    "Sleep & Recovery",
    "Immune Health",
    "Traditional Rx",
  ];

  // Forms
  const forms = [
    "Injection",
    "Tablet",
    "Capsule",
    "Troche",
    "Nasal Spray",
    "Inhaler",
    "Topical",
    "Bundle",
  ];

  // Load medications
  useEffect(() => {
    loadMedications();
  }, []);

  const loadMedications = async () => {
    setIsLoadingData(true);
    try {
      const response = await fetch("/api/admin/medications");
      const data = await response.json();
      if (data.success) {
        setMedications(data.medications || []);
      }
    } catch (error) {
      console.error("Error loading medications:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleCreateMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingMedication(true);
    setMedicationResult(null);

    try {
      // Convert retail price from dollars to cents
      const retail_price_cents = Math.round(parseFloat(medicationForm.retail_price) * 100);

      const response = await fetch("/api/admin/medications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...medicationForm,
          retail_price_cents,
        }),
      });

      const data = await response.json();
      setMedicationResult(data);

      if (data.success) {
        // Reset form
        setMedicationForm({
          name: "",
          strength: "",
          form: "Injection",
          ndc: "",
          retail_price: "",
          doctor_markup_percent: "25",
          category: "Weight Loss (GLP-1)",
          dosage_instructions: "",
          image_url: "",
        });
        // Reload medications
        loadMedications();
      }
    } catch {
      setMedicationResult({ error: "Failed to create medication" });
    } finally {
      setIsCreatingMedication(false);
    }
  };

  const calculateDoctorPrice = (retailPrice: string, markup: string) => {
    const retail = parseFloat(retailPrice) || 0;
    const markupPercent = parseFloat(markup) || 0;
    return (retail * (1 + markupPercent / 100)).toFixed(2);
  };

  const calculateProfit = (retailPrice: string, markup: string) => {
    const retail = parseFloat(retailPrice) || 0;
    const doctorPrice = parseFloat(calculateDoctorPrice(retailPrice, markup));
    return (doctorPrice - retail).toFixed(2);
  };

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">💊 Medication Management</h1>
        <p className="text-gray-600">Add and manage medications for your pharmacy</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CREATE MEDICATION FORM - Takes 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Plus className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Add New Medication</h2>
              <p className="text-sm text-gray-600">Fill in the medication details below</p>
            </div>
          </div>

          <form onSubmit={handleCreateMedication} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="med-name">
                  Medication Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="med-name"
                  placeholder="e.g., Semaglutide + B12 Injection 10mg/0.5mg/mL"
                  value={medicationForm.name}
                  onChange={(e) => setMedicationForm({ ...medicationForm, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="med-strength">Strength</Label>
                <Input
                  id="med-strength"
                  placeholder="e.g., 1mL or 90 tablets"
                  value={medicationForm.strength}
                  onChange={(e) => setMedicationForm({ ...medicationForm, strength: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="med-form">Form</Label>
                <select
                  id="med-form"
                  value={medicationForm.form}
                  onChange={(e) => setMedicationForm({ ...medicationForm, form: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                >
                  {forms.map((form) => (
                    <option key={form} value={form}>
                      {form}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="med-category">Category</Label>
                <select
                  id="med-category"
                  value={medicationForm.category}
                  onChange={(e) => setMedicationForm({ ...medicationForm, category: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="med-ndc">NDC Number</Label>
                <Input
                  id="med-ndc"
                  placeholder="e.g., 12345-678-90"
                  value={medicationForm.ndc}
                  onChange={(e) => setMedicationForm({ ...medicationForm, ndc: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="med-dosage">Dosage Instructions (SIG)</Label>
                <Textarea
                  id="med-dosage"
                  placeholder="e.g., Inject 25 units under the skin once weekly"
                  value={medicationForm.dosage_instructions}
                  onChange={(e) => setMedicationForm({ ...medicationForm, dosage_instructions: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            {/* Pricing Section */}
            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Pricing & Profit
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="med-retail">
                    Patient Price (Retail) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="med-retail"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 70.00"
                    value={medicationForm.retail_price}
                    onChange={(e) => setMedicationForm({ ...medicationForm, retail_price: e.target.value })}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Amount in dollars</p>
                </div>

                <div>
                  <Label htmlFor="med-markup">Doctor Markup %</Label>
                  <Input
                    id="med-markup"
                    type="number"
                    placeholder="e.g., 25"
                    value={medicationForm.doctor_markup_percent}
                    onChange={(e) => setMedicationForm({ ...medicationForm, doctor_markup_percent: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Default: 25%</p>
                </div>

                <div>
                  <Label>Doctor Price (Calculated)</Label>
                  <div className="h-10 px-3 rounded-md border border-gray-300 bg-gray-50 flex items-center justify-between">
                    <span className="font-semibold">
                      ${calculateDoctorPrice(medicationForm.retail_price, medicationForm.doctor_markup_percent)}
                    </span>
                    <span className="text-xs text-green-600 font-semibold">
                      +${calculateProfit(medicationForm.retail_price, medicationForm.doctor_markup_percent)} profit
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Image URL */}
            <div>
              <Label htmlFor="med-image">Image URL (Optional)</Label>
              <Input
                id="med-image"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={medicationForm.image_url}
                onChange={(e) => setMedicationForm({ ...medicationForm, image_url: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">Direct link to medication image</p>
            </div>

            <Button type="submit" disabled={isCreatingMedication} className="w-full" size="lg">
              {isCreatingMedication ? "Adding Medication..." : "Add Medication"}
            </Button>

            {medicationResult && (
              <div className={`p-4 rounded-md flex items-start gap-2 ${medicationResult.success ? "bg-green-50 text-green-900" : "bg-red-50 text-red-900"}`}>
                {medicationResult.success ? (
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                )}
                <div className="text-sm">
                  {medicationResult.message || medicationResult.error}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* STATISTICS - Takes 1 column */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Pill className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Your Catalog</h2>
              <p className="text-sm text-gray-600">Medication statistics</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-blue-600 font-semibold">Total Medications</div>
              <div className="text-3xl font-bold text-blue-700">{medications.length}</div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-green-600 font-semibold">Active</div>
              <div className="text-3xl font-bold text-green-700">
                {medications.filter((m) => m.is_active).length}
              </div>
            </div>

            <div className="bg-amber-50 rounded-lg p-4">
              <div className="text-sm text-amber-600 font-semibold">Categories</div>
              <div className="text-3xl font-bold text-amber-700">
                {new Set(medications.map((m) => m.category).filter(Boolean)).size}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EXISTING MEDICATIONS LIST */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-green-100 p-3 rounded-lg">
            <Pill className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Your Medications</h2>
            <p className="text-sm text-gray-600">{medications.length} medications in your catalog</p>
          </div>
        </div>

        {isLoadingData ? (
          <p className="text-gray-500">Loading medications...</p>
        ) : medications.length === 0 ? (
          <div className="text-center py-12">
            <Pill className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No medications yet</p>
            <p className="text-sm text-gray-400">Add your first medication using the form above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold">Medication</th>
                  <th className="text-left py-3 px-4 font-semibold">Category</th>
                  <th className="text-left py-3 px-4 font-semibold">Patient Price</th>
                  <th className="text-left py-3 px-4 font-semibold">Doctor Price</th>
                  <th className="text-left py-3 px-4 font-semibold">Profit</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {medications.map((med) => {
                  const retailPrice = med.retail_price_cents / 100;
                  const doctorPrice = retailPrice * (1 + med.doctor_markup_percent / 100);
                  const profit = doctorPrice - retailPrice;

                  return (
                    <tr key={med.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{med.name}</div>
                        <div className="text-xs text-gray-500">
                          {med.strength && `${med.strength} • `}
                          {med.form}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {med.category || "Uncategorized"}
                        </span>
                      </td>
                      <td className="py-3 px-4">${retailPrice.toFixed(2)}</td>
                      <td className="py-3 px-4 font-semibold">${doctorPrice.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className="text-green-600 font-semibold">+${profit.toFixed(2)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded ${med.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                          {med.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
