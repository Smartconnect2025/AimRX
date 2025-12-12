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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Eye, Clock, PackageX, Pill, ChevronUp } from "lucide-react";

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
  pharmacy?: {
    name: string;
  };
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

  return (
    <div className="container mx-auto max-w-7xl py-4 px-4">
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
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          Showing {filteredMedications.length} of {medications.length} medications
        </p>
      </div>

      {/* Medications Table */}
      <div className="bg-white border border-border rounded-lg overflow-hidden">
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
                  <TableHead className="font-semibold">Medication</TableHead>
                  <TableHead className="font-semibold">Pharmacy</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold">Stock</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMedications.map((med) => {
                  const isExpanded = expandedMedicationId === med.id;

                  return (
                    <React.Fragment key={med.id}>
                      <TableRow className="hover:bg-gray-50">
                        <TableCell>
                          <div className="font-medium">{med.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {med.strength && `${med.strength} • `}
                            {med.form}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">
                            {med.pharmacy?.name || "N/A"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {med.category || "Uncategorized"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-xs px-2 py-1 rounded inline-block w-fit ${
                              med.in_stock !== false
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {med.in_stock !== false ? "In Stock" : "Out of Stock"}
                          </span>
                        </TableCell>
                        <TableCell>
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
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedMedicationId(isExpanded ? null : med.id)}
                            className="h-8 w-8 p-0"
                            title="View Details"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Detail Row */}
                      {isExpanded && (
                        <TableRow className="bg-blue-50">
                          <TableCell colSpan={6} className="py-6 px-8">
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

      {/* Pagination Controls */}
      {!isLoadingData && filteredMedications.length > 0 && totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center gap-6">
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
