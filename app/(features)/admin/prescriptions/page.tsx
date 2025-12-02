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
import { RefreshCw, Search } from "lucide-react";

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

// Demo data - 15 realistic prescriptions from different providers with varied statuses
const DEMO_ADMIN_PRESCRIPTIONS: AdminPrescription[] = [
  {
    id: "1",
    queueId: "RX7F3A2B",
    submittedAt: "2024-12-01T14:30:00",
    providerName: "Dr. Emily Rodriguez",
    patientName: "Sarah Johnson",
    medication: "Lisinopril",
    strength: "10mg",
    quantity: 30,
    refills: 3,
    sig: "Take 1 tablet by mouth once daily in the morning",
    status: "Submitted",
  },
  {
    id: "2",
    queueId: "RX9K2C1D",
    submittedAt: "2024-12-01T13:15:00",
    providerName: "Dr. Michael Chang",
    patientName: "Michael Chen",
    medication: "Metformin",
    strength: "500mg",
    quantity: 60,
    refills: 2,
    sig: "Take 1 tablet by mouth twice daily with meals",
    status: "Submitted",
  },
  {
    id: "3",
    queueId: "RX4H8E5F",
    submittedAt: "2024-12-01T11:45:00",
    providerName: "Dr. Sarah Patel",
    patientName: "Emma Williams",
    medication: "Amoxicillin",
    strength: "500mg",
    quantity: 21,
    refills: 0,
    sig: "Take 1 capsule by mouth three times daily for 7 days",
    status: "Billing",
  },
  {
    id: "4",
    queueId: "RX1B6G9H",
    submittedAt: "2024-12-01T10:20:00",
    providerName: "Dr. James Wilson",
    patientName: "David Martinez",
    medication: "Omeprazole",
    strength: "20mg",
    quantity: 30,
    refills: 5,
    sig: "Take 1 capsule by mouth once daily 30 minutes before breakfast",
    status: "Billing",
  },
  {
    id: "5",
    queueId: "RX8P5Q2R",
    submittedAt: "2024-12-01T09:35:00",
    providerName: "Dr. Emily Rodriguez",
    patientName: "Lisa Anderson",
    medication: "Atorvastatin",
    strength: "20mg",
    quantity: 90,
    refills: 3,
    sig: "Take 1 tablet by mouth once daily at bedtime",
    status: "Approved",
  },
  {
    id: "6",
    queueId: "RX3M7N4S",
    submittedAt: "2024-11-30T16:50:00",
    providerName: "Dr. Michael Chang",
    patientName: "Jennifer Taylor",
    medication: "Levothyroxine",
    strength: "50mcg",
    quantity: 30,
    refills: 11,
    sig: "Take 1 tablet by mouth once daily on an empty stomach, 30 minutes before breakfast",
    status: "Approved",
  },
  {
    id: "7",
    queueId: "RX6T8U1V",
    submittedAt: "2024-11-30T15:25:00",
    providerName: "Dr. Sarah Patel",
    patientName: "Robert Brown",
    medication: "Gabapentin",
    strength: "300mg",
    quantity: 90,
    refills: 2,
    sig: "Take 1 capsule by mouth three times daily",
    status: "Approved",
  },
  {
    id: "8",
    queueId: "RX2W9X4Y",
    submittedAt: "2024-11-30T14:15:00",
    providerName: "Dr. James Wilson",
    patientName: "Patricia Davis",
    medication: "Sertraline",
    strength: "50mg",
    quantity: 30,
    refills: 5,
    sig: "Take 1 tablet by mouth once daily in the morning",
    status: "Packed",
  },
  {
    id: "9",
    queueId: "RX5Z3A7B",
    submittedAt: "2024-11-30T13:05:00",
    providerName: "Dr. Emily Rodriguez",
    patientName: "Christopher Lee",
    medication: "Losartan",
    strength: "50mg",
    quantity: 30,
    refills: 3,
    sig: "Take 1 tablet by mouth once daily",
    status: "Packed",
  },
  {
    id: "10",
    queueId: "RX1C4D8E",
    submittedAt: "2024-11-30T11:40:00",
    providerName: "Dr. Michael Chang",
    patientName: "Amanda White",
    medication: "Amlodipine",
    strength: "5mg",
    quantity: 30,
    refills: 3,
    sig: "Take 1 tablet by mouth once daily",
    status: "Shipped",
    trackingNumber: "1Z9A8B7C6D5E4F3G",
  },
  {
    id: "11",
    queueId: "RX7K9L2M",
    submittedAt: "2024-11-29T16:30:00",
    providerName: "Dr. Sarah Patel",
    patientName: "Thomas Garcia",
    medication: "Hydrochlorothiazide",
    strength: "25mg",
    quantity: 30,
    refills: 6,
    sig: "Take 1 tablet by mouth once daily in the morning",
    status: "Shipped",
    trackingNumber: "1Z2H4J6K8L0M1N3P",
  },
  {
    id: "12",
    queueId: "RX4N6P8Q",
    submittedAt: "2024-11-29T14:20:00",
    providerName: "Dr. James Wilson",
    patientName: "Maria Rodriguez",
    medication: "Albuterol",
    strength: "90mcg",
    quantity: 1,
    refills: 3,
    sig: "Inhale 2 puffs every 4-6 hours as needed for wheezing",
    status: "Delivered",
    trackingNumber: "1Z5R7S9T1U3V5W7X",
  },
  {
    id: "13",
    queueId: "RX9R1S3T",
    submittedAt: "2024-11-29T10:15:00",
    providerName: "Dr. Emily Rodriguez",
    patientName: "James Wilson",
    medication: "Pantoprazole",
    strength: "40mg",
    quantity: 30,
    refills: 2,
    sig: "Take 1 tablet by mouth once daily 30 minutes before breakfast",
    status: "Delivered",
    trackingNumber: "1Z8Y0Z2A4B6C8D0E",
  },
  {
    id: "14",
    queueId: "RX2U4V6W",
    submittedAt: "2024-11-28T15:45:00",
    providerName: "Dr. Michael Chang",
    patientName: "Elizabeth Moore",
    medication: "Clopidogrel",
    strength: "75mg",
    quantity: 30,
    refills: 11,
    sig: "Take 1 tablet by mouth once daily",
    status: "Delivered",
    trackingNumber: "1Z1F3G5H7J9K1L3M",
  },
  {
    id: "15",
    queueId: "RX7X9Y1Z",
    submittedAt: "2024-11-28T09:30:00",
    providerName: "Dr. Sarah Patel",
    patientName: "Daniel Thompson",
    medication: "Prednisone",
    strength: "10mg",
    quantity: 21,
    refills: 0,
    sig: "Take 2 tablets by mouth once daily for 7 days, then 1 tablet daily for 7 days, then 0.5 tablet daily for 7 days",
    status: "Delivered",
    trackingNumber: "1Z4N6P8Q0R2S4T6U",
  },
];

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
  const [prescriptions, setPrescriptions] = useState<AdminPrescription[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [secondsSinceRefresh, setSecondsSinceRefresh] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load prescriptions from localStorage on mount and when storage changes
  useEffect(() => {
    const loadPrescriptions = () => {
      const submitted = JSON.parse(localStorage.getItem("submittedPrescriptions") || "[]");
      const combined = [...submitted, ...DEMO_ADMIN_PRESCRIPTIONS];
      setPrescriptions(combined);
      console.log("Admin loaded prescriptions:", combined.length, "total (", submitted.length, "submitted +", DEMO_ADMIN_PRESCRIPTIONS.length, "demo)");
    };

    // Load immediately
    loadPrescriptions();

    // Listen for storage changes (in case another tab updates it)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "submittedPrescriptions") {
        loadPrescriptions();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Also listen for custom event when same-tab updates occur
    const handleCustomStorageUpdate = () => {
      loadPrescriptions();
    };

    window.addEventListener("prescriptionsUpdated", handleCustomStorageUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("prescriptionsUpdated", handleCustomStorageUpdate);
    };
  }, []);

  // Auto-refresh: Update 1-2 random prescriptions every 30 seconds
  const simulateStatusUpdates = useCallback(() => {
    setPrescriptions((prev) => {
      const updatedPrescriptions = [...prev];

      // Find prescriptions that can be advanced (not already Delivered)
      const advanceablePrescriptions = updatedPrescriptions
        .map((p, index) => ({ prescription: p, index }))
        .filter(({ prescription }) => prescription.status !== "Delivered");

      if (advanceablePrescriptions.length === 0) return prev;

      // Randomly select 1-2 prescriptions to advance
      const numToUpdate = Math.min(
        Math.floor(Math.random() * 2) + 1,
        advanceablePrescriptions.length
      );

      const shuffled = [...advanceablePrescriptions].sort(() => Math.random() - 0.5);
      const toUpdate = shuffled.slice(0, numToUpdate);

      toUpdate.forEach(({ index }) => {
        const current = updatedPrescriptions[index];
        const { status, trackingNumber } = advanceStatus(current.status);
        updatedPrescriptions[index] = {
          ...current,
          status,
          ...(trackingNumber && { trackingNumber }),
        };
      });

      // Update localStorage for submitted prescriptions
      const submittedPrescriptions = updatedPrescriptions.filter(p => p.id.startsWith("submitted_"));
      if (submittedPrescriptions.length > 0) {
        localStorage.setItem("submittedPrescriptions", JSON.stringify(submittedPrescriptions));
      }

      return updatedPrescriptions;
    });

    setSecondsSinceRefresh(0);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    simulateStatusUpdates();
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
      </div>
  );
}
