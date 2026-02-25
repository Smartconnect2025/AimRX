"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import { Download, RefreshCw, Search, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";

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

export default function PharmacyReportsPage() {
  const [reports, setReports] = useState<PharmacyReport[]>([]);
  const [pharmacies, setPharmacies] = useState<PharmacyOption[]>([]);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // View mode toggle
  const [viewMode, setViewMode] = useState<"by-provider" | "pharmacy-only">("by-provider");

  // Filters
  const [selectedPharmacy, setSelectedPharmacy] = useState<string>("all");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [selectedPlatformManager, setSelectedPlatformManager] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch pharmacies
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

  // Fetch providers
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

  // Fetch groups
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

  // Fetch reports
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

        // Filter by provider if selected
        if (selectedProvider !== "all") {
          filteredReports = filteredReports.map((report: PharmacyReport) => ({
            ...report,
            providers: report.providers.filter(
              (p) => p.provider.id === selectedProvider
            ),
          })).filter((report: PharmacyReport) => report.providers.length > 0);
        }

        setReports(filteredReports);
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

  // Determine which group IDs match the selected group/platform manager filters
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

  // Filter reports based on group filters and search term
  const filteredReports = reports
    .map((report) => {
      // Filter providers by group if a group/PM filter is active
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

      // Search in pharmacy name
      if (report.pharmacy.name.toLowerCase().includes(searchLower)) return true;

      // Search in provider names or medications
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

  // Calculate grand totals
  const grandTotal = filteredReports.reduce((sum, report) => sum + report.totalAmount, 0);
  const totalOrders = filteredReports.reduce((sum, report) => sum + report.totalOrders, 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reporting & Analytics  </h1>
          <p className="text-muted-foreground mt-1">
            View and analyze prescription orders by pharmacy and provider
          </p>
        </div>
        <Button onClick={exportToCSV} disabled={isLoading || filteredReports.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* View Mode Toggle */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Button
              variant={viewMode === "by-provider" ? "default" : "outline"}
              onClick={() => setViewMode("by-provider")}
            >
              By Provider
            </Button>
            <Button
              variant={viewMode === "pharmacy-only" ? "default" : "outline"}
              onClick={() => {
                setViewMode("pharmacy-only");
                setSelectedProvider("all");
                setSelectedGroup("all");
                setSelectedPlatformManager("all");
              }}
            >
              Pharmacy Only
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Pharmacy Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="pharmacy">Pharmacy</Label>
              <Select value={selectedPharmacy} onValueChange={setSelectedPharmacy}>
                <SelectTrigger id="pharmacy">
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

            {/* Provider Dropdown - Only show in "by-provider" mode */}
            {viewMode === "by-provider" && (
              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger id="provider">
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

            {/* Group Name Filter - Only show in "by-provider" mode */}
            {viewMode === "by-provider" && (
              <div className="space-y-2">
                <Label htmlFor="group">Group</Label>
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger id="group">
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

            {/* Platform Manager Filter - Only show in "by-provider" mode */}
            {viewMode === "by-provider" && (
              <div className="space-y-2">
                <Label htmlFor="platformManager">Platform Manager</Label>
                <Select value={selectedPlatformManager} onValueChange={setSelectedPlatformManager}>
                  <SelectTrigger id="platformManager">
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

            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Patient"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Refresh Button */}
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={fetchReports} disabled={isLoading} variant="outline" className="w-full">
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Summary Stats */}
          {!isLoading && filteredReports.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-medium">Total Orders</p>
                <p className="text-2xl font-bold text-blue-700">{totalOrders}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-600 font-medium">Total Revenue</p>
                <p className="text-2xl font-bold text-green-700">${grandTotal.toFixed(2)}</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-600 font-medium">Average Order Value</p>
                <p className="text-2xl font-bold text-purple-700">
                  ${totalOrders > 0 ? (grandTotal / totalOrders).toFixed(2) : "0.00"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reports */}
      {isLoading ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
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
        // Pharmacy-only view: Show all orders for each pharmacy without provider breakdown
        filteredReports.map((report) => {
          // Collect all orders from all providers for this pharmacy
          const allOrders = report.providers.flatMap((p) => p.orders);

          return (
            <Card key={report.pharmacy.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{report.pharmacy.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {report.totalOrders} orders • ${report.totalAmount.toFixed(2)} total
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Queue ID</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Medication</TableHead>
                        <TableHead>Qty/Ref</TableHead>
                        <TableHead>SIG</TableHead>
                        <TableHead>Medication Price</TableHead>
                        <TableHead>Provider Fees</TableHead>
                        <TableHead>Total Price</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="whitespace-nowrap">
                            {new Date(order.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {order.queue_id || "N/A"}
                          </TableCell>
                          <TableCell>{order.patient}</TableCell>
                          <TableCell>{order.medication}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {order.quantity} / {order.refills}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {order.sig || "N/A"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">${order.medicationPrice.toFixed(2)}</TableCell>
                          <TableCell className="whitespace-nowrap">${order.providerFees.toFixed(2)}</TableCell>
                          <TableCell className="whitespace-nowrap font-semibold">${order.price.toFixed(2)}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs whitespace-nowrap ${
                              order.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : order.status === "submitted"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                            }`}>
                              {order.status}
                            </span>
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
        // By-provider view: Show providers grouped under each pharmacy
        filteredReports.map((report) => (
          <Card key={report.pharmacy.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{report.pharmacy.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {report.totalOrders} orders • ${report.totalAmount.toFixed(2)} total
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {report.providers.map((providerData) => (
                <div key={providerData.provider.id} className="mb-8 last:mb-0">
                  <div className="bg-muted p-4 rounded-lg mb-4">
                    <h3 className="font-semibold text-lg">{providerData.provider.name}</h3>
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
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Queue ID</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Medication</TableHead>
                          <TableHead>Qty/Ref</TableHead>
                          <TableHead>SIG</TableHead>
                          <TableHead>Medication Price</TableHead>
                          <TableHead>Provider Fees</TableHead>
                          <TableHead>Total Price</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {providerData.orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="whitespace-nowrap">
                              {new Date(order.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {order.queue_id || "N/A"}
                            </TableCell>
                            <TableCell>{order.patient}</TableCell>
                            <TableCell>{order.medication}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              {order.quantity} / {order.refills}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {order.sig || "N/A"}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">${order.medicationPrice.toFixed(2)}</TableCell>
                            <TableCell className="whitespace-nowrap">${order.providerFees.toFixed(2)}</TableCell>
                            <TableCell className="whitespace-nowrap font-semibold">${order.price.toFixed(2)}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded text-xs whitespace-nowrap ${
                                order.status === "completed"
                                  ? "bg-green-100 text-green-700"
                                  : order.status === "submitted"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}>
                                {order.status}
                              </span>
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
  );
}
