"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Clock, PackageX, Pill, ChevronUp, ChevronDown, Trash2, Plus } from "lucide-react";

interface Medication {
  id: string;
  pharmacy_id: string;
  name: string;
  strength: string | null;
  vial_size: string | null;
  form: string | null;
  ndc: string | null;
  retail_price_cents: number;
  doctor_markup_percent: number;
  category: string | null;
  dosage_instructions: string | null;
  detailed_description: string | null;
  image_url: string | null;
  is_active: boolean;
  in_stock: boolean | null;
  preparation_time_days: number | null;
  notes: string | null;
  created_at: string;
  pharmacies?: {
    name: string;
  };
}

// Default categories
const DEFAULT_CATEGORIES = [
  "Peptides & Growth Hormone",
  "Sexual Health",
  "Anti-Aging / NAD+",
  "Bundles",
  "Sleep & Recovery",
  "Immune Health",
  "Traditional Rx",
];

export default function MedicationCatalogPage() {
  const router = useRouter();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedMedicationId, setExpandedMedicationId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingMedicationId, setDeletingMedicationId] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [selectedMedications, setSelectedMedications] = useState<Set<string>>(new Set());
  const [availableCategories, setAvailableCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const itemsPerPage = 20;

  // Load categories from localStorage
  const loadCategories = () => {
    if (typeof window === 'undefined') return;

    const savedCategories = localStorage.getItem('customMedicationCategories');
    const savedDeletedCategories = localStorage.getItem('deletedMedicationCategories');

    try {
      const customCats = savedCategories ? JSON.parse(savedCategories) : [];
      const deletedCats = savedDeletedCategories ? JSON.parse(savedDeletedCategories) : [];

      // Combine default and custom, remove duplicates and deleted ones
      const allCategories = [...DEFAULT_CATEGORIES, ...customCats];
      const uniqueCategories = Array.from(new Set(allCategories)).filter(
        (cat) => !deletedCats.includes(cat)
      );
      setAvailableCategories(uniqueCategories);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  // Load medications function
  const loadMedications = async () => {
    setIsLoadingData(true);
    try {
      const response = await fetch("/api/admin/medications");
      const data = await response.json();
      console.log("Medications API response:", data);
      console.log("Medications count:", data.medications?.length);
      if (data.success) {
        setMedications(data.medications || []);
      } else {
        console.error("API error:", data.error);
      }
    } catch (error) {
      console.error("Error loading medications:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Load medications and categories on mount
  useEffect(() => {
    loadMedications();
    loadCategories();
  }, []);

  // Sync categories when window gets focus or storage changes
  useEffect(() => {
    const handleFocus = () => {
      loadCategories();
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'customMedicationCategories' || e.key === 'deletedMedicationCategories') {
        loadCategories();
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Delete medication
  const handleDeleteMedication = async (medicationId: string) => {
    if (!confirm("Are you sure you want to delete this medication? This action cannot be undone.")) {
      return;
    }

    setDeletingMedicationId(medicationId);
    try {
      const response = await fetch(`/api/admin/medications/${medicationId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        // Remove medication from local state
        setMedications(medications.filter(med => med.id !== medicationId));
        // Close expanded view if this medication was expanded
        if (expandedMedicationId === medicationId) {
          setExpandedMedicationId(null);
        }
      } else {
        alert(`Failed to delete medication: ${data.error}`);
      }
    } catch (error) {
      console.error("Error deleting medication:", error);
      alert("Failed to delete medication. Please try again.");
    } finally {
      setDeletingMedicationId(null);
    }
  };

  const handleToggleSelect = (medicationId: string) => {
    const newSelected = new Set(selectedMedications);
    if (newSelected.has(medicationId)) {
      newSelected.delete(medicationId);
    } else {
      newSelected.add(medicationId);
    }
    setSelectedMedications(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedMedications.size === paginatedMedications.length) {
      setSelectedMedications(new Set());
    } else {
      setSelectedMedications(new Set(paginatedMedications.map(med => med.id)));
    }
  };

  const handleDeleteSelected = async () => {
    const count = selectedMedications.size;
    if (count === 0) return;

    if (!confirm(`Are you sure you want to delete ${count} selected medication(s)? This action cannot be undone.`)) {
      return;
    }

    setIsDeletingAll(true);
    let deleted = 0;
    let failed = 0;

    try {
      for (const medId of Array.from(selectedMedications)) {
        try {
          const response = await fetch(`/api/admin/medications/${medId}`, {
            method: "DELETE",
          });
          const data = await response.json();
          if (data.success) {
            deleted++;
          } else {
            failed++;
          }
        } catch {
          failed++;
        }
      }

      alert(`Deleted ${deleted} medications. ${failed > 0 ? `Failed to delete ${failed} medications.` : ''}`);

      // Clear selections and reload
      setSelectedMedications(new Set());
      await loadMedications();
    } catch (error) {
      console.error("Error during bulk delete:", error);
      alert("Failed to complete bulk delete. Please try again.");
    } finally {
      setIsDeletingAll(false);
    }
  };

  // Get unique categories from medications
  const categories = ["All", ...availableCategories];

  // Filter medications
  const filteredMedications = medications.filter((med) => {
    const matchesCategory = categoryFilter === "All" || med.category === categoryFilter;
    const matchesSearch =
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.strength?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.form?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  console.log("Total medications:", medications.length);
  console.log("Filtered medications:", filteredMedications.length);
  console.log("isLoadingData:", isLoadingData);

  // Pagination
  const totalPages = Math.ceil(filteredMedications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMedications = filteredMedications.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, searchQuery]);

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4 flex flex-col min-h-screen">
      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, strength, or form..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filter */}
        <div className="w-64 flex-shrink-0">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by category" />
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

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => router.push("/admin/medications")}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Medication
          </Button>
          <Button
            onClick={() => router.push("/admin/medications/bulk-upload")}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Bulk Upload CSV
          </Button>
          {selectedMedications.size > 0 && (
            <Button
              onClick={handleDeleteSelected}
              disabled={isDeletingAll}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isDeletingAll ? "Deleting..." : `Delete Selected (${selectedMedications.size})`}
            </Button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          Showing {filteredMedications.length} of {medications.length} medications
        </p>
      </div>

      {/* Medications Table */}
      <div className="bg-white border border-border rounded-lg overflow-hidden flex-1 mb-6">
        <div className="overflow-x-auto">
          {isLoadingData ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading medications...</p>
            </div>
          ) : filteredMedications.length === 0 ? (
            <div className="text-center py-12">
              <Pill className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No medications found</p>
              <p className="text-sm text-muted-foreground">
                {categoryFilter !== "All" || searchQuery
                  ? "Try adjusting your filters"
                  : "No medications in the catalog"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold w-[50px]">
                    <input
                      type="checkbox"
                      checked={selectedMedications.size === paginatedMedications.length && paginatedMedications.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </TableHead>
                  <TableHead className="font-semibold w-[40%]">Medication</TableHead>
                  <TableHead className="font-semibold w-[25%]">Pharmacy</TableHead>
                  <TableHead className="font-semibold w-[15%]">Stock Status</TableHead>
                  <TableHead className="font-semibold w-[15%]">Status</TableHead>
                  <TableHead className="font-semibold w-[5%] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMedications.map((med) => {
                  const isExpanded = expandedMedicationId === med.id;

                  return (
                    <React.Fragment key={med.id}>
                      <TableRow className="hover:bg-gray-50">
                        <TableCell className="w-[50px]">
                          <input
                            type="checkbox"
                            checked={selectedMedications.has(med.id)}
                            onChange={() => handleToggleSelect(med.id)}
                            className="w-4 h-4 cursor-pointer"
                          />
                        </TableCell>
                        <TableCell className="w-[40%]">
                          <div className="font-medium">{med.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {med.strength && `${med.strength} • `}
                            {med.form}
                          </div>
                        </TableCell>
                        <TableCell className="w-[25%]">
                          <span className="text-sm font-medium">
                            {med.pharmacies?.name || "N/A"}
                          </span>
                        </TableCell>
                        <TableCell className="w-[15%]">
                          <span
                            className={`text-xs px-2 py-1 rounded inline-block ${
                              med.in_stock !== false
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {med.in_stock !== false ? "In Stock" : "Out of Stock"}
                          </span>
                        </TableCell>
                        <TableCell className="w-[15%]">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              med.is_active
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {med.is_active ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell className="w-[5%] text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedMedicationId(isExpanded ? null : med.id)}
                              className="h-8 w-8 p-0"
                              title="View Details"
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMedication(med.id)}
                              disabled={deletingMedicationId === med.id}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete Medication"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Detail Row */}
                      {isExpanded && (
                        <TableRow className="bg-blue-50">
                          <TableCell colSpan={7} className="py-6 px-8">
                            <div className="space-y-4">
                              {/* Basic Info */}
                              <div className="bg-white rounded-lg p-4 border border-gray-200">
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{med.name}</h3>
                                <div className="space-y-1 text-sm">
                                  {med.strength && (
                                    <p className="text-gray-700">
                                      <span className="font-semibold">Strength:</span> {med.strength}
                                    </p>
                                  )}
                                  {med.vial_size && (
                                    <p className="text-gray-700">
                                      <span className="font-semibold">Vial Size:</span> {med.vial_size}
                                    </p>
                                  )}
                                  {med.form && (
                                    <p className="text-gray-700">
                                      <span className="font-semibold">Form:</span> {med.form}
                                    </p>
                                  )}
                                  {med.category && (
                                    <p className="text-gray-700">
                                      <span className="font-semibold">Category:</span> {med.category}
                                    </p>
                                  )}
                                  {med.ndc && (
                                    <p className="text-gray-700">
                                      <span className="font-semibold">NDC:</span> {med.ndc}
                                    </p>
                                  )}
                                  <p className="text-gray-700">
                                    <span className="font-semibold">Base Price:</span>{" "}
                                    ${(med.retail_price_cents / 100).toFixed(2)}
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Dosage Instructions */}
                                {med.dosage_instructions && (
                                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                                    <h4 className="font-semibold text-gray-900 mb-2">
                                      Dosage Instructions
                                    </h4>
                                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                                      {med.dosage_instructions}
                                    </p>
                                  </div>
                                )}

                                {/* Detailed Description */}
                                {med.detailed_description && (
                                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                                    <h4 className="font-semibold text-gray-900 mb-2">
                                      Detailed Description
                                    </h4>
                                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                                      {med.detailed_description}
                                    </p>
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
                                      <span className="font-semibold">In Stock:</span>{" "}
                                      <span
                                        className={
                                          med.in_stock !== false
                                            ? "text-green-600 font-bold"
                                            : "text-red-600 font-bold"
                                        }
                                      >
                                        {med.in_stock !== false ? "Yes" : "No"}
                                      </span>
                                    </p>
                                    {med.preparation_time_days && med.preparation_time_days > 0 && (
                                      <p className="text-gray-700 flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        <span className="font-semibold">Preparation Time:</span>{" "}
                                        {med.preparation_time_days} days
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Notes */}
                                {med.notes && (
                                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                                    <h4 className="font-semibold text-amber-900 mb-2">
                                      Special Notes
                                    </h4>
                                    <p className="text-amber-800 text-sm leading-relaxed whitespace-pre-wrap">
                                      {med.notes}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Pagination Controls - Fixed at bottom */}
      {!isLoadingData && filteredMedications.length > 0 && totalPages > 1 && (
        <div className="mt-auto py-4 flex justify-center items-center gap-6 border-t border-gray-200 bg-white">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className={`text-2xl ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-gray-900 cursor-pointer'}`}
          >
            ←
          </button>

          <p className="text-sm text-gray-600">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredMedications.length)} of {filteredMedications.length} medications
          </p>

          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className={`text-2xl ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-gray-900 cursor-pointer'}`}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
