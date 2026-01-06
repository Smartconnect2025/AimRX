"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle2, AlertCircle, Download, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface UploadResult {
  success: boolean;
  message: string;
  imported: number;
  failed: number;
  errors?: string[];
}

interface Pharmacy {
  id: string;
  name: string;
  is_active: boolean;
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

export default function BulkUploadMedicationsPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string>("");
  const [isPharmacyAdmin, setIsPharmacyAdmin] = useState(false);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [showFormatGuide, setShowFormatGuide] = useState(false);

  // CSV headers for Google Sheets (tab-separated)
  const csvHeaders = [
    "name",
    "strength",
    "vial_size",
    "form",
    "ndc",
    "base_price",
    "category",
    "dosage_instructions",
    "detailed_description",
    "in_stock",
    "preparation_time_days",
    "notes"
  ].join("\t");

  // Load pharmacies and custom categories on mount
  // Load categories from localStorage
  const loadCategories = () => {
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
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  useEffect(() => {
    const loadPharmacies = async () => {
      try {
        console.log("Fetching pharmacies from /api/admin/pharmacies");
        const response = await fetch("/api/admin/pharmacies");
        console.log("Pharmacies response status:", response.status);

        if (!response.ok) {
          console.error("Failed to fetch pharmacies:", response.statusText);
          return;
        }

        const data = await response.json();
        console.log("Pharmacies data:", data);

        if (data.success && data.pharmacies) {
          const activePharmacies = data.pharmacies.filter((p: Pharmacy) => p.is_active);
          setPharmacies(activePharmacies);

          // Check if user is pharmacy admin (only one pharmacy available means they're restricted)
          if (activePharmacies.length === 1) {
            setIsPharmacyAdmin(true);
            setSelectedPharmacyId(activePharmacies[0].id);
          }
        }
      } catch (error) {
        console.error("Error loading pharmacies:", error);
      }
    };
    loadPharmacies();

    // Load categories on mount
    loadCategories();

    // Listen for storage changes (when categories are updated in another tab or page)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'customMedicationCategories' || e.key === 'deletedMedicationCategories') {
        loadCategories();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also check for changes on focus (when returning to this page)
    const handleFocus = () => {
      loadCategories();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadResult(null); // Clear previous results
    }
  };

  const handleDismissError = () => {
    setUploadResult(null);
    setFile(null);
    // Reset file input
    const fileInput = document.getElementById("csv-file") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleUpload = async () => {
    if (!file || !selectedPharmacyId) {
      setUploadResult({
        success: false,
        message: "Please select a pharmacy before uploading",
        imported: 0,
        failed: 0,
      });
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      console.log("Starting CSV upload...");
      console.log("Selected pharmacy ID:", selectedPharmacyId);
      console.log("File:", file.name, file.size, "bytes");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("pharmacy_id", selectedPharmacyId);

      console.log("Sending request to /api/admin/medications/bulk-upload");
      const response = await fetch("/api/admin/medications/bulk-upload", {
        method: "POST",
        body: formData,
      });

      console.log("Response status:", response.status);
      console.log("Response statusText:", response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload failed with status:", response.status, errorText);
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Upload result:", data);
      setUploadResult(data);

      if (data.success) {
        // Clear file after successful upload
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById("csv-file") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      }
    } catch (error) {
      console.error("Error uploading CSV:", error);
      setUploadResult({
        success: false,
        message: "Failed to upload CSV file",
        imported: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `name,strength,vial_size,form,ndc,base_price,category,dosage_instructions,detailed_description,in_stock,preparation_time_days,notes
BPC-157 Capsules,500mcg,60 capsules,Capsule,11111-222-33,45.00,Peptides & Growth Hormone,Take 1 capsule twice daily,Peptide that promotes healing and recovery,true,0,
Tadalafil,20mg,30 tablets,Tablet,44444-555-66,35.00,Sexual Health,Take as needed 30 minutes before activity,ED treatment medication,true,0,
NAD+ IV Therapy,500mg,10mL,Injection,77777-888-99,150.00,Anti-Aging / NAD+,Administer IV as directed,Anti-aging and cellular energy support,true,5,Requires medical supervision
Melatonin,10mg,60 tablets,Tablet,22222-333-44,25.00,Sleep & Recovery,Take 1 tablet 30 minutes before bed,Natural sleep support supplement,true,0,
Vitamin C IV,1000mg,10mL,Injection,55555-666-77,120.00,Immune Health,Administer IV as directed,High-dose vitamin C for immune support,true,3,Requires medical supervision`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "medication-bulk-upload-template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/medication-catalog")}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Catalog
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Bulk Upload Medications</h1>
        <p className="text-gray-600 mt-2">
          Upload a CSV file to add multiple medications at once
        </p>
      </div>

      {/* Instructions Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">Instructions</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
          <li>Select the pharmacy from the dropdown below</li>
          <li>Download the CSV template</li>
          <li>Fill in your medication data (NO pharmacy_id needed!)</li>
          <li>Upload the file and review the results</li>
        </ol>
        <div className="mt-4">
          <Button
            onClick={downloadTemplate}
            variant="outline"
            className="bg-white border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            <Download className="h-4 w-4 mr-2" />
            Download CSV Template
          </Button>
        </div>
      </div>

      {/* CSV Format Guide */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">CSV Format Guide</h2>
          <Button
            onClick={() => setShowFormatGuide(!showFormatGuide)}
            variant="outline"
            size="sm"
            className="text-sm"
          >
            {showFormatGuide ? "Hide Details" : "Show Details"}
          </Button>
        </div>
        {showFormatGuide && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mt-4">
          <div className="space-y-3">
            <div className="flex items-start">
              <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-blue-600 min-w-[180px]">name</code>
              <span className="text-sm text-gray-700 ml-3">Medication name</span>
            </div>
            <div className="flex items-start">
              <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-blue-600 min-w-[180px]">base_price</code>
              <span className="text-sm text-gray-700 ml-3">Base price in dollars (example: 70.00)</span>
            </div>
            <div className="flex items-start">
              <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-blue-600 min-w-[180px]">strength</code>
              <span className="text-sm text-gray-700 ml-3">Example: 10mg/mL</span>
            </div>
            <div className="flex items-start">
              <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-blue-600 min-w-[180px]">vial_size</code>
              <span className="text-sm text-gray-700 ml-3">Example: 5mL, 10mL, 30 tablets</span>
            </div>
            <div className="flex items-start">
              <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-blue-600 min-w-[180px]">form</code>
              <span className="text-sm text-gray-700 ml-3">Injection, Tablet, Capsule, etc.</span>
            </div>
            <div className="flex items-start">
              <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-blue-600 min-w-[180px]">ndc</code>
              <span className="text-sm text-gray-700 ml-3">National Drug Code</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex items-start mb-2">
                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-blue-600 min-w-[180px]">category</code>
                <span className="text-sm text-gray-700 ml-3">Pick from list or create new</span>
              </div>
              <div className="ml-4 bg-gray-50 p-3 rounded border border-gray-200">
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Available categories (select to copy):
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {categories.map((cat, index) => (
                    <div
                      key={`${cat}-${index}`}
                      className="bg-white border border-gray-300 rounded px-3 py-2 text-sm hover:bg-blue-50 hover:border-blue-400 cursor-text select-all"
                    >
                      {cat}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Select any category text to copy it, or type a new one in your CSV
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-blue-600 min-w-[180px]">dosage_instructions</code>
              <span className="text-sm text-gray-700 ml-3">How to use the medication</span>
            </div>
            <div className="flex items-start">
              <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-blue-600 min-w-[180px]">detailed_description</code>
              <span className="text-sm text-gray-700 ml-3">Full product description</span>
            </div>
            <div className="flex items-start">
              <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-blue-600 min-w-[180px]">in_stock</code>
              <span className="text-sm text-gray-700 ml-3">Type: true or false</span>
            </div>
            <div className="flex items-start">
              <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-blue-600 min-w-[180px]">preparation_time_days</code>
              <span className="text-sm text-gray-700 ml-3">Number from 0 to 30</span>
            </div>
            <div className="flex items-start">
              <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-blue-600 min-w-[180px]">notes</code>
              <span className="text-sm text-gray-700 ml-3">Any additional information</span>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Copy Headers for Google Sheets */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900 mb-1">Quick Start: Copy Column Headers for Google Sheets</h3>
            <p className="text-xs text-blue-700 mb-3">
              Select the text below, copy with Ctrl+C (Cmd+C on Mac), then paste into Google Sheets row 1. Each header will automatically go into a separate column.
            </p>
            <textarea
              readOnly
              value={csvHeaders}
              onClick={(e) => e.currentTarget.select()}
              className="w-full p-3 bg-white border-2 border-blue-400 rounded text-xs font-mono resize-none focus:outline-none focus:border-blue-600 cursor-text"
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Upload Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload CSV File</h2>

        <div className="space-y-4">
          {/* Pharmacy Selector */}
          <div>
            <label
              htmlFor="pharmacy-select"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {isPharmacyAdmin ? "Pharmacy" : "Select Pharmacy *"}
            </label>
            {isPharmacyAdmin ? (
              <div className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                {pharmacies.length > 0 ? pharmacies[0].name : "Your Pharmacy"}
              </div>
            ) : (
              <select
                id="pharmacy-select"
                value={selectedPharmacyId}
                onChange={(e) => setSelectedPharmacyId(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Choose a pharmacy --</option>
                {pharmacies.map((pharmacy) => (
                  <option key={pharmacy.id} value={pharmacy.id}>
                    {pharmacy.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label
              htmlFor="csv-file"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Select CSV File
            </label>
            <input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                cursor-pointer"
            />
          </div>

          {file && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
              <FileText className="h-4 w-4" />
              <span>{file.name}</span>
              <span className="text-gray-400">
                ({(file.size / 1024).toFixed(2)} KB)
              </span>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={!file || !selectedPharmacyId || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload and Import
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Upload Results */}
      {uploadResult && (
        <div
          className={`border rounded-lg p-6 relative ${
            uploadResult.success
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          {/* Close button */}
          <button
            onClick={handleDismissError}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-start gap-3">
            {uploadResult.success ? (
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h3
                className={`text-lg font-semibold mb-2 ${
                  uploadResult.success ? "text-green-900" : "text-red-900"
                }`}
              >
                {uploadResult.success ? "Upload Successful!" : "Upload Failed"}
              </h3>
              <p
                className={`text-sm mb-3 ${
                  uploadResult.success ? "text-green-800" : "text-red-800"
                }`}
              >
                {uploadResult.message}
              </p>

              {(uploadResult.imported > 0 || uploadResult.failed > 0) && (
                <div className="space-y-2 text-sm">
                  <div
                    className={
                      uploadResult.success ? "text-green-700" : "text-red-700"
                    }
                  >
                    <span className="font-semibold">
                      Successfully imported:
                    </span>{" "}
                    {uploadResult.imported} medication(s)
                  </div>
                  {uploadResult.failed > 0 && (
                    <div
                      className={
                        uploadResult.success ? "text-green-700" : "text-red-700"
                      }
                    >
                      <span className="font-semibold">Failed:</span>{" "}
                      {uploadResult.failed} medication(s)
                    </div>
                  )}
                </div>
              )}

              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-red-900 mb-2">
                    Errors:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                    {uploadResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {uploadResult.success && uploadResult.imported > 0 && (
                <Button
                  onClick={() => router.push("/admin/medication-catalog")}
                  className="mt-4 bg-green-600 hover:bg-green-700"
                >
                  View Medications
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
