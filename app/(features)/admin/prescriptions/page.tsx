"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Search, FlaskConical, ArrowRight, CheckCircle } from "lucide-react";
import { createClient } from "@core/supabase";
import { toast } from "sonner";

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTestingMode, setIsTestingMode] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState<string | null>(null);

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
        patient:patients(first_name, last_name)
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

  // Check real status from DigitalRX API
  const checkDigitalRxStatus = useCallback(async () => {
    if (prescriptions.length === 0) return;

    console.log("🔄 Checking DigitalRX status for all prescriptions...");

    try {
      const response = await fetch("/api/prescriptions/status-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prescription_ids: prescriptions.map((p) => p.id),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const successCount = data.statuses.filter((s: { success: boolean }) => s.success).length;
          toast.success(`Status updated for ${successCount} prescriptions`);
          await loadPrescriptions();
        }
      }
    } catch (error) {
      console.error("Error checking DigitalRX status:", error);
      toast.error("Failed to check prescription status");
    }
  }, [prescriptions, loadPrescriptions]);

  // Test mode: Advance single prescription
  const advancePrescriptionStatus = async (prescriptionId: string) => {
    setIsAdvancing(prescriptionId);

    try {
      const response = await fetch("/api/admin/test-prescription-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prescription_id: prescriptionId,
          action: "advance",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success(
            `Status updated: ${data.data.old_status} → ${data.data.new_status}`
          );
          await loadPrescriptions();
        }
      } else {
        toast.error("Failed to advance status");
      }
    } catch (error) {
      console.error("Error advancing status:", error);
      toast.error("Failed to advance status");
    } finally {
      setIsAdvancing(null);
    }
  };

  // Check real status from DigitalRx for single prescription
  const checkSinglePrescriptionStatus = async (prescriptionId: string) => {
    setCheckingStatus(prescriptionId);

    try {
      const response = await fetch(`/api/prescriptions/${prescriptionId}/check-status`, {
        method: "POST",
      });

      const result = await response.json();

      if (result.success) {
        if (result.changed) {
          toast.success("Status updated!", {
            description: `${result.old_status} → ${result.new_status}`,
            duration: 4000,
          });
        } else {
          toast.info("Status unchanged", {
            description: `Still ${result.new_status}`,
            duration: 3000,
          });
        }
        await loadPrescriptions();
      } else {
        toast.error("Failed to check status", {
          description: result.error,
        });
      }
    } catch (error) {
      console.error("Error checking status:", error);
      toast.error("Error checking prescription status");
    } finally {
      setCheckingStatus(null);
    }
  };

  // Test mode: Advance multiple random prescriptions
  const advanceRandomPrescriptions = async () => {
    setIsRefreshing(true);

    try {
      const response = await fetch("/api/admin/test-prescription-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 2 }), // Advance 2 random prescriptions
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success(`Advanced ${data.data.updated_count} prescriptions`);
          await loadPrescriptions();
        }
      } else {
        toast.error("Failed to advance prescriptions");
      }
    } catch (error) {
      console.error("Error advancing prescriptions:", error);
      toast.error("Failed to advance prescriptions");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (isTestingMode) {
      // Test mode: simulate status progression
      await advanceRandomPrescriptions();
    } else {
      // Production mode: check real DigitalRX status
      await checkDigitalRxStatus();
    }
    setTimeout(() => setIsRefreshing(false), 500);
  };

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
            <p className="text-sm text-muted-foreground mt-1">
              {isTestingMode ? "Testing Mode: Manual Status Control" : "Live DigitalRX Status Tracking"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={isTestingMode ? "default" : "outline"}
              onClick={() => setIsTestingMode(!isTestingMode)}
              size="sm"
            >
              <FlaskConical className="mr-2 h-4 w-4" />
              {isTestingMode ? "Exit Testing" : "Testing Mode"}
            </Button>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {isTestingMode ? "Advance Random" : "Check Status"}
            </Button>
          </div>
        </div>
      </div>

      {/* Testing Mode Alert */}
      {isTestingMode && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <FlaskConical className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-900">Testing Mode Active</p>
              <p className="text-sm text-yellow-700 mt-1">
                Click the arrow button next to any prescription to manually advance its status.
                Click &quot;Advance Random&quot; to progress 2 random prescriptions.
              </p>
            </div>
          </div>
        </div>
      )}

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

      {/* Status Summary Badges */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_OPTIONS.filter((s) => s !== "All").map((status) => {
          const count = getStatusCount(status);
          if (count === 0) return null;
          return (
            <Badge
              key={status}
              variant="outline"
              className={`${getStatusColor(status)} cursor-pointer hover:opacity-80`}
              onClick={() => setStatusFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}: {count}
            </Badge>
          );
        })}
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
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Provider</TableHead>
                <TableHead className="font-semibold">Patient</TableHead>
                <TableHead className="font-semibold">Medication</TableHead>
                <TableHead className="font-semibold">Qty/Refills</TableHead>
                <TableHead className="font-semibold">SIG</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Actions</TableHead>
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
                    <TableCell className="whitespace-nowrap">
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
                    <TableCell>
                      <div className="flex flex-col">
                        <span>Qty: {prescription.quantity}</span>
                        <span className="text-sm text-muted-foreground">
                          Refills: {prescription.refills}
                        </span>
                      </div>
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
                      <div className="flex flex-col gap-1">
                        <Badge
                          variant="outline"
                          className={getStatusColor(prescription.status)}
                        >
                          {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                        </Badge>
                        {prescription.queueId && (
                          <span className="text-xs text-muted-foreground">
                            Queue ID: {prescription.queueId}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {prescription.status !== "delivered" && (
                          <>
                            {!isTestingMode && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => checkSinglePrescriptionStatus(prescription.id)}
                                disabled={checkingStatus === prescription.id}
                                title="Check real status from DigitalRx"
                              >
                                {checkingStatus === prescription.id ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            {isTestingMode && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => advancePrescriptionStatus(prescription.id)}
                                disabled={isAdvancing === prescription.id}
                                title="Test: Advance to next status"
                              >
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
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
