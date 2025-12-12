"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, UserPlus, Users, CheckCircle2, AlertCircle, RefreshCw, Eye, EyeOff, Key } from "lucide-react";

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

interface PharmacyBackend {
  id: string;
  pharmacy_id: string;
  system_type: string;
  api_url: string | null;
  api_key_encrypted: string;
  store_id: string;
  location_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  pharmacy: {
    id: string;
    name: string;
    slug: string;
    primary_color: string;
  };
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
  const [backends, setBackends] = useState<PharmacyBackend[]>([]);
  const [admins, setAdmins] = useState<PharmacyAdmin[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [visibleApiKeys, setVisibleApiKeys] = useState<Record<string, boolean>>({});
  const [refreshingKeys, setRefreshingKeys] = useState<Record<string, boolean>>({});

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
    // Backend system integration
    system_type: "DigitalRx",
    api_url: "",
    api_key: "",
    store_id: "",
    location_id: "",
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

      // Load pharmacy backends
      const backendsRes = await fetch("/api/admin/pharmacy-backends");
      const backendsData = await backendsRes.json();
      if (backendsData.success) {
        setBackends(backendsData.backends || []);
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

  const handleRefreshApiKey = async (pharmacyId: string, pharmacyName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to refresh the API key for ${pharmacyName}?\n\nThis will generate a new API key and invalidate the old one. You'll need to update the key in your pharmacy system.`
    );

    if (!confirmed) return;

    setRefreshingKeys({ ...refreshingKeys, [pharmacyId]: true });

    try {
      const response = await fetch(`/api/admin/pharmacies/${pharmacyId}/refresh-api-key`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ API Key Refreshed Successfully!\n\nNew API Key: ${data.apiKey}\n\n⚠️ IMPORTANT: Copy this key now and update it in your ${pharmacyName} pharmacy system. This is the only time you'll see the full key.`);
        // Reload backends to show updated timestamp
        loadData();
      } else {
        alert(`❌ Failed to refresh API key: ${data.error}`);
      }
    } catch (error) {
      console.error("Error refreshing API key:", error);
      alert("❌ Failed to refresh API key. Please try again.");
    } finally {
      setRefreshingKeys({ ...refreshingKeys, [pharmacyId]: false });
    }
  };

  const toggleApiKeyVisibility = (backendId: string) => {
    setVisibleApiKeys({
      ...visibleApiKeys,
      [backendId]: !visibleApiKeys[backendId],
    });
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return "••••••••";
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
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
          system_type: "DigitalRx",
          api_url: "",
          api_key: "",
          store_id: "",
          location_id: "",
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* CREATE PHARMACY */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-lg shadow-md">
              <Building2 className="h-6 w-6 text-white" />
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

            {/* Backend System Integration */}
            <div className="border-t pt-4 mt-2">
              <h3 className="font-semibold mb-3 text-sm">🔌 Backend System Integration</h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="pharmacy-system">
                    Pharmacy System <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="pharmacy-system"
                    value={pharmacyForm.system_type}
                    onChange={(e) => setPharmacyForm({ ...pharmacyForm, system_type: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                    required
                  >
                    <option value="DigitalRx">DigitalRx</option>
                    <option value="PioneerRx">PioneerRx</option>
                    <option value="QS1">QS1</option>
                    <option value="Liberty">Liberty</option>
                    <option value="BestRx">BestRx</option>
                    <option value="Custom">Custom</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Select the pharmacy management system</p>
                </div>

                <div>
                  <Label htmlFor="pharmacy-store-id">
                    Store ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="pharmacy-store-id"
                    placeholder="e.g., STORE123"
                    value={pharmacyForm.store_id}
                    onChange={(e) => setPharmacyForm({ ...pharmacyForm, store_id: e.target.value })}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Your unique store identifier in the system</p>
                </div>

                <div>
                  <Label htmlFor="pharmacy-api-url">API URL</Label>
                  <Input
                    id="pharmacy-api-url"
                    placeholder="e.g., https://api.digitalrx.com"
                    value={pharmacyForm.api_url}
                    onChange={(e) => setPharmacyForm({ ...pharmacyForm, api_url: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="pharmacy-api-key">
                    API Key <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="pharmacy-api-key"
                    type="password"
                    placeholder="Enter API key (encrypted in database)"
                    value={pharmacyForm.api_key}
                    onChange={(e) => setPharmacyForm({ ...pharmacyForm, api_key: e.target.value })}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">🔒 Will be encrypted when stored</p>
                </div>

                <div>
                  <Label htmlFor="pharmacy-location-id">Location ID</Label>
                  <Input
                    id="pharmacy-location-id"
                    placeholder="e.g., LOC001 (if applicable)"
                    value={pharmacyForm.location_id}
                    onChange={(e) => setPharmacyForm({ ...pharmacyForm, location_id: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional: for multi-location pharmacies</p>
                </div>
              </div>
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
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-lg shadow-md">
              <UserPlus className="h-6 w-6 text-white" />
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
                    {pharmacy.name}
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
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-lg shadow-md">
            <Building2 className="h-6 w-6 text-white" />
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

      {/* API KEYS & BACKEND SYSTEMS */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-3 rounded-lg shadow-md">
            <Key className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">API Keys & Backend Systems</h2>
            <p className="text-sm text-gray-600">{backends.length} pharmacy backend integrations</p>
          </div>
        </div>

        {isLoadingData ? (
          <p className="text-gray-500">Loading backends...</p>
        ) : backends.length === 0 ? (
          <p className="text-gray-500">No backend integrations yet. Create a pharmacy above!</p>
        ) : (
          <div className="space-y-4">
            {backends.map((backend) => (
              <div
                key={backend.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                style={{ borderLeftWidth: "4px", borderLeftColor: backend.pharmacy.primary_color }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg">{backend.pharmacy.name}</h3>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                        {backend.system_type}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600 font-medium">Store ID:</span>{" "}
                        <span className="font-mono">{backend.store_id}</span>
                      </div>
                      {backend.location_id && (
                        <div>
                          <span className="text-gray-600 font-medium">Location ID:</span>{" "}
                          <span className="font-mono">{backend.location_id}</span>
                        </div>
                      )}
                      {backend.api_url && (
                        <div className="md:col-span-2">
                          <span className="text-gray-600 font-medium">API URL:</span>{" "}
                          <span className="text-blue-600">{backend.api_url}</span>
                        </div>
                      )}
                      <div className="md:col-span-2">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 font-medium">API Key:</span>
                          <code className="px-2 py-1 bg-gray-100 rounded font-mono text-xs">
                            {visibleApiKeys[backend.id]
                              ? backend.api_key_encrypted
                              : maskApiKey(backend.api_key_encrypted)}
                          </code>
                          <button
                            onClick={() => toggleApiKeyVisibility(backend.id)}
                            className="p-1 hover:bg-gray-100 rounded"
                            title={visibleApiKeys[backend.id] ? "Hide API key" : "Show API key"}
                          >
                            {visibleApiKeys[backend.id] ? (
                              <EyeOff className="h-4 w-4 text-gray-600" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-600" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="md:col-span-2 text-xs text-gray-500">
                        Last updated: {new Date(backend.updated_at).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="ml-4">
                    <Button
                      onClick={() => handleRefreshApiKey(backend.pharmacy_id, backend.pharmacy.name)}
                      disabled={refreshingKeys[backend.pharmacy_id]}
                      size="sm"
                      variant="outline"
                      className="gap-2"
                    >
                      <RefreshCw className={`h-4 w-4 ${refreshingKeys[backend.pharmacy_id] ? "animate-spin" : ""}`} />
                      {refreshingKeys[backend.pharmacy_id] ? "Refreshing..." : "Refresh Key"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EXISTING ADMINS */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-lg shadow-md">
            <Users className="h-6 w-6 text-white" />
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
