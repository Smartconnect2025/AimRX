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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Search } from "lucide-react";
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

interface Doctor {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  status: string;
}

const STATUS_OPTIONS = [
  "All",
  "Submitted",
  "Billing",
  "Approved",
  "Packed",
  "Shipped",
  "Delivered",
];

// Status progression order
const STATUS_ORDER = ["Submitted", "Billing", "Approved", "Packed", "Shipped", "Delivered"];

// Generate fake tracking number
const generateTrackingNumber = () => {
  const prefix = "1Z";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let tracking = prefix;
  for (let i = 0; i < 16; i++) {
    tracking += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return tracking;
};

// Move status forward
const advanceStatus = (currentStatus: string): { status: string; trackingNumber?: string } => {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  if (currentIndex === -1 || currentIndex === STATUS_ORDER.length - 1) {
    return { status: currentStatus };
  }

  const newStatus = STATUS_ORDER[currentIndex + 1];
  const result: { status: string; trackingNumber?: string } = { status: newStatus };

  // Add tracking number when shipped
  if (newStatus === "Shipped") {
    result.trackingNumber = generateTrackingNumber();
  }

  return result;
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "submitted":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "billing":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "approved":
      return "bg-green-100 text-green-800 border-green-200";
    case "packed":
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
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [secondsSinceRefresh, setSecondsSinceRefresh] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("queue");

  // Load doctors from Supabase
  const loadDoctors = useCallback(async () => {
    const { data: providersData, error } = await supabase
      .from("providers")
      .select(`
        id,
        user_id,
        first_name,
        last_name,
        created_at,
        users!inner(email)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading doctors:", error);
      return;
    }

    if (providersData) {
      const formattedDoctors = providersData.map((provider: {
        id: string;
        user_id: string;
        first_name: string;
        last_name: string;
        created_at: string;
        users: { email: string } | { email: string }[];
      }) => ({
        id: provider.id,
        user_id: provider.user_id,
        first_name: provider.first_name,
        last_name: provider.last_name,
        email: Array.isArray(provider.users) ? provider.users[0]?.email : provider.users?.email,
        created_at: provider.created_at,
        status: "Active",
      }));
      setDoctors(formattedDoctors);
    }
  }, [supabase]);

  // Reset doctor password
  const handleResetPassword = async (doctorId: string, email: string) => {
    try {
      // Send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      toast.success(`Password reset email sent to ${email}`);
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error("Failed to send password reset email");
    }
  };

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
        status: rx.status || "Submitted",
        trackingNumber: rx.tracking_number,
      };
    });

    setPrescriptions(formatted);
  }, [supabase]);

  // Load prescriptions, doctors and set up real-time subscription
  useEffect(() => {
    loadPrescriptions();
    loadDoctors();

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
  }, [loadPrescriptions, loadDoctors, supabase]);

  // Auto-refresh: Update 1-2 random prescriptions every 30 seconds
  const simulateStatusUpdates = useCallback(async () => {
    // Find prescriptions that can be advanced (not already Delivered)
    const advanceablePrescriptions = prescriptions.filter(
      (p) => p.status !== "Delivered"
    );

    if (advanceablePrescriptions.length === 0) return;

    // Randomly select 1-2 prescriptions to advance
    const numToUpdate = Math.min(
      Math.floor(Math.random() * 2) + 1,
      advanceablePrescriptions.length
    );

    const shuffled = [...advanceablePrescriptions].sort(() => Math.random() - 0.5);
    const toUpdate = shuffled.slice(0, numToUpdate);

    // Update each prescription in Supabase
    for (const prescription of toUpdate) {
      const { status, trackingNumber } = advanceStatus(prescription.status);

      const updateData: {
        status: string;
        tracking_number?: string;
      } = { status };

      if (trackingNumber) {
        updateData.tracking_number = trackingNumber;
      }

      await supabase
        .from("prescriptions")
        .update(updateData)
        .eq("id", prescription.id);
    }

    setSecondsSinceRefresh(0);
  }, [prescriptions, supabase]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPrescriptions();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Timer: Update "X seconds ago" every second
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsSinceRefresh((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      simulateStatusUpdates();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [simulateStatusUpdates]);

  // Filter prescriptions
  const filteredPrescriptions = prescriptions.filter((prescription) => {
    const matchesSearch =
      prescription.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prescription.providerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prescription.medication.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prescription.queueId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || prescription.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatTimeSinceRefresh = (seconds: number) => {
    if (seconds < 5) return "just now";
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  };

  const getStatusCount = (status: string) => {
    if (status === "All") return prescriptions.length;
    return prescriptions.filter((p) => p.status === status).length;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="doctors">Manage Doctors</TabsTrigger>
          <TabsTrigger value="queue">Incoming Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="queue">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Incoming Prescriptions
                </h1>
                <p className="text-muted-foreground mt-2">
                  Pharmacy admin queue - All providers
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>

            {/* Last Updated */}
            <p className="text-sm text-muted-foreground">
              Last updated {formatTimeSinceRefresh(secondsSinceRefresh)}
            </p>
          </div>

        {/* Filters */}
        <div className="bg-white border border-border rounded-lg p-4 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by patient, provider, medication, or Queue ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status} ({getStatusCount(status)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status Summary Badges */}
          <div className="flex flex-wrap gap-2">
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
                  {status}: {count}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {filteredPrescriptions.length} of {prescriptions.length}{" "}
            prescriptions
          </p>
        </div>

        {/* Prescriptions Table */}
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">
                    Submitted Date/Time
                  </TableHead>
                  <TableHead className="font-semibold">Provider Name</TableHead>
                  <TableHead className="font-semibold">Patient Name</TableHead>
                  <TableHead className="font-semibold">
                    Medication + Strength/Dosage
                  </TableHead>
                  <TableHead className="font-semibold">
                    Quantity / Refills
                  </TableHead>
                  <TableHead className="font-semibold">SIG</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Queue ID</TableHead>
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
                    <TableRow
                      key={prescription.id}
                      className="hover:bg-gray-50"
                    >
                      <TableCell className="whitespace-nowrap">
                        {formatDateTime(prescription.submittedAt)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {prescription.providerName}
                      </TableCell>
                      <TableCell className="font-medium">
                        {prescription.patientName}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {prescription.medication}
                          </span>
                          <span className="text-sm text-muted-foreground">
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
                      <TableCell className="max-w-xs">
                        <p className="text-sm truncate" title={prescription.sig}>
                          {prescription.sig}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant="outline"
                            className={getStatusColor(prescription.status)}
                          >
                            {prescription.status}
                          </Badge>
                          {prescription.trackingNumber && (
                            <span className="text-xs text-muted-foreground">
                              Tracking: {prescription.trackingNumber}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                          {prescription.queueId}
                        </code>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        </TabsContent>

        <TabsContent value="doctors">
          {/* Manage Doctors Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Manage Doctors
                </h1>
                <p className="text-muted-foreground mt-2">
                  View and manage provider accounts
                </p>
              </div>
            </div>
          </div>

          {/* Doctors Table */}
          <div className="bg-white border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Doctor Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No doctors found
                    </TableCell>
                  </TableRow>
                ) : (
                  doctors.map((doctor) => (
                    <TableRow key={doctor.id}>
                      <TableCell className="font-medium">
                        Dr. {doctor.first_name} {doctor.last_name}
                      </TableCell>
                      <TableCell>{doctor.email}</TableCell>
                      <TableCell>
                        {new Date(doctor.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-green-100 text-green-800 border-green-200"
                        >
                          {doctor.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetPassword(doctor.id, doctor.email)}
                        >
                          Reset Password
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
