"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

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
  };
}

interface PharmacyAdmin {
  user_id: string;
  email: string;
  pharmacy_id: string;
  full_name: string | null;
  created_at: string;
  pharmacy: {
    name: string;
    slug: string;
  };
}

export default function PharmacyManagementPage() {
  const [activeTab, setActiveTab] = useState<"pharmacies" | "administrators" | "integrations">("pharmacies");

  // Data states
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [filteredPharmacies, setFilteredPharmacies] = useState<Pharmacy[]>([]);
  const [backends, setBackends] = useState<PharmacyBackend[]>([]);
  const [filteredBackends, setFilteredBackends] = useState<PharmacyBackend[]>([]);
  const [admins, setAdmins] = useState<PharmacyAdmin[]>([]);
  const [filteredAdmins, setFilteredAdmins] = useState<PharmacyAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  // Search and filter states
  const [pharmacySearchQuery, setPharmacySearchQuery] = useState("");
  const [pharmacyStatusFilter, setPharmacyStatusFilter] = useState("all");
  const [adminSearchQuery, setAdminSearchQuery] = useState("");
  const [adminPharmacyFilter, setAdminPharmacyFilter] = useState("all");
  const [integrationSearchQuery, setIntegrationSearchQuery] = useState("");

  // Pharmacy wizard states
  const [isPharmacyWizardOpen, setIsPharmacyWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [editingPharmacy, setEditingPharmacy] = useState<Pharmacy | null>(null);
  const [pharmacyForm, setPharmacyForm] = useState({
    name: "",
    slug: "",
    primary_color: "#00AEEF",
    tagline: "",
    phone: "",
    npi: "",
    address: "",
    system_type: "DigitalRx",
    store_id: "",
    api_url: "",
    api_key: "",
    location_id: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin modal states
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminForm, setAdminForm] = useState({
    email: "",
    password: "",
    full_name: "",
    pharmacy_id: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  // View details modal
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [viewingPharmacy, setViewingPharmacy] = useState<Pharmacy | null>(null);

  // API key visibility
  const [visibleApiKeys, setVisibleApiKeys] = useState<Record<string, boolean>>({});

  // Load all data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pharmaciesRes, backendsRes, adminsRes] = await Promise.all([
        fetch("/api/admin/pharmacies"),
        fetch("/api/admin/pharmacy-backends"),
        fetch("/api/admin/pharmacy-admins"),
      ]);

      const [pharmaciesData, backendsData, adminsData] = await Promise.all([
        pharmaciesRes.json(),
        backendsRes.json(),
        adminsRes.json(),
      ]);

      if (pharmaciesData.success) {
        setPharmacies(pharmaciesData.pharmacies || []);
        setFilteredPharmacies(pharmaciesData.pharmacies || []);
      }
      if (backendsData.success) {
        setBackends(backendsData.backends || []);
        setFilteredBackends(backendsData.backends || []);
      }
      if (adminsData.success) {
        setAdmins(adminsData.admins || []);
        setFilteredAdmins(adminsData.admins || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter pharmacies
  useEffect(() => {
    let filtered = pharmacies;

    if (pharmacySearchQuery) {
      filtered = filtered.filter(
        (pharmacy) =>
          pharmacy.name.toLowerCase().includes(pharmacySearchQuery.toLowerCase()) ||
          pharmacy.slug.toLowerCase().includes(pharmacySearchQuery.toLowerCase()) ||
          pharmacy.phone?.toLowerCase().includes(pharmacySearchQuery.toLowerCase())
      );
    }

    if (pharmacyStatusFilter === "active") {
      filtered = filtered.filter((p) => p.is_active);
    } else if (pharmacyStatusFilter === "inactive") {
      filtered = filtered.filter((p) => !p.is_active);
    }

    setFilteredPharmacies(filtered);
  }, [pharmacySearchQuery, pharmacyStatusFilter, pharmacies]);

  // Filter admins
  useEffect(() => {
    let filtered = admins;

    if (adminSearchQuery) {
      filtered = filtered.filter(
        (admin) =>
          admin.email.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
          admin.full_name?.toLowerCase().includes(adminSearchQuery.toLowerCase())
      );
    }

    if (adminPharmacyFilter !== "all") {
      filtered = filtered.filter((admin) => admin.pharmacy_id === adminPharmacyFilter);
    }

    setFilteredAdmins(filtered);
  }, [adminSearchQuery, adminPharmacyFilter, admins]);

  // Filter integrations
  useEffect(() => {
    let filtered = backends;

    if (integrationSearchQuery) {
      filtered = filtered.filter(
        (backend) =>
          backend.pharmacy.name.toLowerCase().includes(integrationSearchQuery.toLowerCase()) ||
          backend.system_type.toLowerCase().includes(integrationSearchQuery.toLowerCase()) ||
          backend.store_id.toLowerCase().includes(integrationSearchQuery.toLowerCase())
      );
    }

    setFilteredBackends(filtered);
  }, [integrationSearchQuery, backends]);

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (name: string) => {
    setPharmacyForm({
      ...pharmacyForm,
      name,
      slug: generateSlug(name),
    });
  };

  const openPharmacyWizard = () => {
    setEditingPharmacy(null);
    setPharmacyForm({
      name: "",
      slug: "",
      primary_color: "#00AEEF",
      tagline: "",
      phone: "",
      npi: "",
      address: "",
      system_type: "DigitalRx",
      store_id: "",
      api_url: "",
      api_key: "",
      location_id: "",
    });
    setWizardStep(1);
    setIsPharmacyWizardOpen(true);
  };

  const handleEditPharmacy = async (pharmacy: Pharmacy) => {
    // Load backend data for this pharmacy
    const backend = backends.find((b) => b.pharmacy_id === pharmacy.id);

    setEditingPharmacy(pharmacy);
    setPharmacyForm({
      name: pharmacy.name,
      slug: pharmacy.slug,
      primary_color: pharmacy.primary_color,
      tagline: pharmacy.tagline || "",
      phone: pharmacy.phone || "",
      npi: pharmacy.npi || "",
      address: pharmacy.address || "",
      system_type: backend?.system_type || "DigitalRx",
      store_id: backend?.store_id || "",
      api_url: backend?.api_url || "",
      api_key: "", // Don't pre-fill API key for security
      location_id: backend?.location_id || "",
    });
    setWizardStep(1);
    setIsPharmacyWizardOpen(true);
  };

  const handleViewDetails = (pharmacy: Pharmacy) => {
    setViewingPharmacy(pharmacy);
    setIsViewDetailsOpen(true);
  };

  const handleCreateOrUpdatePharmacy = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingPharmacy
        ? `/api/admin/pharmacies/${editingPharmacy.id}`
        : "/api/admin/pharmacies";

      const method = editingPharmacy ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pharmacyForm),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to save pharmacy");
      }

      toast.success(editingPharmacy ? "Pharmacy updated successfully" : "Pharmacy created successfully");
      setIsPharmacyWizardOpen(false);
      setWizardStep(1);
      await loadData();
    } catch (error) {
      console.error("Error saving pharmacy:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save pharmacy");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/pharmacy-admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adminForm),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create admin");
      }

      toast.success("Admin created successfully");
      setIsAdminModalOpen(false);
      setAdminForm({
        email: "",
        password: "",
        full_name: "",
        pharmacy_id: "",
      });
      await loadData();
    } catch (error) {
      console.error("Error creating admin:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create admin");
    } finally {
      setIsSubmitting(false);
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

  const getStatusCount = (status: string) => {
    if (status === "all") return pharmacies.length;
    if (status === "active") return pharmacies.filter((p) => p.is_active).length;
    if (status === "inactive") return pharmacies.filter((p) => !p.is_active).length;
    return 0;
  };

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Pharmacy Management
        </h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsAdminModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Admin
          </Button>
          <Button
            onClick={openPharmacyWizard}
            className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white"
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Pharmacy
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab("pharmacies")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "pharmacies"
              ? "text-[#1E3A8A] border-b-2 border-[#1E3A8A]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Pharmacies ({pharmacies.length})
        </button>
        <button
          onClick={() => setActiveTab("administrators")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "administrators"
              ? "text-[#1E3A8A] border-b-2 border-[#1E3A8A]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Administrators ({admins.length})
        </button>
        <button
          onClick={() => setActiveTab("integrations")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "integrations"
              ? "text-[#1E3A8A] border-b-2 border-[#1E3A8A]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          API Integrations ({backends.length})
        </button>
      </div>

      {/* Pharmacies Tab */}
      {activeTab === "pharmacies" && (
        <>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, slug, or phone..."
                value={pharmacySearchQuery}
                onChange={(e) => setPharmacySearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="w-64">
              <Select value={pharmacyStatusFilter} onValueChange={setPharmacyStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All ({getStatusCount("all")})</SelectItem>
                  <SelectItem value="active">Active ({getStatusCount("active")})</SelectItem>
                  <SelectItem value="inactive">Inactive ({getStatusCount("inactive")})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pharmacies Table */}
          <div className="bg-white border border-border rounded-lg overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading pharmacies...</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Pharmacy Name</TableHead>
                      <TableHead className="font-semibold">Slug</TableHead>
                      <TableHead className="font-semibold">Phone</TableHead>
                      <TableHead className="font-semibold">System</TableHead>
                      <TableHead className="font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPharmacies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No pharmacies found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPharmacies.map((pharmacy) => {
                        const backend = backends.find((b) => b.pharmacy_id === pharmacy.id);
                        return (
                          <TableRow key={pharmacy.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">{pharmacy.name}</TableCell>
                            <TableCell>
                              <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                                {pharmacy.slug}
                              </code>
                            </TableCell>
                            <TableCell className="text-sm">{pharmacy.phone || "—"}</TableCell>
                            <TableCell>
                              {backend ? (
                                <Badge variant="secondary">{backend.system_type}</Badge>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewDetails(pharmacy)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  View Details
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditPharmacy(pharmacy)}
                                  className="text-gray-600 hover:text-gray-700 hover:bg-gray-100"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Administrators Tab */}
      {activeTab === "administrators" && (
        <>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={adminSearchQuery}
                onChange={(e) => setAdminSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="w-64">
              <Select value={adminPharmacyFilter} onValueChange={setAdminPharmacyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by pharmacy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Pharmacies</SelectItem>
                  {pharmacies.map((pharmacy) => (
                    <SelectItem key={pharmacy.id} value={pharmacy.id}>
                      {pharmacy.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Admins Table */}
          <div className="bg-white border border-border rounded-lg overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading administrators...</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Email</TableHead>
                      <TableHead className="font-semibold">Full Name</TableHead>
                      <TableHead className="font-semibold">Pharmacy</TableHead>
                      <TableHead className="font-semibold">User ID</TableHead>
                      <TableHead className="font-semibold">Date Added</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAdmins.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No administrators found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAdmins.map((admin) => (
                        <TableRow key={admin.user_id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">{admin.email}</TableCell>
                          <TableCell>{admin.full_name || "—"}</TableCell>
                          <TableCell>{admin.pharmacy.name}</TableCell>
                          <TableCell className="text-xs text-gray-500 font-mono">
                            {admin.user_id.slice(0, 8)}...
                          </TableCell>
                          <TableCell>
                            {new Date(admin.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </>
      )}

      {/* API Integrations Tab */}
      {activeTab === "integrations" && (
        <>
          {/* Search */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by pharmacy, system, or store ID..."
                value={integrationSearchQuery}
                onChange={(e) => setIntegrationSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Integrations Table */}
          <div className="bg-white border border-border rounded-lg overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading integrations...</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Pharmacy</TableHead>
                      <TableHead className="font-semibold">System Type</TableHead>
                      <TableHead className="font-semibold">Store ID</TableHead>
                      <TableHead className="font-semibold">API URL</TableHead>
                      <TableHead className="font-semibold">API Key</TableHead>
                      <TableHead className="font-semibold">Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBackends.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No integrations found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBackends.map((backend) => (
                        <TableRow key={backend.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">{backend.pharmacy.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{backend.system_type}</Badge>
                          </TableCell>
                          <TableCell>
                            <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                              {backend.store_id}
                            </code>
                          </TableCell>
                          <TableCell className="text-sm text-blue-600">
                            {backend.api_url || "—"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                                {visibleApiKeys[backend.id]
                                  ? backend.api_key_encrypted
                                  : maskApiKey(backend.api_key_encrypted)}
                              </code>
                              <button
                                onClick={() => toggleApiKeyVisibility(backend.id)}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                {visibleApiKeys[backend.id] ? (
                                  <EyeOff className="h-4 w-4 text-gray-600" />
                                ) : (
                                  <Eye className="h-4 w-4 text-gray-600" />
                                )}
                              </button>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(backend.updated_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Pharmacy Wizard Modal */}
      <Dialog open={isPharmacyWizardOpen} onOpenChange={setIsPharmacyWizardOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingPharmacy ? "Edit Pharmacy" : "Add New Pharmacy"} - Step {wizardStep} of 2
            </DialogTitle>
            <DialogDescription>
              {wizardStep === 1
                ? "Enter basic pharmacy information"
                : "Configure backend system integration"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateOrUpdatePharmacy}>
            {wizardStep === 1 ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pharmacy-name">Pharmacy Name *</Label>
                  <Input
                    id="pharmacy-name"
                    value={pharmacyForm.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., Smith's Pharmacy"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pharmacy-slug">Slug *</Label>
                  <Input
                    id="pharmacy-slug"
                    value={pharmacyForm.slug}
                    onChange={(e) =>
                      setPharmacyForm({ ...pharmacyForm, slug: e.target.value.toLowerCase() })
                    }
                    placeholder="e.g., smiths-pharmacy"
                    required
                  />
                  <p className="text-xs text-gray-500">Auto-generated from name, can be edited</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pharmacy-color">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="pharmacy-color"
                      type="color"
                      value={pharmacyForm.primary_color}
                      onChange={(e) =>
                        setPharmacyForm({ ...pharmacyForm, primary_color: e.target.value })
                      }
                      className="w-20"
                    />
                    <Input
                      value={pharmacyForm.primary_color}
                      onChange={(e) =>
                        setPharmacyForm({ ...pharmacyForm, primary_color: e.target.value })
                      }
                      placeholder="#00AEEF"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pharmacy-tagline">Tagline</Label>
                  <Input
                    id="pharmacy-tagline"
                    value={pharmacyForm.tagline}
                    onChange={(e) =>
                      setPharmacyForm({ ...pharmacyForm, tagline: e.target.value })
                    }
                    placeholder="e.g., Your neighborhood pharmacy"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pharmacy-phone">Phone</Label>
                  <Input
                    id="pharmacy-phone"
                    value={pharmacyForm.phone}
                    onChange={(e) =>
                      setPharmacyForm({ ...pharmacyForm, phone: e.target.value })
                    }
                    placeholder="e.g., (555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pharmacy-npi">NPI Number</Label>
                  <Input
                    id="pharmacy-npi"
                    value={pharmacyForm.npi}
                    onChange={(e) => setPharmacyForm({ ...pharmacyForm, npi: e.target.value })}
                    placeholder="e.g., 1234567890"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pharmacy-address">Address</Label>
                  <Input
                    id="pharmacy-address"
                    value={pharmacyForm.address}
                    onChange={(e) =>
                      setPharmacyForm({ ...pharmacyForm, address: e.target.value })
                    }
                    placeholder="e.g., 123 Main St, City, ST 12345"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsPharmacyWizardOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="button" onClick={() => setWizardStep(2)}>
                    Next
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pharmacy-system">Pharmacy System *</Label>
                  <Select
                    value={pharmacyForm.system_type}
                    onValueChange={(value) =>
                      setPharmacyForm({ ...pharmacyForm, system_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DigitalRx">DigitalRx</SelectItem>
                      <SelectItem value="PioneerRx">PioneerRx</SelectItem>
                      <SelectItem value="QS1">QS1</SelectItem>
                      <SelectItem value="Liberty">Liberty</SelectItem>
                      <SelectItem value="BestRx">BestRx</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pharmacy-store-id">Store ID *</Label>
                  <Input
                    id="pharmacy-store-id"
                    value={pharmacyForm.store_id}
                    onChange={(e) =>
                      setPharmacyForm({ ...pharmacyForm, store_id: e.target.value })
                    }
                    placeholder="e.g., STORE123"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pharmacy-api-url">API URL</Label>
                  <Input
                    id="pharmacy-api-url"
                    value={pharmacyForm.api_url}
                    onChange={(e) =>
                      setPharmacyForm({ ...pharmacyForm, api_url: e.target.value })
                    }
                    placeholder="e.g., https://api.example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pharmacy-api-key">API Key *</Label>
                  <Input
                    id="pharmacy-api-key"
                    type="password"
                    value={pharmacyForm.api_key}
                    onChange={(e) =>
                      setPharmacyForm({ ...pharmacyForm, api_key: e.target.value })
                    }
                    placeholder="Enter API key"
                    required={!editingPharmacy}
                  />
                  <p className="text-xs text-gray-500">
                    {editingPharmacy
                      ? "Leave blank to keep existing key"
                      : "Will be encrypted when stored"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pharmacy-location-id">Location ID (Optional)</Label>
                  <Input
                    id="pharmacy-location-id"
                    value={pharmacyForm.location_id}
                    onChange={(e) =>
                      setPharmacyForm({ ...pharmacyForm, location_id: e.target.value })
                    }
                    placeholder="e.g., LOC001"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setWizardStep(1)}>
                    Back
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                      ? "Saving..."
                      : editingPharmacy
                      ? "Update Pharmacy"
                      : "Create Pharmacy"}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {/* Admin Creation Modal */}
      <Dialog open={isAdminModalOpen} onOpenChange={setIsAdminModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Pharmacy Administrator</DialogTitle>
            <DialogDescription>
              Create a new admin user for a pharmacy
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email *</Label>
              <Input
                id="admin-email"
                type="email"
                value={adminForm.email}
                onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                placeholder="admin@pharmacy.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password">Password *</Label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  placeholder="Enter password"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500">Minimum 8 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-full-name">Full Name</Label>
              <Input
                id="admin-full-name"
                value={adminForm.full_name}
                onChange={(e) => setAdminForm({ ...adminForm, full_name: e.target.value })}
                placeholder="John Smith"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-pharmacy">Pharmacy *</Label>
              <Select
                value={adminForm.pharmacy_id}
                onValueChange={(value) => setAdminForm({ ...adminForm, pharmacy_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a pharmacy..." />
                </SelectTrigger>
                <SelectContent>
                  {pharmacies.map((pharmacy) => (
                    <SelectItem key={pharmacy.id} value={pharmacy.id}>
                      {pharmacy.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAdminModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || pharmacies.length === 0}>
                {isSubmitting ? "Creating..." : "Create Admin"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Details Modal */}
      <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Pharmacy Details</DialogTitle>
          </DialogHeader>

          {viewingPharmacy && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Pharmacy Name</Label>
                  <p className="text-sm font-semibold mt-1">{viewingPharmacy.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Slug</Label>
                  <div className="text-sm mt-1">
                    <code className="px-2 py-1 bg-gray-100 rounded">
                      {viewingPharmacy.slug}
                    </code>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Phone</Label>
                <p className="text-sm mt-1">{viewingPharmacy.phone || "—"}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">NPI Number</Label>
                <p className="text-sm mt-1">{viewingPharmacy.npi || "—"}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Address</Label>
                <p className="text-sm mt-1">{viewingPharmacy.address || "—"}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Created</Label>
                <p className="text-sm mt-1">
                  {new Date(viewingPharmacy.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsViewDetailsOpen(false)}
                >
                  Close
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setIsViewDetailsOpen(false);
                    handleEditPharmacy(viewingPharmacy);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Pharmacy
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
