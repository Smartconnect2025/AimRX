"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  RefreshCw,
  Search,
  Calendar as CalendarIcon,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Users,
  Pill,
  BarChart3,
  TableIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";

const AnalyticsCharts = dynamic(() => import("./AnalyticsCharts"), { ssr: false });

interface Order {
  id: string;
  queue_id: string;
  date: string;
  patient: string;
  medication: string;
  quantity: number;
  refills: number;
  sig: string;
  price: number;
  medicationPrice: number;
  providerFees: number;
  status: string;
}

interface Provider {
  provider: { id: string; name: string; email: string; group_id: string | null };
  orders: Order[];
  totalOrders: number;
  totalAmount: number;
  totalMedicationAmount: number;
  totalProviderFees: number;
}

interface PharmacyReport {
  pharmacy: { id: string; name: string };
  providers: Provider[];
  totalOrders: number;
  totalAmount: number;
}

interface PharmacyOption {
  id: string;
  name: string;
}

interface ProviderOption {
  id: string;
  name: string;
  email: string;
}

interface GroupOption {
  id: string;
  name: string;
  platform_manager_id: string | null;
  platform_manager_name: string | null;
}

function AnimatedNumber({ value, prefix = "", decimals = 0, duration = 800 }: { value: number; prefix?: string; decimals?: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const start = prevRef.current;
    const diff = value - start;
    if (diff === 0) return;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + diff * eased;
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(animate);
      else prevRef.current = value;
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  return <>{prefix}{decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString()}</>;
}

const STATUS_CONFIG: Record<string, { dot: string; bg: string; text: string }> = {
  submitted: { dot: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-700" },
  billing: { dot: "bg-violet-500", bg: "bg-violet-50", text: "text-violet-700" },
  approved: { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" },
  packed: { dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700" },
  shipped: { dot: "bg-indigo-500", bg: "bg-indigo-50", text: "text-indigo-700" },
  delivered: { dot: "bg-green-600", bg: "bg-green-50", text: "text-green-700" },
  completed: { dot: "bg-green-600", bg: "bg-green-50", text: "text-green-700" },
  cancelled: { dot: "bg-red-500", bg: "bg-red-50", text: "text-red-700" },
};

function StatusBadge({ status }: { status: string }) {
  const safeStatus = status || "unknown";
  const config = STATUS_CONFIG[safeStatus] || { dot: "bg-gray-400", bg: "bg-gray-50", text: "text-gray-700" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`} data-testid={`status-badge-${safeStatus}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1)}
    </span>
  );
}

export default function PharmacyReportsPage() {
  const [reports, setReports] = useState<PharmacyReport[]>([]);
  const [pharmacies, setPharmacies] = useState<PharmacyOption[]>([]);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [activeTab, setActiveTab] = useState<"overview" | "details">("overview");
  const [viewMode, setViewMode] = useState<"by-provider" | "pharmacy-only">("by-provider");
  const [filtersOpen, setFiltersOpen] = useState(true);

  const [selectedPharmacy, setSelectedPharmacy] = useState<string>("all");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [selectedPlatformManager, setSelectedPlatformManager] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchPharmacies = async () => {
    try {
      const response = await fetch("/api/admin/pharmacies");
      const data = await response.json();
      if (response.ok) {
        setPharmacies(data.pharmacies || []);
      }
    } catch (error) {
      console.error("Error fetching pharmacies:", error);
    }
  };

  const fetchProviders = async () => {
    try {
      const response = await fetch("/api/admin/providers");
      const data = await response.json();
      if (response.ok) {
        const providerList = data.providers?.map((provider: {
          id: string;
          first_name: string;
          last_name: string;
          email: string;
        }) => ({
          id: provider.id,
          name: `${provider.first_name} ${provider.last_name}`,
          email: provider.email,
        })) || [];
        setProviders(providerList);
      } else {
        console.error("Failed to fetch providers:", data);
        toast.error("Failed to load providers");
      }
    } catch (error) {
      console.error("Error fetching providers:", error);
      toast.error("Failed to load providers");
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/admin/groups");
      const data = await response.json();
      if (response.ok) {
        setGroups(data.groups || []);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();

      if (startDate) params.append("startDate", new Date(startDate).toISOString());
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        params.append("endDate", endDateTime.toISOString());
      }
      if (selectedPharmacy !== "all") params.append("pharmacyId", selectedPharmacy);

      const response = await fetch(`/api/admin/pharmacy-reports?${params.toString()}`);

      const data = await response.json();

      if (response.ok) {
        let filteredReports = data.report || [];

        if (selectedProvider !== "all") {
          filteredReports = filteredReports.map((report: PharmacyReport) => ({
            ...report,
            providers: report.providers.filter(
              (p) => p.provider.id === selectedProvider
            ),
          })).filter((report: PharmacyReport) => report.providers.length > 0);
        }

        setReports(filteredReports);
        setLastUpdated(new Date());
        if (filteredReports.length === 0) {
          toast.info("No orders found for the selected filters");
        }
      } else {
        console.error("API error:", data.error);
        toast.error(data.error || "Failed to fetch reports");
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error(`Failed to fetch reports: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPharmacy, selectedProvider, startDate, endDate]);

  useEffect(() => {
    fetchPharmacies();
    fetchProviders();
    fetchGroups();
  }, []);

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPharmacy, selectedProvider, startDate, endDate]);

  const matchingGroupIds = new Set<string>();
  if (selectedGroup !== "all" || selectedPlatformManager !== "all") {
    groups.forEach((group) => {
      const matchesGroup = selectedGroup === "all" || group.id === selectedGroup;
      const matchesPM = selectedPlatformManager === "all" || group.platform_manager_id === selectedPlatformManager;
      if (matchesGroup && matchesPM) {
        matchingGroupIds.add(group.id);
      }
    });
  }

  const filteredReports = reports
    .map((report) => {
      if (selectedGroup !== "all" || selectedPlatformManager !== "all") {
        const filteredProviders = report.providers.filter(
          (p) => p.provider.group_id && matchingGroupIds.has(p.provider.group_id)
        );
        return { ...report, providers: filteredProviders };
      }
      return report;
    })
    .filter((report) => report.providers.length > 0)
    .filter((report) => {
      if (!searchTerm) return true;

      const searchLower = searchTerm.toLowerCase();

      if (report.pharmacy.name.toLowerCase().includes(searchLower)) return true;

      return report.providers.some(
        (providerData) =>
          providerData.provider.name.toLowerCase().includes(searchLower) ||
          providerData.provider.email.toLowerCase().includes(searchLower) ||
          providerData.orders.some(
            (order) =>
              order.medication.toLowerCase().includes(searchLower) ||
              order.patient.toLowerCase().includes(searchLower)
          )
      );
    });

  const exportToCSV = () => {
    const csvRows: string[] = [];
    csvRows.push("Pharmacy,Provider,Provider Email,Group,Platform Manager,Patient,Medication,Quantity,Refills,Date,Medication Price,Provider Fees,Total Price,Status");

    filteredReports.forEach((report) => {
      report.providers.forEach((providerData) => {
        const group = groups.find(g => g.id === providerData.provider.group_id);
        providerData.orders.forEach((order) => {
          csvRows.push(
            [
              report.pharmacy.name,
              providerData.provider.name,
              providerData.provider.email,
              `"${group?.name || ""}"`,
              `"${group?.platform_manager_name || ""}"`,
              order.patient,
              order.medication,
              order.quantity,
              order.refills,
              new Date(order.date).toLocaleDateString(),
              `$${order.medicationPrice.toFixed(2)}`,
              `$${order.providerFees.toFixed(2)}`,
              `$${order.price.toFixed(2)}`,
              order.status,
            ].join(",")
          );
        });
      });
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pharmacy-reports-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Report exported successfully");
  };

  const grandTotal = filteredReports.reduce((sum, report) => sum + report.totalAmount, 0);
  const totalOrders = filteredReports.reduce((sum, report) => sum + report.totalOrders, 0);
  const uniqueProviderIds = new Set<string>();
  const medicationCounts: Record<string, number> = {};
  filteredReports.forEach((report) => {
    report.providers.forEach((p) => {
      uniqueProviderIds.add(p.provider.id);
      p.orders.forEach((order) => {
        const medName = order.medication.split(" - ")[0].split(" (")[0].trim();
        medicationCounts[medName] = (medicationCounts[medName] || 0) + 1;
      });
    });
  });
  const activeProviderCount = uniqueProviderIds.size;
  const topMedication = Object.entries(medicationCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="pharmacy-reports-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1E3A8A]" data-testid="text-page-title">Reporting & Analytics</h1>
          <p className="text-muted-foreground mt-1">
            View and analyze prescription orders by pharmacy and provider
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground hidden md:inline" data-testid="text-last-updated">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button onClick={fetchReports} disabled={isLoading} variant="outline" data-testid="button-refresh-header">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={exportToCSV} disabled={isLoading || filteredReports.length === 0} className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90" data-testid="button-export-csv">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {!isLoading && filteredReports.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4" data-testid="kpi-cards">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-blue-50/50" data-testid="card-kpi-orders">
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="h-5 w-5 text-[#1E3A8A]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold text-[#1E3A8A]">
                    <AnimatedNumber value={totalOrders} />
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-blue-50/50" data-testid="card-kpi-revenue">
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-5 w-5 text-[#1E3A8A]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-[#1E3A8A]">
                    <AnimatedNumber value={grandTotal} prefix="$" decimals={2} />
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-blue-50/50" data-testid="card-kpi-avg">
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-[#1E3A8A]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Avg Order Value</p>
                  <p className="text-2xl font-bold text-[#1E3A8A]">
                    <AnimatedNumber value={totalOrders > 0 ? grandTotal / totalOrders : 0} prefix="$" decimals={2} />
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-blue-50/50" data-testid="card-kpi-providers">
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 text-[#1E3A8A]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Active Providers</p>
                  <p className="text-2xl font-bold text-[#1E3A8A]">
                    <AnimatedNumber value={activeProviderCount} />
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-blue-50/50 col-span-2 md:col-span-1" data-testid="card-kpi-top-med">
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Pill className="h-5 w-5 text-[#1E3A8A]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">Top Medication</p>
                  <p className="text-sm font-bold text-[#1E3A8A] truncate" title={topMedication?.[0]}>
                    {topMedication ? topMedication[0] : "—"}
                  </p>
                  {topMedication && (
                    <p className="text-xs text-muted-foreground">{topMedication[1]} orders</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="flex bg-muted rounded-lg p-1 gap-1" data-testid="tabs-overview-details">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === "overview"
                  ? "bg-white text-[#1E3A8A] shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="button-tab-overview"
            >
              <BarChart3 className="h-4 w-4" />
              Overview
            </button>
          <button
            onClick={() => setActiveTab("details")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "details"
                ? "bg-white text-[#1E3A8A] shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid="button-tab-details"
          >
            <TableIcon className="h-4 w-4" />
            Details
          </button>
          </div>

          <div className="flex bg-muted rounded-lg p-1 gap-1" data-testid="toggle-view-mode">
            <button
              onClick={() => setViewMode("by-provider")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === "by-provider"
                  ? "bg-white text-[#1E3A8A] shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="button-view-by-provider"
            >
              By Provider
            </button>
            <button
              onClick={() => {
                setViewMode("pharmacy-only");
                setSelectedProvider("all");
                setSelectedGroup("all");
                setSelectedPlatformManager("all");
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === "pharmacy-only"
                  ? "bg-white text-[#1E3A8A] shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="button-view-pharmacy-only"
            >
              Pharmacy Only
            </button>
          </div>
        </div>

        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          data-testid="button-toggle-filters"
        >
          {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          Filters
        </button>
      </div>

      {filtersOpen && (
        <Card className="border shadow-sm" data-testid="card-filters">
          <CardContent className="pt-5 pb-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="pharmacy" className="text-xs font-medium">Pharmacy</Label>
                <Select value={selectedPharmacy} onValueChange={setSelectedPharmacy}>
                  <SelectTrigger id="pharmacy" data-testid="select-pharmacy">
                    <SelectValue placeholder="Select pharmacy" />
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

              {viewMode === "by-provider" && (
                <div className="space-y-1.5">
                  <Label htmlFor="provider" className="text-xs font-medium">Provider</Label>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger id="provider" data-testid="select-provider">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Providers</SelectItem>
                      {providers.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name} ({provider.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {viewMode === "by-provider" && (
                <div className="space-y-1.5">
                  <Label htmlFor="group" className="text-xs font-medium">Group</Label>
                  <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                    <SelectTrigger id="group" data-testid="select-group">
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Groups</SelectItem>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {viewMode === "by-provider" && (
                <div className="space-y-1.5">
                  <Label htmlFor="platformManager" className="text-xs font-medium">Platform Manager</Label>
                  <Select value={selectedPlatformManager} onValueChange={setSelectedPlatformManager}>
                    <SelectTrigger id="platformManager" data-testid="select-platform-manager">
                      <SelectValue placeholder="Select platform manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Platform Managers</SelectItem>
                      {groups
                        .filter((g) => g.platform_manager_id && g.platform_manager_name)
                        .reduce((unique, g) => {
                          if (!unique.some((u) => u.platform_manager_id === g.platform_manager_id)) {
                            unique.push(g);
                          }
                          return unique;
                        }, [] as GroupOption[])
                        .map((g) => (
                          <SelectItem key={g.platform_manager_id!} value={g.platform_manager_id!}>
                            {g.platform_manager_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="search" className="text-xs font-medium">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Patient, medication..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="startDate" className="text-xs font-medium">Start Date</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="pl-10"
                    data-testid="input-start-date"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="endDate" className="text-xs font-medium">End Date</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="pl-10"
                    data-testid="input-end-date"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">&nbsp;</Label>
                <Button
                  onClick={() => {
                    setSelectedPharmacy("all");
                    setSelectedProvider("all");
                    setSelectedGroup("all");
                    setSelectedPlatformManager("all");
                    setStartDate("");
                    setEndDate("");
                    setSearchTerm("");
                  }}
                  variant="outline"
                  className="w-full"
                  data-testid="button-clear-filters"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "overview" && (
        <div data-testid="tab-overview-content">
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className={i === 0 ? "md:col-span-2" : ""}>
                  <CardContent className="p-8">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-[250px] bg-gray-100 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <AnalyticsCharts reports={filteredReports} />
          )}
        </div>
      )}

      {activeTab === "details" && (
        <div className="space-y-6" data-testid="tab-details-content">
          {isLoading ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-[#1E3A8A]" />
                Loading reports...
              </CardContent>
            </Card>
          ) : filteredReports.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                No orders found for the selected filters
              </CardContent>
            </Card>
          ) : viewMode === "pharmacy-only" ? (
            filteredReports.map((report) => {
              const allOrders = report.providers.flatMap((p) => p.orders);

              return (
                <Card key={report.pharmacy.id} className="shadow-sm" data-testid={`card-pharmacy-${report.pharmacy.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl text-[#1E3A8A]">{report.pharmacy.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {report.totalOrders} orders &bull; ${report.totalAmount.toFixed(2)} total
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50/80">
                            <TableHead className="text-xs font-semibold">Date</TableHead>
                            <TableHead className="text-xs font-semibold">Queue ID</TableHead>
                            <TableHead className="text-xs font-semibold">Patient</TableHead>
                            <TableHead className="text-xs font-semibold">Medication</TableHead>
                            <TableHead className="text-xs font-semibold">Qty/Ref</TableHead>
                            <TableHead className="text-xs font-semibold">SIG</TableHead>
                            <TableHead className="text-xs font-semibold">Med Price</TableHead>
                            <TableHead className="text-xs font-semibold">Provider Fees</TableHead>
                            <TableHead className="text-xs font-semibold">Total</TableHead>
                            <TableHead className="text-xs font-semibold">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allOrders.map((order, idx) => (
                            <TableRow key={order.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"} data-testid={`row-order-${order.id}`}>
                              <TableCell className="whitespace-nowrap text-sm">
                                {new Date(order.date).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="font-mono text-xs text-muted-foreground">
                                {order.queue_id || "N/A"}
                              </TableCell>
                              <TableCell className="text-sm">{order.patient}</TableCell>
                              <TableCell className="text-sm">{order.medication}</TableCell>
                              <TableCell className="whitespace-nowrap text-sm">
                                {order.quantity} / {order.refills}
                              </TableCell>
                              <TableCell className="max-w-xs truncate text-sm">
                                {order.sig || "N/A"}
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-sm">${order.medicationPrice.toFixed(2)}</TableCell>
                              <TableCell className="whitespace-nowrap text-sm">${order.providerFees.toFixed(2)}</TableCell>
                              <TableCell className="whitespace-nowrap text-sm font-semibold">${order.price.toFixed(2)}</TableCell>
                              <TableCell>
                                <StatusBadge status={order.status} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            filteredReports.map((report) => (
              <Card key={report.pharmacy.id} className="shadow-sm" data-testid={`card-pharmacy-${report.pharmacy.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl text-[#1E3A8A]">{report.pharmacy.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {report.totalOrders} orders &bull; ${report.totalAmount.toFixed(2)} total
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {report.providers.map((providerData) => (
                    <div key={providerData.provider.id} className="mb-8 last:mb-0" data-testid={`section-provider-${providerData.provider.id}`}>
                      <div className="bg-gradient-to-r from-blue-50/80 to-white border border-blue-100 p-4 rounded-lg mb-4">
                        <h3 className="font-semibold text-base text-[#1E3A8A]">{providerData.provider.name}</h3>
                        <p className="text-sm text-muted-foreground">{providerData.provider.email}</p>
                        <div className="flex flex-wrap gap-4 mt-2">
                          <p className="text-sm font-medium">
                            {providerData.totalOrders} orders
                          </p>
                          <p className="text-sm font-medium">
                            Medication: ${providerData.totalMedicationAmount.toFixed(2)}
                          </p>
                          <p className="text-sm font-medium">
                            Provider Fees: ${providerData.totalProviderFees.toFixed(2)}
                          </p>
                          <p className="text-sm font-medium">
                            Total: ${providerData.totalAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50/80">
                              <TableHead className="text-xs font-semibold">Date</TableHead>
                              <TableHead className="text-xs font-semibold">Queue ID</TableHead>
                              <TableHead className="text-xs font-semibold">Patient</TableHead>
                              <TableHead className="text-xs font-semibold">Medication</TableHead>
                              <TableHead className="text-xs font-semibold">Qty/Ref</TableHead>
                              <TableHead className="text-xs font-semibold">SIG</TableHead>
                              <TableHead className="text-xs font-semibold">Med Price</TableHead>
                              <TableHead className="text-xs font-semibold">Provider Fees</TableHead>
                              <TableHead className="text-xs font-semibold">Total</TableHead>
                              <TableHead className="text-xs font-semibold">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {providerData.orders.map((order, idx) => (
                              <TableRow key={order.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"} data-testid={`row-order-${order.id}`}>
                                <TableCell className="whitespace-nowrap text-sm">
                                  {new Date(order.date).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="font-mono text-xs text-muted-foreground">
                                  {order.queue_id || "N/A"}
                                </TableCell>
                                <TableCell className="text-sm">{order.patient}</TableCell>
                                <TableCell className="text-sm">{order.medication}</TableCell>
                                <TableCell className="whitespace-nowrap text-sm">
                                  {order.quantity} / {order.refills}
                                </TableCell>
                                <TableCell className="max-w-xs truncate text-sm">
                                  {order.sig || "N/A"}
                                </TableCell>
                                <TableCell className="whitespace-nowrap text-sm">${order.medicationPrice.toFixed(2)}</TableCell>
                                <TableCell className="whitespace-nowrap text-sm">${order.providerFees.toFixed(2)}</TableCell>
                                <TableCell className="whitespace-nowrap text-sm font-semibold">${order.price.toFixed(2)}</TableCell>
                                <TableCell>
                                  <StatusBadge status={order.status} />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
