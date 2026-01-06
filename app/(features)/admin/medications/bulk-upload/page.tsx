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
}

export default function BulkUploadMedicationsPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);

  // Load pharmacies on mount
  useEffect(() => {
    const loadPharmacies = async () => {
      try {
        const response = await fetch("/api/admin/pharmacies");
        const data = await response.json();
        if (data.success && data.pharmacies) {
          setPharmacies(data.pharmacies);
        }
      } catch (error) {
        console.error("Error loading pharmacies:", error);
      }
    };
    loadPharmacies();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadResult(null); // Clear previous results
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/medications/bulk-upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
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
    const csvContent = `pharmacy_id,name,strength,form,ndc,retail_price,category,dosage_instructions,detailed_description,in_stock,preparation_time_days,notes
your-pharmacy-id-here,Semaglutide + B12 Injection,10mg/0.5mg/mL,Injection,12345-678-90,70.00,Weight Loss (GLP-1),Inject 25 units under the skin once weekly,This medication helps with weight loss by suppressing appetite,true,3,Requires refrigeration
your-pharmacy-id-here,Tirzepatide 5mg,5mg/mL,Injection,98765-432-10,85.00,Weight Loss (GLP-1),Inject as directed by physician,GLP-1 receptor agonist for weight management,true,0,`;

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
          <li>Download the CSV template below</li>
          <li>Fill in your medication data following the template format</li>
          <li>Save the file and upload it using the form below</li>
          <li>Review the results and fix any errors if needed</li>
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

      {/* Available Pharmacies */}
      {pharmacies.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-green-900 mb-3">Available Pharmacy IDs</h2>
          <p className="text-sm text-green-800 mb-3">
            Copy one of these pharmacy IDs to use in your CSV file:
          </p>
          <div className="space-y-2">
            {pharmacies.map((pharmacy) => (
              <div
                key={pharmacy.id}
                className="bg-white border border-green-300 rounded p-3 flex justify-between items-center"
              >
                <div>
                  <div className="font-semibold text-gray-900">{pharmacy.name}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    <code className="bg-gray-100 px-2 py-1 rounded">{pharmacy.id}</code>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(pharmacy.id);
                  }}
                  className="text-green-700 border-green-300 hover:bg-green-100"
                >
                  Copy ID
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CSV Format Guide */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">CSV Format Guide</h2>
        <div className="space-y-3 text-sm text-gray-700">
          <div>
            <span className="font-semibold">Required Fields:</span>
            <ul className="list-disc list-inside ml-4 mt-1">
              <li><code className="bg-gray-200 px-1 rounded">pharmacy_id</code> - Your pharmacy ID (copy from above)</li>
              <li><code className="bg-gray-200 px-1 rounded">name</code> - Medication name</li>
              <li><code className="bg-gray-200 px-1 rounded">retail_price</code> - Price in dollars (e.g., 70.00)</li>
            </ul>
          </div>
          <div>
            <span className="font-semibold">Optional Fields:</span>
            <ul className="list-disc list-inside ml-4 mt-1">
              <li><code className="bg-gray-200 px-1 rounded">strength</code> - e.g., &quot;10mg/mL&quot;</li>
              <li><code className="bg-gray-200 px-1 rounded">form</code> - Injection, Tablet, Capsule, etc.</li>
              <li><code className="bg-gray-200 px-1 rounded">ndc</code> - National Drug Code</li>
              <li><code className="bg-gray-200 px-1 rounded">category</code> - Medication category</li>
              <li><code className="bg-gray-200 px-1 rounded">dosage_instructions</code> - Usage instructions</li>
              <li><code className="bg-gray-200 px-1 rounded">detailed_description</code> - Full description</li>
              <li><code className="bg-gray-200 px-1 rounded">in_stock</code> - true or false</li>
              <li><code className="bg-gray-200 px-1 rounded">preparation_time_days</code> - Number of days (0-30)</li>
              <li><code className="bg-gray-200 px-1 rounded">notes</code> - Additional notes</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Upload Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload CSV File</h2>

        <div className="space-y-4">
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
            disabled={!file || isUploading}
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
            onClick={() => setUploadResult(null)}
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
