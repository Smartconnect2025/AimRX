"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pill, Plus, CheckCircle2, AlertCircle, DollarSign, Upload, X, ChevronUp, Eye, Edit, Trash2, PackageX, Clock } from "lucide-react";

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
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [isCreatingMedication, setIsCreatingMedication] = useState(false);
  const [medicationResult, setMedicationResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);

  // Image upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Expanded medication row for detail view
  const [expandedMedicationId, setExpandedMedicationId] = useState<string | null>(null);

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

  // Handle file selection for image upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload image to server
  const handleUploadImage = async () => {
    if (!selectedFile || !medicationForm.name) {
      setMedicationResult({ error: "Please enter medication name before uploading image" });
      return;
    }

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("medicationName", medicationForm.name);

      const response = await fetch("/api/admin/medications/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.url) {
        setMedicationForm({ ...medicationForm, image_url: data.url });
        setSelectedFile(null); // Clear file input after successful upload
        setMedicationResult({ success: true, message: "Image uploaded successfully!" });
      } else {
        setMedicationResult({ error: data.error || "Failed to upload image" });
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      setMedicationResult({ error: "Failed to upload image" });
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Clear selected image
  const handleClearImage = () => {
    setSelectedFile(null);
    setImagePreview("");
    setMedicationForm({ ...medicationForm, image_url: "" });
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
        // Reset image state
        setSelectedFile(null);
        setImagePreview("");
        // Reload medications
        loadMedications();
      }
    } catch {
      setMedicationResult({ error: "Failed to create medication" });
    } finally {
      setIsCreatingMedication(false);
    }
  };

  // Edit medication - populate form
  const handleEditMedication = (med: Medication) => {
    setEditingMedicationId(med.id);
    setMedicationForm({
      name: med.name,
      strength: med.strength || "",
      vial_size: med.strength || "",
      form: med.form || "Injection",
      ndc: med.ndc || "",
      retail_price: (med.retail_price_cents / 100).toString(),
      category: med.category || "Weight Loss (GLP-1)",
      dosage_instructions: "",
      detailed_description: med.dosage_instructions || "",
      image_url: med.image_url || "",
      in_stock: med.in_stock !== false,
      preparation_time_days: med.preparation_time_days?.toString() || "",
      notes: med.notes || "",
    });
    setImagePreview(med.image_url || "");
    // Scroll to form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
        setSelectedFile(null);
        setImagePreview("");
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
    setSelectedFile(null);
    setImagePreview("");
    setMedicationResult(null);
  };

  // Delete medication
  const handleDeleteMedication = async (medicationId: string, medicationName: string) => {
    if (!confirm(`Are you sure you want to delete "${medicationName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/medications/${medicationId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setMedicationResult({ success: true, message: data.message });
        loadMedications();
      } else {
        setMedicationResult({ error: data.error });
      }
    } catch {
      setMedicationResult({ error: "Failed to delete medication" });
    }
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

  // Filter medications by category
  const filteredMedications = categoryFilter === "All"
    ? medications
    : medications.filter(m => m.category === categoryFilter);

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">💊 Medication Management</h1>
        <p className="text-gray-600">Add and manage medications for your pharmacy</p>
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

            {/* Pricing Section */}
            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Pharmacy Cost Pricing
              </h3>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800 font-semibold">ℹ️ Important: Doctors set their own markup</p>
                <p className="text-xs text-blue-700 mt-1">
                  You only set your pharmacy&apos;s cost. Each doctor will add their own markup when prescribing to patients.
                </p>
              </div>

              <div>
                <Label htmlFor="med-retail">
                  Pharmacy Cost (What you charge doctors) <span className="text-red-500">*</span>
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
                <p className="text-xs text-gray-500 mt-1">Amount in dollars - Your pharmacy&apos;s wholesale cost to doctors</p>
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Medication Image (Optional)
              </h3>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-purple-800 font-semibold">📸 Recommended Image Size: 400x400px</p>
                <p className="text-xs text-purple-700 mt-1">
                  Use square images (JPG, PNG, or WebP) up to 3MB. Higher quality images display better.
                </p>
              </div>

              {/* Image Preview */}
              {(imagePreview || medicationForm.image_url) && (
                <div className="mb-4 flex items-start gap-4">
                  <div className="relative">
                    <img
                      src={imagePreview || medicationForm.image_url}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-600 mb-1">✓ Image ready</p>
                    <p className="text-xs text-gray-600">
                      {medicationForm.image_url ? "Uploaded to storage" : "Preview - click Upload to save"}
                    </p>
                  </div>
                </div>
              )}

              {/* File Input or URL Input */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="med-image-file" className="cursor-pointer">
                    Upload Image File
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="med-image-file"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleFileSelect}
                      className="flex-1"
                    />
                    {selectedFile && !medicationForm.image_url && (
                      <Button
                        type="button"
                        onClick={handleUploadImage}
                        disabled={isUploadingImage || !medicationForm.name}
                        variant="secondary"
                      >
                        {isUploadingImage ? "Uploading..." : "Upload"}
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Select an image file from your computer (max 3MB)
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or use URL</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="med-image-url">Image URL</Label>
                  <Input
                    id="med-image-url"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={medicationForm.image_url}
                    onChange={(e) => setMedicationForm({ ...medicationForm, image_url: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Or paste a direct link to an image</p>
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

      {/* EXISTING MEDICATIONS LIST */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <Pill className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Your Medications</h2>
              <p className="text-sm text-gray-600">{filteredMedications.length} medications {categoryFilter !== "All" && `in ${categoryFilter}`}</p>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Label htmlFor="category-filter" className="text-sm">Filter:</Label>
            <select
              id="category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 px-3 rounded-md border border-gray-300 bg-white text-sm"
            >
              <option value="All">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoadingData ? (
          <p className="text-gray-500">Loading medications...</p>
        ) : filteredMedications.length === 0 ? (
          <div className="text-center py-12">
            <Pill className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No medications found</p>
            <p className="text-sm text-gray-400">{categoryFilter !== "All" ? "Try selecting a different category" : "Add your first medication using the form above"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold">Image</th>
                  <th className="text-left py-3 px-4 font-semibold">Medication</th>
                  <th className="text-left py-3 px-4 font-semibold">Category</th>
                  <th className="text-left py-3 px-4 font-semibold">Pharmacy Cost</th>
                  <th className="text-left py-3 px-4 font-semibold">Stock</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMedications.map((med) => {
                  const pharmacyCost = med.retail_price_cents / 100;
                  const isExpanded = expandedMedicationId === med.id;

                  return (
                    <>
                      <tr key={med.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          {med.image_url ? (
                            <img
                              src={med.image_url}
                              alt={med.name}
                              className="w-12 h-12 object-cover rounded border border-gray-200"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                              <Pill className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </td>
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
                        <td className="py-3 px-4">
                          <span className="font-semibold text-blue-600">${pharmacyCost.toFixed(2)}</span>
                          <p className="text-xs text-gray-500">Doctors set markup</p>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1">
                            <span className={`text-xs px-2 py-1 rounded ${med.in_stock !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                              {med.in_stock !== false ? "In Stock" : "Out of Stock"}
                            </span>
                            {med.preparation_time_days && med.preparation_time_days > 0 && (
                              <span className="text-xs text-gray-600 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {med.preparation_time_days}d prep
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-1 rounded ${med.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                            {med.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedMedicationId(isExpanded ? null : med.id)}
                              className="h-8 w-8 p-0"
                              title="View Details"
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditMedication(med)}
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMedication(med.id, med.name)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Detail Row */}
                      {isExpanded && (
                        <tr key={`${med.id}-details`} className="bg-blue-50 border-b">
                          <td colSpan={7} className="py-6 px-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Left Column - Image and Basic Info */}
                              <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                  {med.image_url ? (
                                    <img
                                      src={med.image_url}
                                      alt={med.name}
                                      className="w-48 h-48 object-cover rounded-lg border-2 border-gray-300 shadow-md"
                                    />
                                  ) : (
                                    <div className="w-48 h-48 bg-gray-200 rounded-lg border-2 border-gray-300 flex items-center justify-center">
                                      <Pill className="h-20 w-20 text-gray-400" />
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{med.name}</h3>
                                    <div className="space-y-1 text-sm">
                                      {med.strength && (
                                        <p className="text-gray-700">
                                          <span className="font-semibold">Strength:</span> {med.strength}
                                        </p>
                                      )}
                                      <p className="text-gray-700">
                                        <span className="font-semibold">Form:</span> {med.form}
                                      </p>
                                      <p className="text-gray-700">
                                        <span className="font-semibold">Category:</span> {med.category || "N/A"}
                                      </p>
                                      {med.ndc && (
                                        <p className="text-gray-700">
                                          <span className="font-semibold">NDC:</span> {med.ndc}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Right Column - Detailed Info */}
                              <div className="space-y-4">
                                {/* Vial Size */}
                                {med.strength && (
                                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                      <Pill className="h-4 w-4" />
                                      Vial Size / Quantity
                                    </h4>
                                    <p className="text-gray-700">{med.strength}</p>
                                  </div>
                                )}

                                {/* Detailed Description */}
                                {med.dosage_instructions && (
                                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                                    <h4 className="font-semibold text-gray-900 mb-2">Detailed Description</h4>
                                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                                      {med.dosage_instructions}
                                    </p>
                                  </div>
                                )}

                                {/* Dosage Instructions */}
                                {med.dosage_instructions && (
                                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                                    <h4 className="font-semibold text-gray-900 mb-2">Dosage Instructions (SIG)</h4>
                                    <p className="text-gray-700 text-sm">{med.dosage_instructions}</p>
                                  </div>
                                )}

                                {/* Stock & Availability */}
                                <div className="bg-white rounded-lg p-4 border border-gray-200">
                                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <PackageX className="h-4 w-4" />
                                    Stock & Availability
                                  </h4>
                                  <div className="space-y-1 text-sm">
                                    <p className="text-gray-700">
                                      <span className="font-semibold">Status:</span>{" "}
                                      <span className={med.in_stock !== false ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                                        {med.in_stock !== false ? "In Stock" : "Out of Stock"}
                                      </span>
                                    </p>
                                    {med.preparation_time_days && med.preparation_time_days > 0 && (
                                      <p className="text-gray-700 flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        <span className="font-semibold">Preparation Time:</span> {med.preparation_time_days} days
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Notes */}
                                {med.notes && (
                                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                                    <h4 className="font-semibold text-amber-900 mb-2">Special Notes</h4>
                                    <p className="text-amber-800 text-sm leading-relaxed whitespace-pre-wrap">
                                      {med.notes}
                                    </p>
                                  </div>
                                )}

                                {/* Pricing */}
                                <div className="bg-white rounded-lg p-4 border border-gray-200">
                                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <DollarSign className="h-4 w-4" />
                                    Pricing Information
                                  </h4>
                                  <div className="space-y-1 text-sm">
                                    <p className="text-gray-700">
                                      <span className="font-semibold">Pharmacy Cost:</span>{" "}
                                      <span className="text-blue-600 font-bold">${pharmacyCost.toFixed(2)}</span>
                                    </p>
                                    <p className="text-xs text-gray-500 italic">Doctors add their own markup when prescribing</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
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
