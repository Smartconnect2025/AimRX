"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pill, Plus, CheckCircle2, AlertCircle, PackageX, Clock, Edit } from "lucide-react";

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
  in_stock: boolean | null;
  preparation_time_days: number | null;
  notes: string | null;
  created_at: string;
}

export default function MedicationManagementPage() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Medication form state
  const [medicationForm, setMedicationForm] = useState({
    name: "",
    strength: "",
    vial_size: "", // NEW: Vial size field
    form: "Injection",
    ndc: "",
    retail_price: "", // Pharmacy's cost - what pharmacy charges
    category: "Weight Loss (GLP-1)",
    dosage_instructions: "",
    detailed_description: "", // NEW: Detailed description
    image_url: "",
    in_stock: true,
    preparation_time_days: "",
    notes: "",
  });
  const [isCreatingMedication, setIsCreatingMedication] = useState(false);
  const [medicationResult, setMedicationResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);

  // Edit mode state
  const [editingMedicationId, setEditingMedicationId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Custom category state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  // Categories - Default + Custom
  const defaultCategories = [
    "Weight Loss (GLP-1)",
    "Peptides & Growth Hormone",
    "Sexual Health",
    "Anti-Aging / NAD+",
    "Bundles",
    "Sleep & Recovery",
    "Immune Health",
    "Traditional Rx",
  ];
  const categories = [...defaultCategories, ...customCategories];

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

  // Load medications function
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

  // Load medications on mount
  useEffect(() => {
    loadMedications();
  }, []);

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
      console.log("Create medication response:", data);
      setMedicationResult(data);

      if (data.success) {
        // Reset form
        setMedicationForm({
          name: "",
          strength: "",
          vial_size: "",
          form: "Injection",
          ndc: "",
          retail_price: "",
          category: "Weight Loss (GLP-1)",
          dosage_instructions: "",
          detailed_description: "",
          image_url: "",
          in_stock: true,
          preparation_time_days: "",
          notes: "",
        });
        // Reload medications
        console.log("Reloading medications after successful creation...");
        await loadMedications();
        console.log("Medications reloaded, count:", medications.length);
      }
    } catch {
      setMedicationResult({ error: "Failed to create medication" });
    } finally {
      setIsCreatingMedication(false);
    }
  };

  // Edit medication - populate form
  // const handleEditMedication = (med: Medication) => {
  //   setEditingMedicationId(med.id);
  //   setMedicationForm({
  //     name: med.name,
  //     strength: med.strength || "",
  //     vial_size: med.strength || "",
  //     form: med.form || "Injection",
  //     ndc: med.ndc || "",
  //     retail_price: (med.retail_price_cents / 100).toString(),
  //     category: med.category || "Weight Loss (GLP-1)",
  //     dosage_instructions: "",
  //     detailed_description: med.dosage_instructions || "",
  //     image_url: med.image_url || "",
  //     in_stock: med.in_stock !== false,
  //     preparation_time_days: med.preparation_time_days?.toString() || "",
  //     notes: med.notes || "",
  //   });
  //   // Scroll to form
  //   window.scrollTo({ top: 0, behavior: "smooth" });
  // };

  // Update medication
  const handleUpdateMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMedicationId) return;

    setIsUpdating(true);
    setMedicationResult(null);

    try {
      const retail_price_cents = Math.round(parseFloat(medicationForm.retail_price) * 100);

      const response = await fetch(`/api/admin/medications/${editingMedicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...medicationForm,
          retail_price_cents,
        }),
      });

      const data = await response.json();
      setMedicationResult(data);

      if (data.success) {
        // Reset form and edit mode
        setEditingMedicationId(null);
        setMedicationForm({
          name: "",
          strength: "",
          vial_size: "",
          form: "Injection",
          ndc: "",
          retail_price: "",
          category: "Weight Loss (GLP-1)",
          dosage_instructions: "",
          detailed_description: "",
          image_url: "",
          in_stock: true,
          preparation_time_days: "",
          notes: "",
        });
        loadMedications();
      }
    } catch {
      setMedicationResult({ error: "Failed to update medication" });
    } finally {
      setIsUpdating(false);
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingMedicationId(null);
    setMedicationForm({
      name: "",
      strength: "",
      vial_size: "",
      form: "Injection",
      ndc: "",
      retail_price: "",
      category: "Weight Loss (GLP-1)",
      dosage_instructions: "",
      detailed_description: "",
      image_url: "",
      in_stock: true,
      preparation_time_days: "",
      notes: "",
    });
    setMedicationResult(null);
  };

  // Add custom category
  const handleAddCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCustomCategories([...customCategories, newCategory]);
      setMedicationForm({ ...medicationForm, category: newCategory });
      setNewCategory("");
      setIsAddingCategory(false);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Medication Management</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CREATE/EDIT MEDICATION FORM - Takes 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${editingMedicationId ? "bg-amber-100" : "bg-blue-100"}`}>
                {editingMedicationId ? (
                  <Edit className="h-6 w-6 text-amber-600" />
                ) : (
                  <Plus className="h-6 w-6 text-blue-600" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {editingMedicationId ? "Edit Medication" : "Add New Medication"}
                </h2>
                <p className="text-sm text-gray-600">
                  {editingMedicationId ? "Update medication details" : "Fill in the medication details below"}
                </p>
              </div>
            </div>
            {editingMedicationId && (
              <Button type="button" variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
            )}
          </div>

          <form onSubmit={editingMedicationId ? handleUpdateMedication : handleCreateMedication} className="space-y-4">
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
                  placeholder="e.g., 10mg/0.5mg/mL"
                  value={medicationForm.strength}
                  onChange={(e) => setMedicationForm({ ...medicationForm, strength: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="med-vial">Vial Size</Label>
                <Input
                  id="med-vial"
                  placeholder="e.g., 2mL, 5mL, or 30 tablets"
                  value={medicationForm.vial_size}
                  onChange={(e) => setMedicationForm({ ...medicationForm, vial_size: e.target.value })}
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

              <div className="md:col-span-2">
                <Label htmlFor="med-category">Category</Label>
                <div className="flex gap-2">
                  <select
                    id="med-category"
                    value={medicationForm.category}
                    onChange={(e) => setMedicationForm({ ...medicationForm, category: e.target.value })}
                    className="flex-1 h-10 px-3 rounded-md border border-gray-300 bg-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddingCategory(!isAddingCategory)}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                {isAddingCategory && (
                  <div className="mt-2 flex gap-2">
                    <Input
                      placeholder="New category name"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCategory())}
                    />
                    <Button type="button" onClick={handleAddCategory} size="sm">
                      Save
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddingCategory(false);
                        setNewCategory("");
                      }}
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
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

              <div className="md:col-span-2">
                <Label htmlFor="med-description">Detailed Description</Label>
                <Textarea
                  id="med-description"
                  placeholder="e.g., This medication helps with weight loss by suppressing appetite and improving insulin sensitivity. Suitable for patients with BMI over 27."
                  value={medicationForm.detailed_description}
                  onChange={(e) => setMedicationForm({ ...medicationForm, detailed_description: e.target.value })}
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">Detailed information about the medication, benefits, and usage</p>
              </div>

              <div>
                <Label htmlFor="med-retail">
                  Price <span className="text-red-500">*</span>
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
              </div>
            </div>

            {/* Stock & Availability Section */}
            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
                <PackageX className="h-4 w-4" />
                Stock & Availability
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="med-in-stock"
                    checked={medicationForm.in_stock}
                    onChange={(e) => setMedicationForm({ ...medicationForm, in_stock: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <Label htmlFor="med-in-stock" className="cursor-pointer">
                    <span className="font-semibold">In Stock</span>
                    <p className="text-xs text-gray-500">Uncheck if medication is out of stock</p>
                  </Label>
                </div>

                <div>
                  <Label htmlFor="med-prep-time" className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Preparation Time (Days)
                  </Label>
                  <Input
                    id="med-prep-time"
                    type="number"
                    min="0"
                    placeholder="e.g., 3"
                    value={medicationForm.preparation_time_days}
                    onChange={(e) => setMedicationForm({ ...medicationForm, preparation_time_days: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Days needed to prepare compounded medication (0 if ready)</p>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="med-notes">Notes</Label>
                  <Textarea
                    id="med-notes"
                    placeholder="e.g., Requires refrigeration, Out of stock until next week, Special preparation instructions..."
                    value={medicationForm.notes}
                    onChange={(e) => setMedicationForm({ ...medicationForm, notes: e.target.value })}
                    rows={2}
                  />
                  <p className="text-xs text-gray-500 mt-1">Out of stock reasons, special instructions, or preparation details</p>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isCreatingMedication || isUpdating}
              className="w-full"
              size="lg"
            >
              {editingMedicationId
                ? (isUpdating ? "Updating..." : "Update Medication")
                : (isCreatingMedication ? "Adding..." : "Add Medication")
              }
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
    </div>
  );
}
