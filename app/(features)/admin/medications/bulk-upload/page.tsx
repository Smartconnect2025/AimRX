"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  ArrowLeft,
  FlaskConical,
  Info,
  Copy,
  Check,
} from "lucide-react";
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

interface Category {
  id: number;
  name: string;
  is_active: boolean;
}

export default function BulkUploadMedicationsPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string>("");
  const [isPharmacyAdmin, setIsPharmacyAdmin] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<"upload" | "format" | "ingredients">("upload");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  useEffect(() => {
    const loadPharmacies = async () => {
      try {
        const response = await fetch("/api/admin/pharmacies");
        if (!response.ok) return;
        const data = await response.json();
        if (data.success && data.pharmacies) {
          const activePharmacies = data.pharmacies.filter((p: Pharmacy) => p.is_active);
          setPharmacies(activePharmacies);
          if (activePharmacies.length === 1) {
            setIsPharmacyAdmin(true);
            setSelectedPharmacyId(activePharmacies[0].id);
          }
        }
      } catch (error) {
        console.error("Error loading pharmacies:", error);
      }
    };

    const loadCategories = async () => {
      try {
        const response = await fetch("/api/admin/categories");
        if (!response.ok) return;
        const data = await response.json();
        if (data.categories) {
          setCategories(data.categories.filter((c: Category) => c.is_active));
        }
      } catch (error) {
        console.error("Error loading categories:", error);
      }
    };

    loadPharmacies();
    loadCategories();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadResult(null);
    }
  };

  const handleDismissError = () => {
    setUploadResult(null);
    setFile(null);
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
      const formData = new FormData();
      formData.append("file", file);
      formData.append("pharmacy_id", selectedPharmacyId);

      const response = await fetch("/api/admin/medications/bulk-upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload failed:", response.status, errorText);
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setUploadResult(data);

      if (data.success) {
        setFile(null);
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
    const csvContent = `name,strength,vial_size,form,ndc,retail_price_cents,category,dosage_instructions,detailed_description,in_stock,preparation_time_days,aimrx_site_pricing_cents,notes
"LIPO-B 50mg/50mg/25mg/1mg/mL",,10mL,Injection,,25.00,Weight Loss & Metabolism,"Inject 1 mL (100 units) into the muscle two times a week.","Active Ingredients (per 1 mL):
• Cyanocobalamin (Vitamin B12) — 1 mg/mL
• Inositol — 50 mg/mL
• Methionine — 25 mg/mL
• Choline Chloride — 50 mg/mL

A lipotropic injection blend designed to support fat metabolism, energy production, and liver function.",true,0,50.00,
BPC-157 Capsules,500mcg,60 capsules,Capsule,,45.00,Anti-Inflammatory & Healing,Take 1 capsule twice daily,Peptide that promotes healing and recovery,true,0,55.00,
NAD+ IV Therapy,500mg,10mL,Injection,,150.00,NAD+ & Biohacking,Administer IV as directed,"Active Ingredients (per vial):
• NAD+ (Nicotinamide Adenine Dinucleotide) — 500 mg

Anti-aging and cellular energy support. Administered via IV infusion.",true,5,180.00,Compounded to order
Semaglutide + B12 Injection,10mg/0.5mg/mL,1mL,Injection,,90.00,Weight Loss & Metabolism,"Inject subcutaneously once weekly as directed by provider.","Active Ingredients (per 1 mL):
• Semaglutide — 10 mg/mL
• Cyanocobalamin (Vitamin B12) — 0.5 mg/mL

GLP-1 receptor agonist with B12 for weight management.",true,0,110.00,`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "aimrx-medication-upload-template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: "upload" as const, label: "Upload", icon: Upload },
    { id: "format" as const, label: "CSV Format", icon: FileText },
    { id: "ingredients" as const, label: "Ingredients", icon: FlaskConical },
  ];

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/medication-catalog")}
          className="mb-4 -ml-2"
          data-testid="button-back-catalog"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Catalog
        </Button>
        <h1 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">
          Bulk Upload Medications
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Add multiple medications at once using a CSV file
        </p>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg" data-testid="tab-navigation">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
            data-testid={`tab-${tab.id}`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "upload" && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Quick Steps
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { step: "1", text: "Download the CSV template below" },
                { step: "2", text: "Fill in your medications (keep the header row)" },
                { step: "3", text: "Upload and import" },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3 bg-white/60 rounded-lg p-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                    {item.step}
                  </span>
                  <span className="text-sm text-blue-800">{item.text}</span>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button
                onClick={downloadTemplate}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="button-download-template"
              >
                <Download className="h-4 w-4 mr-2" />
                Download CSV Template
              </Button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Upload File</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="pharmacy-select" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Pharmacy
                </label>
                {isPharmacyAdmin ? (
                  <div className="block w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm">
                    {pharmacies.length > 0 ? pharmacies[0].name : "Your Pharmacy"}
                  </div>
                ) : (
                  <select
                    id="pharmacy-select"
                    value={selectedPharmacyId}
                    onChange={(e) => setSelectedPharmacyId(e.target.value)}
                    className="block w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    data-testid="select-pharmacy"
                  >
                    <option value="">Choose a pharmacy</option>
                    {pharmacies.map((pharmacy) => (
                      <option key={pharmacy.id} value={pharmacy.id}>
                        {pharmacy.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label htmlFor="csv-file" className="block text-sm font-medium text-gray-700 mb-1.5">
                  CSV File
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-blue-300 transition-colors">
                  <input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    data-testid="input-csv-file"
                  />
                  {file ? (
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-gray-900">{file.name}</span>
                      <span className="text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  ) : (
                    <label htmlFor="csv-file" className="cursor-pointer">
                      <Upload className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        <span className="text-blue-600 font-medium">Click to browse</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-400 mt-1">CSV files only</p>
                    </label>
                  )}
                </div>
              </div>

              <Button
                onClick={handleUpload}
                disabled={!file || !selectedPharmacyId || isUploading}
                className="w-full h-11"
                data-testid="button-upload"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Importing...
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

          {uploadResult && (
            <div
              className={`border rounded-xl p-5 relative ${
                uploadResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
              }`}
              data-testid="upload-result"
            >
              <button
                onClick={handleDismissError}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                data-testid="button-dismiss-result"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="flex items-start gap-3">
                {uploadResult.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`font-semibold ${uploadResult.success ? "text-green-900" : "text-red-900"}`}>
                    {uploadResult.success ? "Upload Successful" : "Upload Failed"}
                  </p>
                  <p className={`text-sm mt-1 ${uploadResult.success ? "text-green-700" : "text-red-700"}`}>
                    {uploadResult.message}
                  </p>
                  {uploadResult.imported > 0 && (
                    <p className="text-sm text-green-700 mt-1">
                      {uploadResult.imported} medication(s) imported
                    </p>
                  )}
                  {uploadResult.failed > 0 && (
                    <p className="text-sm text-red-700 mt-1">{uploadResult.failed} failed</p>
                  )}
                  {uploadResult.errors && uploadResult.errors.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {uploadResult.errors.map((error, index) => (
                        <p key={index} className="text-xs text-red-600 font-mono bg-red-100/50 px-2 py-1 rounded">
                          {error}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "format" && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 text-sm">CSV Column Reference</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Only <strong>name</strong> and <strong>retail_price_cents</strong> are required. All other fields are optional.
              </p>
            </div>
            <div className="divide-y divide-gray-100">
              {[
                { field: "name", desc: "Medication name", example: "LIPO-B 50mg/50mg/25mg/1mg/mL", required: true },
                { field: "retail_price_cents", desc: "Pharmacy price in dollars", example: "25.00", required: true },
                { field: "strength", desc: "Strength/concentration", example: "10mg/mL" },
                { field: "vial_size", desc: "Package size", example: "5mL, 10mL, 30 tablets" },
                { field: "form", desc: "Medication form", example: "Injection, Tablet, Capsule" },
                { field: "ndc", desc: "National Drug Code", example: "12345-678-90" },
                { field: "category", desc: "Product category (see list below)", example: "Weight Loss & Metabolism" },
                { field: "dosage_instructions", desc: "How to use the medication", example: "Inject 1 mL into the muscle two times a week" },
                { field: "detailed_description", desc: "Description & ingredients (see Ingredients tab)", example: "Active Ingredients (per 1 mL): ..." },
                { field: "in_stock", desc: "Availability", example: "true or false" },
                { field: "preparation_time_days", desc: "Days to prepare", example: "0 to 30" },
                { field: "aimrx_site_pricing_cents", desc: "AIMRx site price in dollars", example: "50.00" },
                { field: "notes", desc: "Internal notes", example: "Compounded to order" },
              ].map((item) => (
                <div key={item.field} className="flex items-center px-5 py-3 hover:bg-gray-50/50">
                  <div className="w-52 flex-shrink-0">
                    <code className={`text-xs font-mono px-2 py-0.5 rounded ${
                      item.required
                        ? "bg-blue-100 text-blue-700 font-semibold"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {item.field}
                      {item.required && " *"}
                    </code>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-700">{item.desc}</span>
                    <span className="text-xs text-gray-400 ml-2">e.g. {item.example}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Available Categories</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => copyToClipboard(cat.name, cat.name)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                  data-testid={`category-chip-${cat.id}`}
                >
                  {copiedField === cat.name ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3 text-gray-400" />
                  )}
                  {cat.name}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Click any category to copy it. You can also type a new category name in your CSV.
            </p>
          </div>
        </div>
      )}

      {activeTab === "ingredients" && (
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <FlaskConical className="h-5 w-5 text-emerald-600" />
              <h3 className="font-semibold text-emerald-900">How Ingredients Work</h3>
            </div>
            <p className="text-sm text-emerald-800 leading-relaxed">
              When you add ingredient information to a medication, providers see it displayed as a
              clean, organized ingredient card in their catalog. This helps providers quickly see
              what&apos;s in each compound.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">
              Format for the <code className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-xs">detailed_description</code> Column
            </h3>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-gray-100 leading-relaxed">
              <div className="text-emerald-400">Active Ingredients (per 1 mL):</div>
              <div className="text-gray-300">• Cyanocobalamin (Vitamin B12) — 1 mg/mL</div>
              <div className="text-gray-300">• Inositol — 50 mg/mL</div>
              <div className="text-gray-300">• Methionine — 25 mg/mL</div>
              <div className="text-gray-300">• Choline Chloride — 50 mg/mL</div>
              <div className="text-gray-500 mt-2">[blank line]</div>
              <div className="text-blue-300">A lipotropic injection blend for fat metabolism.</div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Rules</h3>
            <div className="space-y-3">
              {[
                {
                  title: "First line must start with \"Active Ingredients\"",
                  desc: "You can add details like \"(per 1 mL)\" or \"(per vial)\"",
                },
                {
                  title: "Each ingredient on its own line, starting with • or -",
                  desc: "Use — (em dash) or - (hyphen) to separate the name from the dosage",
                },
                {
                  title: "Add a blank line, then your general description",
                  desc: "This text appears below the ingredient card",
                },
                {
                  title: "In your CSV file, wrap the whole field in double quotes",
                  desc: "This preserves the line breaks when the file is read",
                },
              ].map((rule, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{rule.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{rule.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">CSV Example</h3>
            <p className="text-xs text-gray-500 mb-3">
              Here&apos;s exactly how a row with ingredients looks in the CSV file:
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-x-auto">
              <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap break-all">{`"LIPO-B 50mg/50mg/25mg/1mg/mL",,10mL,Injection,,25.00,Weight Loss & Metabolism,"Inject 1 mL into the muscle two times a week.","Active Ingredients (per 1 mL):
• Cyanocobalamin (Vitamin B12) — 1 mg/mL
• Inositol — 50 mg/mL
• Methionine — 25 mg/mL
• Choline Chloride — 50 mg/mL

A lipotropic injection blend for fat metabolism.",true,0,50.00,`}</pre>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">What Providers See</h3>
            <p className="text-xs text-gray-500 mb-3">
              When a provider clicks &quot;Details&quot; on a medication with ingredients, they see this:
            </p>
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                <div className="flex items-center gap-1.5 mb-2">
                  <FlaskConical className="h-3.5 w-3.5 text-emerald-600" />
                  <p className="text-xs font-semibold text-emerald-800">Active Ingredients (per 1 mL)</p>
                </div>
                <div className="space-y-1">
                  {[
                    { name: "Cyanocobalamin (Vitamin B12)", dosage: "1 mg/mL" },
                    { name: "Inositol", dosage: "50 mg/mL" },
                    { name: "Methionine", dosage: "25 mg/mL" },
                    { name: "Choline Chloride", dosage: "50 mg/mL" },
                  ].map((ing, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm bg-white/60 rounded-lg px-2.5 py-1.5">
                      <span className="text-emerald-900 font-medium">{ing.name}</span>
                      <span className="text-emerald-600 text-xs font-mono bg-emerald-100/80 px-1.5 py-0.5 rounded">
                        {ing.dosage}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 mt-2">
                <p className="text-sm text-gray-600">
                  A lipotropic injection blend designed to support fat metabolism, energy production, and liver function.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
