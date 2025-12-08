"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, UserPlus, Users, CheckCircle2, AlertCircle } from "lucide-react";

interface Pharmacy {
  id: string;
  name: string;
  slug: string;
  primary_color: string;
  tagline: string | null;
  address: string | null;
  npi: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

interface PharmacyAdmin {
  user_id: string;
  email: string;
  pharmacy_id: string;
  pharmacy: {
    name: string;
    slug: string;
    primary_color: string;
  };
}

export default function PharmacyManagementPage() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [admins, setAdmins] = useState<PharmacyAdmin[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Pharmacy form state
  const [pharmacyForm, setPharmacyForm] = useState({
    name: "",
    slug: "",
    logo_url: "",
    primary_color: "#00AEEF",
    tagline: "",
    address: "",
    npi: "",
    phone: "",
  });
  const [isCreatingPharmacy, setIsCreatingPharmacy] = useState(false);
  const [pharmacyResult, setPharmacyResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);

  // Admin form state
  const [adminForm, setAdminForm] = useState({
    email: "",
    password: "",
    pharmacy_id: "",
    full_name: "",
  });
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [adminResult, setAdminResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoadingData(true);
    try {
      // Load pharmacies
      const pharmaciesRes = await fetch("/api/admin/pharmacies");
      const pharmaciesData = await pharmaciesRes.json();
      if (pharmaciesData.success) {
        setPharmacies(pharmaciesData.pharmacies || []);
      }

      // Load admins
      const adminsRes = await fetch("/api/admin/pharmacy-admins");
      const adminsData = await adminsRes.json();
      if (adminsData.success) {
        setAdmins(adminsData.admins || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleCreatePharmacy = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingPharmacy(true);
    setPharmacyResult(null);

    try {
      const response = await fetch("/api/admin/pharmacies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pharmacyForm),
      });

      const data = await response.json();
      setPharmacyResult(data);

      if (data.success) {
        // Reset form
        setPharmacyForm({
          name: "",
          slug: "",
          logo_url: "",
          primary_color: "#00AEEF",
          tagline: "",
          address: "",
          npi: "",
          phone: "",
        });
        // Reload data
        loadData();
      }
    } catch {
      setPharmacyResult({ error: "Failed to create pharmacy" });
    } finally {
      setIsCreatingPharmacy(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingAdmin(true);
    setAdminResult(null);

    try {
      const response = await fetch("/api/admin/pharmacy-admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adminForm),
      });

      const data = await response.json();
      setAdminResult(data);

      if (data.success) {
        // Reset form
        setAdminForm({
          email: "",
          password: "",
          pharmacy_id: "",
          full_name: "",
        });
        // Reload data
        loadData();
      }
    } catch {
      setAdminResult({ error: "Failed to create admin" });
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Pharmacy Management</h1>
        <p className="text-gray-600">Create and manage pharmacies and pharmacy administrators</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* CREATE PHARMACY */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Create Pharmacy</h2>
              <p className="text-sm text-gray-600">Add a new pharmacy to the platform</p>
            </div>
          </div>

          <form onSubmit={handleCreatePharmacy} className="space-y-4">
            <div>
              <Label htmlFor="pharmacy-name">
                Pharmacy Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="pharmacy-name"
                placeholder="e.g., AIM Medical Technologies"
                value={pharmacyForm.name}
                onChange={(e) => setPharmacyForm({ ...pharmacyForm, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="pharmacy-slug">
                Slug (URL-friendly) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="pharmacy-slug"
                placeholder="e.g., aim"
                value={pharmacyForm.slug}
                onChange={(e) => setPharmacyForm({ ...pharmacyForm, slug: e.target.value.toLowerCase() })}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Used in URLs and email matching</p>
            </div>

            <div>
              <Label htmlFor="pharmacy-color">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="pharmacy-color"
                  type="color"
                  value={pharmacyForm.primary_color}
                  onChange={(e) => setPharmacyForm({ ...pharmacyForm, primary_color: e.target.value })}
                  className="w-20"
                />
                <Input
                  value={pharmacyForm.primary_color}
                  onChange={(e) => setPharmacyForm({ ...pharmacyForm, primary_color: e.target.value })}
                  placeholder="#00AEEF"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="pharmacy-tagline">Tagline</Label>
              <Input
                id="pharmacy-tagline"
                placeholder="e.g., Advanced Peptide Therapy"
                value={pharmacyForm.tagline}
                onChange={(e) => setPharmacyForm({ ...pharmacyForm, tagline: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="pharmacy-phone">Phone</Label>
              <Input
                id="pharmacy-phone"
                placeholder="e.g., (555) 123-4567"
                value={pharmacyForm.phone}
                onChange={(e) => setPharmacyForm({ ...pharmacyForm, phone: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="pharmacy-npi">NPI Number</Label>
              <Input
                id="pharmacy-npi"
                placeholder="e.g., 1234567890"
                value={pharmacyForm.npi}
                onChange={(e) => setPharmacyForm({ ...pharmacyForm, npi: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="pharmacy-address">Address</Label>
              <Input
                id="pharmacy-address"
                placeholder="e.g., 123 Main St, City, ST 12345"
                value={pharmacyForm.address}
                onChange={(e) => setPharmacyForm({ ...pharmacyForm, address: e.target.value })}
              />
            </div>

            <Button type="submit" disabled={isCreatingPharmacy} className="w-full">
              {isCreatingPharmacy ? "Creating..." : "Create Pharmacy"}
            </Button>

            {pharmacyResult && (
              <div className={`p-4 rounded-md flex items-start gap-2 ${pharmacyResult.success ? "bg-green-50 text-green-900" : "bg-red-50 text-red-900"}`}>
                {pharmacyResult.success ? (
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                )}
                <div className="text-sm">
                  {pharmacyResult.message || pharmacyResult.error}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* CREATE PHARMACY ADMIN */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-green-100 p-3 rounded-lg">
              <UserPlus className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Create Pharmacy Admin</h2>
              <p className="text-sm text-gray-600">Add an admin user for a pharmacy</p>
            </div>
          </div>

          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div>
              <Label htmlFor="admin-email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="e.g., admin@aimmedtech.com"
                value={adminForm.email}
                onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="admin-password">
                Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="Minimum 6 characters"
                value={adminForm.password}
                onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                required
                minLength={6}
              />
            </div>

            <div>
              <Label htmlFor="admin-full-name">Full Name</Label>
              <Input
                id="admin-full-name"
                placeholder="e.g., John Smith"
                value={adminForm.full_name}
                onChange={(e) => setAdminForm({ ...adminForm, full_name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="admin-pharmacy">
                Pharmacy <span className="text-red-500">*</span>
              </Label>
              <select
                id="admin-pharmacy"
                value={adminForm.pharmacy_id}
                onChange={(e) => setAdminForm({ ...adminForm, pharmacy_id: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                required
              >
                <option value="">Select a pharmacy...</option>
                {pharmacies.map((pharmacy) => (
                  <option key={pharmacy.id} value={pharmacy.id}>
                    {pharmacy.name} ({pharmacy.slug})
                  </option>
                ))}
              </select>
            </div>

            <Button type="submit" disabled={isCreatingAdmin || pharmacies.length === 0} className="w-full">
              {isCreatingAdmin ? "Creating..." : "Create Admin User"}
            </Button>

            {pharmacies.length === 0 && !isLoadingData && (
              <p className="text-sm text-amber-600 text-center">
                Please create a pharmacy first before adding admins
              </p>
            )}

            {adminResult && (
              <div className={`p-4 rounded-md flex items-start gap-2 ${adminResult.success ? "bg-green-50 text-green-900" : "bg-red-50 text-red-900"}`}>
                {adminResult.success ? (
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                )}
                <div className="text-sm">
                  {adminResult.message || adminResult.error}
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* EXISTING PHARMACIES */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-purple-100 p-3 rounded-lg">
            <Building2 className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Existing Pharmacies</h2>
            <p className="text-sm text-gray-600">{pharmacies.length} pharmacies in the system</p>
          </div>
        </div>

        {isLoadingData ? (
          <p className="text-gray-500">Loading pharmacies...</p>
        ) : pharmacies.length === 0 ? (
          <p className="text-gray-500">No pharmacies yet. Create one above!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pharmacies.map((pharmacy) => (
              <div
                key={pharmacy.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                style={{ borderLeftWidth: "4px", borderLeftColor: pharmacy.primary_color }}
              >
                <h3 className="font-bold text-lg mb-1">{pharmacy.name}</h3>
                <p className="text-sm text-gray-600 mb-2">Slug: {pharmacy.slug}</p>
                {pharmacy.tagline && (
                  <p className="text-sm text-gray-500 italic mb-2">&quot;{pharmacy.tagline}&quot;</p>
                )}
                {pharmacy.phone && (
                  <p className="text-xs text-gray-500">📞 {pharmacy.phone}</p>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: pharmacy.primary_color }}
                  />
                  <span className="text-xs text-gray-500">{pharmacy.primary_color}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EXISTING ADMINS */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-orange-100 p-3 rounded-lg">
            <Users className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Pharmacy Administrators</h2>
            <p className="text-sm text-gray-600">{admins.length} admins in the system</p>
          </div>
        </div>

        {isLoadingData ? (
          <p className="text-gray-500">Loading admins...</p>
        ) : admins.length === 0 ? (
          <p className="text-gray-500">No admins yet. Create one above!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Email</th>
                  <th className="text-left py-3 px-4 font-semibold">Pharmacy</th>
                  <th className="text-left py-3 px-4 font-semibold">User ID</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.user_id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{admin.email}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: admin.pharmacy.primary_color }}
                        />
                        <span>{admin.pharmacy.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500 font-mono">{admin.user_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
