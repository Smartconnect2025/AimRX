"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Search, Eye, Clock, PackageX, Pill, ChevronUp } from "lucide-react";

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

// Default categories
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

export default function MedicationCatalogPage() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedMedicationId, setExpandedMedicationId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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

  // Get unique categories from medications
  const categories = ["All", ...defaultCategories];

  // Filter medications
  const filteredMedications = medications.filter((med) => {
    const matchesCategory = categoryFilter === "All" || med.category === categoryFilter;
    const matchesSearch =
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.strength?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.form?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredMedications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMedications = filteredMedications.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, searchQuery]);

  const handleRefresh = async () => {
    await loadMedications();
  };

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold">Medication Catalog</h1>
            <p className="text-gray-600 mt-1">View all medications across all pharmacies</p>
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={isLoadingData}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingData ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
        <div className="w-full sm:w-64">
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
      </div>

      {/* Results Count and Pagination Info */}
      <div className="mb-4 flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredMedications.length)} of {filteredMedications.length} medications
        </p>
        {totalPages > 1 && (
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
        )}
      </div>

      {/* Medications Table */}
      <div className="bg-white rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          {isLoadingData ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading medications...</p>
            </div>
          ) : filteredMedications.length === 0 ? (
            <div className="text-center py-12">
              <Pill className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No medications found</p>
              <p className="text-sm text-gray-400">
                {categoryFilter !== "All" || searchQuery
                  ? "Try adjusting your filters"
                  : "No medications in the catalog"}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold">Medication</th>
                  <th className="text-left py-3 px-4 font-semibold">Category</th>
                  <th className="text-left py-3 px-4 font-semibold">Stock</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMedications.map((med) => {
                  const isExpanded = expandedMedicationId === med.id;

                  return (
                    <React.Fragment key={med.id}>
                      <tr className="hover:bg-gray-50">
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
                          <div className="flex flex-col gap-1">
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                med.in_stock !== false
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
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
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              med.is_active
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {med.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedMedicationId(isExpanded ? null : med.id)}
                            className="h-8 w-8 p-0"
                            title="View Details"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </td>
                      </tr>

                      {/* Expanded Detail Row */}
                      {isExpanded && (
                        <tr className="bg-blue-50">
                          <td colSpan={5} className="py-6 px-8">
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
                                  <p className="text-gray-700">
                                    <span className="font-semibold">Form:</span> {med.form}
                                  </p>
                                  <p className="text-gray-700">
                                    <span className="font-semibold">Category:</span>{" "}
                                    {med.category || "N/A"}
                                  </p>
                                  {med.ndc && (
                                    <p className="text-gray-700">
                                      <span className="font-semibold">NDC:</span> {med.ndc}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                                    <h4 className="font-semibold text-gray-900 mb-2">
                                      Detailed Description
                                    </h4>
                                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                                      {med.dosage_instructions}
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
                                      <span className="font-semibold">Status:</span>{" "}
                                      <span
                                        className={
                                          med.in_stock !== false
                                            ? "text-green-600 font-bold"
                                            : "text-red-600 font-bold"
                                        }
                                      >
                                        {med.in_stock !== false ? "In Stock" : "Out of Stock"}
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
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pagination Controls */}
      {!isLoadingData && filteredMedications.length > 0 && totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>

          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className="w-10"
              >
                {page}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
