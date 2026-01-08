"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { createClient } from "@core/supabase";

interface AdminPrescription {
  id: string;
  queueId: string;
  submittedAt: string;
  providerName: string;
  patientName: string;
  medication: string;
  strength: string;
  quantity: number;
  refills: number;
  sig: string;
  status: string;
  trackingNumber?: string;
  pharmacyName?: string;
  pharmacyColor?: string;
}

const STATUS_OPTIONS = [
  "All",
  "submitted",
  "billing",
  "approved",
  "processing",
  "shipped",
  "delivered",
];

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "submitted":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "billing":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "approved":
      return "bg-green-100 text-green-800 border-green-200";
    case "processing":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "shipped":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "delivered":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const formatDateTime = (dateTime: string) => {
  const date = new Date(dateTime);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export default function AdminPrescriptionsPage() {
  const supabase = createClient();
  const [prescriptions, setPrescriptions] = useState<AdminPrescription[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Load ALL prescriptions from Supabase (no provider filter for admin)
  const loadPrescriptions = useCallback(async () => {
    // First, get all prescriptions with patient data
    const { data: prescriptionsData, error: prescriptionsError } = await supabase
      .from("prescriptions")
      .select(`
        id,
        queue_id,
        submitted_at,
        medication,
        dosage,
        quantity,
        refills,
        sig,
        status,
        tracking_number,
        prescriber_id,
        pharmacy_id,
        patient:patients(first_name, last_name),
        pharmacy:pharmacies(name, primary_color)
      `)
      .order("submitted_at", { ascending: false });

    if (prescriptionsError) {
      console.error("Error loading prescriptions:", prescriptionsError);
      return;
    }

    if (!prescriptionsData) {
      return;
    }

    // Get all unique prescriber IDs
    const prescriberIds = [
      ...new Set(prescriptionsData.map((rx) => rx.prescriber_id)),
    ];

    // Fetch provider info for all prescribers
    const { data: providersData } = await supabase
      .from("providers")
      .select("user_id, first_name, last_name")
      .in("user_id", prescriberIds);

    // Create a map of user_id to provider info
    const providerMap = new Map(
      providersData?.map((p) => [p.user_id, p]) || []
    );

    // Format the data
    const formatted = prescriptionsData.map((rx) => {
      const patient = Array.isArray(rx.patient) ? rx.patient[0] : rx.patient;
      const provider = providerMap.get(rx.prescriber_id);
      const pharmacy = Array.isArray(rx.pharmacy) ? rx.pharmacy[0] : rx.pharmacy;

      return {
        id: rx.id,
        queueId: rx.queue_id || "N/A",
        submittedAt: rx.submitted_at,
        providerName: provider
          ? `Dr. ${provider.first_name} ${provider.last_name}`
          : "Unknown Provider",
        patientName: patient
          ? `${patient.first_name} ${patient.last_name}`
          : "Unknown Patient",
        medication: rx.medication,
        strength: rx.dosage,
        quantity: rx.quantity,
        refills: rx.refills,
        sig: rx.sig,
        status: rx.status || "submitted",
        trackingNumber: rx.tracking_number,
        pharmacyName: pharmacy?.name,
        pharmacyColor: pharmacy?.primary_color,
      };
    });

    setPrescriptions(formatted);
  }, [supabase]);

  // Load prescriptions and set up real-time subscription
  useEffect(() => {
    loadPrescriptions();

    // Set up real-time subscription for prescription changes
    const channel = supabase
      .channel("admin-prescriptions-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "prescriptions",
        },
        () => {
          loadPrescriptions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadPrescriptions, supabase]);


  // Filter prescriptions
  const filteredPrescriptions = prescriptions.filter((prescription) => {
    const matchesSearch =
      prescription.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prescription.providerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prescription.medication.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prescription.queueId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || prescription.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const getStatusCount = (status: string) => {
    if (status === "All") return prescriptions.length;
    return prescriptions.filter((p) => p.status.toLowerCase() === status.toLowerCase()).length;
  };

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Incoming Prescriptions
            </h1>
          </div>
        </div>
      </div>


      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by patient, provider, medication, or Queue ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <div className="w-64 flex-shrink-0">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === "All" ? status : status.charAt(0).toUpperCase() + status.slice(1)} ({getStatusCount(status)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          Showing {filteredPrescriptions.length} of {prescriptions.length} prescriptions
        </p>
      </div>

      {/* Prescriptions Table */}
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold w-[140px]">Date</TableHead>
                <TableHead className="font-semibold">Provider</TableHead>
                <TableHead className="font-semibold">Patient</TableHead>
                <TableHead className="font-semibold">Medication</TableHead>
                <TableHead className="font-semibold w-[100px]">Qty/Refills</TableHead>
                <TableHead className="font-semibold">Pharmacy</TableHead>
                <TableHead className="font-semibold">SIG</TableHead>
                <TableHead className="font-semibold w-[120px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrescriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <p className="text-muted-foreground">
                      No prescriptions found matching your filters
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPrescriptions.map((prescription) => (
                  <TableRow key={prescription.id} className="hover:bg-gray-50">
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDateTime(prescription.submittedAt)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {prescription.providerName}
                    </TableCell>
                    <TableCell className="font-medium">
                      {prescription.patientName}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="flex flex-col">
                        <span
                          className="font-medium truncate"
                          title={prescription.medication}
                        >
                          {prescription.medication}
                        </span>
                        <span className="text-sm text-muted-foreground truncate">
                          {prescription.strength}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex flex-col">
                        <span>Qty: {prescription.quantity}</span>
                        <span className="text-muted-foreground">
                          Ref: {prescription.refills}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {prescription.pharmacyName ? (
                        <span className="font-medium text-sm" style={{ color: prescription.pharmacyColor || "#1E3A8A" }}>
                          {prescription.pharmacyName}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">Not specified</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[180px]">
                      <p
                        className="text-sm truncate cursor-help"
                        title={prescription.sig}
                      >
                        {prescription.sig}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${getStatusColor(prescription.status)} text-xs px-2 py-1`}
                      >
                        {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
