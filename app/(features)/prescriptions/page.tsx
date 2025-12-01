"use client";

import { useState, useEffect, useCallback } from "react";
import DefaultLayout from "@/components/layout/DefaultLayout";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pill, Eye, RefreshCw } from "lucide-react";
import Link from "next/link";

interface Prescription {
  id: string;
  queueId: string;
  dateTime: string;
  patientName: string;
  medication: string;
  strength: string;
  quantity: number;
  refills: number;
  status: string;
  sig: string;
  form: string;
  dispenseAsWritten: boolean;
  pharmacyNotes?: string;
  trackingNumber?: string;
}

// Demo data - 15 realistic prescriptions with varied statuses
const DEMO_PRESCRIPTIONS: Prescription[] = [
  {
    id: "1",
    queueId: "RX7F3A2B",
    dateTime: "2024-12-01T14:30:00",
    patientName: "Sarah Johnson",
    medication: "Lisinopril",
    strength: "10mg",
    quantity: 30,
    refills: 3,
    status: "Submitted",
    sig: "Take 1 tablet by mouth once daily in the morning",
    form: "Tablet",
    dispenseAsWritten: false,
  },
  {
    id: "2",
    queueId: "RX9K2C1D",
    dateTime: "2024-12-01T13:15:00",
    patientName: "Michael Chen",
    medication: "Metformin",
    strength: "500mg",
    quantity: 60,
    refills: 2,
    status: "Submitted",
    sig: "Take 1 tablet by mouth twice daily with meals",
    form: "Tablet",
    dispenseAsWritten: true,
  },
  {
    id: "3",
    queueId: "RX4H8E5F",
    dateTime: "2024-12-01T11:45:00",
    patientName: "Emma Williams",
    medication: "Amoxicillin",
    strength: "500mg",
    quantity: 21,
    refills: 0,
    status: "Billing",
    sig: "Take 1 capsule by mouth three times daily for 7 days",
    form: "Capsule",
    dispenseAsWritten: false,
  },
  {
    id: "4",
    queueId: "RX1B6G9H",
    dateTime: "2024-12-01T10:20:00",
    patientName: "David Martinez",
    medication: "Omeprazole",
    strength: "20mg",
    quantity: 30,
    refills: 5,
    status: "Billing",
    sig: "Take 1 capsule by mouth once daily 30 minutes before breakfast",
    form: "Capsule",
    dispenseAsWritten: false,
  },
  {
    id: "5",
    queueId: "RX8P5Q2R",
    dateTime: "2024-12-01T09:35:00",
    patientName: "Lisa Anderson",
    medication: "Atorvastatin",
    strength: "20mg",
    quantity: 90,
    refills: 3,
    status: "Approved",
    sig: "Take 1 tablet by mouth once daily at bedtime",
    form: "Tablet",
    dispenseAsWritten: false,
  },
  {
    id: "6",
    queueId: "RX3M7N4S",
    dateTime: "2024-11-30T16:50:00",
    patientName: "Jennifer Taylor",
    medication: "Levothyroxine",
    strength: "50mcg",
    quantity: 30,
    refills: 11,
    status: "Approved",
    sig: "Take 1 tablet by mouth once daily on an empty stomach, 30 minutes before breakfast",
    form: "Tablet",
    dispenseAsWritten: false,
  },
  {
    id: "7",
    queueId: "RX6T8U1V",
    dateTime: "2024-11-30T15:25:00",
    patientName: "Robert Brown",
    medication: "Gabapentin",
    strength: "300mg",
    quantity: 90,
    refills: 2,
    status: "Approved",
    sig: "Take 1 capsule by mouth three times daily",
    form: "Capsule",
    dispenseAsWritten: false,
  },
  {
    id: "8",
    queueId: "RX2W9X4Y",
    dateTime: "2024-11-30T14:15:00",
    patientName: "Patricia Davis",
    medication: "Sertraline",
    strength: "50mg",
    quantity: 30,
    refills: 5,
    status: "Packed",
    sig: "Take 1 tablet by mouth once daily in the morning",
    form: "Tablet",
    dispenseAsWritten: false,
  },
  {
    id: "9",
    queueId: "RX5Z3A7B",
    dateTime: "2024-11-30T13:05:00",
    patientName: "Christopher Lee",
    medication: "Losartan",
    strength: "50mg",
    quantity: 30,
    refills: 3,
    status: "Packed",
    sig: "Take 1 tablet by mouth once daily",
    form: "Tablet",
    dispenseAsWritten: false,
  },
  {
    id: "10",
    queueId: "RX1C4D8E",
    dateTime: "2024-11-30T11:40:00",
    patientName: "Amanda White",
    medication: "Amlodipine",
    strength: "5mg",
    quantity: 30,
    refills: 3,
    status: "Shipped",
    sig: "Take 1 tablet by mouth once daily",
    form: "Tablet",
    dispenseAsWritten: false,
    trackingNumber: "1Z9A8B7C6D5E4F3G",
  },
  {
    id: "11",
    queueId: "RX7K9L2M",
    dateTime: "2024-11-29T16:30:00",
    patientName: "Thomas Garcia",
    medication: "Hydrochlorothiazide",
    strength: "25mg",
    quantity: 30,
    refills: 6,
    status: "Shipped",
    sig: "Take 1 tablet by mouth once daily in the morning",
    form: "Tablet",
    dispenseAsWritten: false,
    trackingNumber: "1Z2H4J6K8L0M1N3P",
  },
  {
    id: "12",
    queueId: "RX4N6P8Q",
    dateTime: "2024-11-29T14:20:00",
    patientName: "Maria Rodriguez",
    medication: "Albuterol",
    strength: "90mcg",
    quantity: 1,
    refills: 3,
    status: "Delivered",
    sig: "Inhale 2 puffs every 4-6 hours as needed for wheezing",
    form: "Inhaler",
    dispenseAsWritten: false,
    trackingNumber: "1Z5R7S9T1U3V5W7X",
  },
  {
    id: "13",
    queueId: "RX9R1S3T",
    dateTime: "2024-11-29T10:15:00",
    patientName: "James Wilson",
    medication: "Pantoprazole",
    strength: "40mg",
    quantity: 30,
    refills: 2,
    status: "Delivered",
    sig: "Take 1 tablet by mouth once daily 30 minutes before breakfast",
    form: "Tablet",
    dispenseAsWritten: false,
    trackingNumber: "1Z8Y0Z2A4B6C8D0E",
  },
  {
    id: "14",
    queueId: "RX2U4V6W",
    dateTime: "2024-11-28T15:45:00",
    patientName: "Elizabeth Moore",
    medication: "Clopidogrel",
    strength: "75mg",
    quantity: 30,
    refills: 11,
    status: "Delivered",
    sig: "Take 1 tablet by mouth once daily",
    form: "Tablet",
    dispenseAsWritten: true,
    trackingNumber: "1Z1F3G5H7J9K1L3M",
  },
  {
    id: "15",
    queueId: "RX7X9Y1Z",
    dateTime: "2024-11-28T09:30:00",
    patientName: "Daniel Thompson",
    medication: "Prednisone",
    strength: "10mg",
    quantity: 21,
    refills: 0,
    status: "Delivered",
    sig: "Take 2 tablets by mouth once daily for 7 days, then 1 tablet daily for 7 days, then 0.5 tablet daily for 7 days",
    form: "Tablet",
    dispenseAsWritten: false,
    trackingNumber: "1Z4N6P8Q0R2S4T6U",
  },
];

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

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedPrescription, setSelectedPrescription] =
    useState<Prescription | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [secondsSinceRefresh, setSecondsSinceRefresh] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load prescriptions from localStorage on mount
  useEffect(() => {
    const loadPrescriptions = () => {
      const submitted = JSON.parse(localStorage.getItem("submittedPrescriptions") || "[]");
      const combined = [...submitted, ...DEMO_PRESCRIPTIONS];
      setPrescriptions(combined);
    };
    loadPrescriptions();
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

  const handleManualRefresh = () => {
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

  const handleViewDetails = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setIsDialogOpen(true);
  };

  const formatTimeSinceRefresh = (seconds: number) => {
    if (seconds < 5) return "just now";
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  };

  return (
    <DefaultLayout>
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Prescriptions
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage and track all e-prescriptions
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Link href="/prescriptions/new/step1">
                <Button size="lg" className="w-full sm:w-auto">
                  <Plus className="mr-2 h-5 w-5" />
                  New Prescription
                </Button>
              </Link>
            </div>
          </div>

          {/* Last Updated */}
          <p className="text-sm text-muted-foreground">
            Last updated {formatTimeSinceRefresh(secondsSinceRefresh)}
          </p>
        </div>

        {/* Prescriptions Table */}
        {prescriptions.length === 0 ? (
          <div className="bg-white border border-border rounded-lg p-12 text-center">
            <Pill className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              No prescriptions submitted yet
            </h3>
            <p className="text-muted-foreground mb-6">
              Get started by creating your first prescription
            </p>
            <Link href="/prescriptions/new/step1">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Prescription
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Date & Time</TableHead>
                    <TableHead className="font-semibold">Patient Name</TableHead>
                    <TableHead className="font-semibold">
                      Medication + Strength
                    </TableHead>
                    <TableHead className="font-semibold">
                      Quantity / Refills
                    </TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Queue ID</TableHead>
                    <TableHead className="font-semibold text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prescriptions.map((prescription) => (
                    <TableRow key={prescription.id} className="hover:bg-gray-50">
                      <TableCell className="whitespace-nowrap">
                        {formatDateTime(prescription.dateTime)}
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
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(prescription)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* View Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                Prescription Details
              </DialogTitle>
              <DialogDescription>
                Queue ID: {selectedPrescription?.queueId}
              </DialogDescription>
            </DialogHeader>

            {selectedPrescription && (
              <div className="space-y-6 mt-4">
                {/* Status Badge */}
                <div className="flex items-center justify-between pb-4 border-b">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge
                    variant="outline"
                    className={getStatusColor(selectedPrescription.status)}
                  >
                    {selectedPrescription.status}
                  </Badge>
                </div>

                {/* Patient Information */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Patient Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium">
                          {selectedPrescription.patientName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Date & Time
                        </p>
                        <p className="font-medium">
                          {formatDateTime(selectedPrescription.dateTime)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Medication Information */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">
                    Medication Information
                  </h3>
                  <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Medication
                        </p>
                        <p className="font-semibold text-lg">
                          {selectedPrescription.medication}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Strength
                        </p>
                        <p className="font-medium">
                          {selectedPrescription.strength}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Form</p>
                        <p className="font-medium">
                          {selectedPrescription.form}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Quantity
                        </p>
                        <p className="font-medium">
                          {selectedPrescription.quantity}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Refills</p>
                        <p className="font-medium">
                          {selectedPrescription.refills}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Dispense as Written
                        </p>
                        <p className="font-medium">
                          {selectedPrescription.dispenseAsWritten ? "Yes" : "No"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Directions */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">
                    Directions (SIG)
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900">{selectedPrescription.sig}</p>
                  </div>
                </div>

                {/* Pharmacy Notes */}
                {selectedPrescription.pharmacyNotes && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">
                      Notes to Pharmacy
                    </h3>
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                      <p className="text-gray-900">
                        {selectedPrescription.pharmacyNotes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DefaultLayout>
  );
}
