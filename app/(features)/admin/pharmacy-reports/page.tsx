"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Download, RefreshCw, Search } from "lucide-react";
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
  status: string;
}

interface Provider {
  provider: { id: string; name: string; email: string };
  orders: Order[];
  totalOrders: number;
  totalAmount: number;
}

interface PharmacyReport {
  pharmacy: { id: string; name: string };
  providers: Provider[];
  totalOrders: number;
  totalAmount: number;
}

export default function PharmacyReportsPage() {
  const [reports, setReports] = useState<PharmacyReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<string>("this-month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Calculate date range based on selection
  const getDateRange = () => {
    const now = new Date();
    let start = "";
    let end = now.toISOString();

    switch (dateRange) {
      case "today":
        start = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        break;
      case "this-week":
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        start = new Date(weekStart.setHours(0, 0, 0, 0)).toISOString();
        break;
      case "this-month":
        start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        break;
      case "last-month":
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        start = lastMonth.toISOString();
        end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();
        break;
      case "custom":
        start = startDate;
        end = endDate;
        break;
      default:
        start = "";
        end = "";
    }

    return { start, end };
  };

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const { start, end } = getDateRange();
      const params = new URLSearchParams();

      if (start) params.append("startDate", start);
      if (end) params.append("endDate", end);

      const response = await fetch(`/api/admin/pharmacy-reports?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setReports(data.report || []);
      } else {
        toast.error(data.error || "Failed to fetch reports");
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to fetch reports");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  // Filter reports based on search term
  const filteredReports = reports.filter((report) => {
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
    csvRows.push("Pharmacy,Provider,Provider Email,Patient,Medication,Quantity,Refills,Date,Price,Status");

    filteredReports.forEach((report) => {
      report.providers.forEach((providerData) => {
        providerData.orders.forEach((order) => {
          csvRows.push(
            [
              report.pharmacy.name,
              providerData.provider.name,
              providerData.provider.email,
              order.patient,
              order.medication,
              order.quantity,
              order.refills,
              new Date(order.date).toLocaleDateString(),
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pharmacy Order Reports</h1>
          <p className="text-muted-foreground mt-1">
            View and analyze prescription orders by pharmacy and provider
          </p>
        </div>
        <Button onClick={exportToCSV} disabled={isLoading || filteredReports.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search pharmacy, provider, medication..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Date Range */}
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {/* Custom Date Inputs */}
            {dateRange === "custom" && (
              <>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Start date"
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="End date"
                />
              </>
            )}

            {/* Refresh Button */}
            <Button onClick={fetchReports} disabled={isLoading} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
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
      ) : (
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
                    <p className="text-sm font-medium mt-2">
                      {providerData.totalOrders} orders • ${providerData.totalAmount.toFixed(2)}
                    </p>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Queue ID</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Medication</TableHead>
                        <TableHead>Qty/Ref</TableHead>
                        <TableHead>SIG</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {providerData.orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            {new Date(order.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {order.queue_id || "N/A"}
                          </TableCell>
                          <TableCell>{order.patient}</TableCell>
                          <TableCell>{order.medication}</TableCell>
                          <TableCell>
                            {order.quantity} / {order.refills}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {order.sig || "N/A"}
                          </TableCell>
                          <TableCell>${order.price.toFixed(2)}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${
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
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
