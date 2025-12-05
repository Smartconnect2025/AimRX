"use client";

import { useState, useEffect, useCallback } from "react";
import DefaultLayout from "@/components/layout/DefaultLayout";
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
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Plus, Pill, Eye, RefreshCw, CheckCircle2, FileText, UserPlus, Search, Copy, Printer, MapPin } from "lucide-react";
import Link from "next/link";
import { createClient } from "@core/supabase";
import { useUser } from "@core/auth";
import { toast } from "sonner";

interface Prescription {
  id: string;
  queueId: string;
  dateTime: string;
  patientName: string;
  patientDOB?: string;
  doctorName?: string;
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

const getStatusColor = () => {
  // All statuses use solid navy background with white text
  return "bg-[#1E3A8A] text-white border-[#1E3A8A]";
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
  const supabase = createClient();
  const { user } = useUser();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedPrescription, setSelectedPrescription] =
    useState<Prescription | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [secondsSinceRefresh, setSecondsSinceRefresh] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"in-progress" | "completed">("in-progress");
  const [searchQuery, setSearchQuery] = useState("");

  // Load prescriptions from Supabase with real-time updates
  const loadPrescriptions = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
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
        patient:patients(first_name, last_name, date_of_birth)
      `)
      .eq("prescriber_id", user.id)
      .order("submitted_at", { ascending: false });

    // Also fetch doctor name
    const { data: providerData } = await supabase
      .from("providers")
      .select("first_name, last_name")
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Error loading prescriptions:", error);
      return;
    }

    if (data) {
      const doctorName = providerData
        ? `Dr. ${providerData.first_name} ${providerData.last_name}`
        : "Unknown Provider";

      const formatted = data.map((rx) => {
        const patient = Array.isArray(rx.patient) ? rx.patient[0] : rx.patient;
        return {
          id: rx.id,
          queueId: rx.queue_id || "N/A",
          dateTime: rx.submitted_at,
          patientName: patient
            ? `${patient.first_name} ${patient.last_name}`
            : "Unknown Patient",
          patientDOB: patient?.date_of_birth,
          doctorName,
          medication: rx.medication,
          strength: rx.dosage,
          quantity: rx.quantity,
          refills: rx.refills,
          sig: rx.sig,
          status: rx.status || "submitted",
          trackingNumber: rx.tracking_number,
          form: "Tablet", // Default for now, should be added to schema
          dispenseAsWritten: false, // Default for now, should be added to schema
          pharmacyNotes: undefined,
        };
      });

      setPrescriptions(formatted);
      console.log("Loaded prescriptions from Supabase:", formatted.length);
    }
  }, [supabase, user?.id]);

  useEffect(() => {
    loadPrescriptions();

    // Set up real-time subscription for prescription changes
    const channel = supabase
      .channel("prescriptions-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "prescriptions",
          filter: `prescriber_id=eq.${user?.id}`,
        },
        () => {
          loadPrescriptions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadPrescriptions, supabase, user?.id]);

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
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Statuses updated", {
        icon: <CheckCircle2 className="h-5 w-5" />,
        duration: 3000,
      });
    }, 500);
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

  // Filter prescriptions based on active tab and search query
  const filteredPrescriptions = prescriptions.filter((rx) => {
    // Filter by tab
    const tabMatch = activeTab === "in-progress"
      ? rx.status.toLowerCase() !== "delivered"
      : rx.status.toLowerCase() === "delivered";

    // Filter by search query
    if (!searchQuery.trim()) return tabMatch;

    const query = searchQuery.toLowerCase();
    const searchMatch =
      rx.patientName.toLowerCase().includes(query) ||
      rx.medication.toLowerCase().includes(query);

    return tabMatch && searchMatch;
  });

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
              {process.env.NODE_ENV === "development" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    // Test success toast
                    toast.success("Prescription submitted successfully!", {
                      description: "Queue ID: RX-TEST-12345",
                      duration: 6000,
                      icon: <CheckCircle2 className="h-5 w-5" />,
                    });

                    // Test error toast
                    setTimeout(() => {
                      toast.error("Submission failed", {
                        description: "Patient data missing - please try again",
                        duration: 6000,
                      });
                    }, 500);

                    // Console log for verification
                    setTimeout(() => {
                      const successToast = document.querySelector('[data-sonner-toast]');
                      console.log("TOAST TEST: Success toast visible = " + (successToast ? "YES" : "NO"));
                    }, 100);
                  }}
                  className="bg-yellow-100 hover:bg-yellow-200 text-yellow-900 border-yellow-300"
                >
                  TEST TOASTS
                </Button>
              )}
              <Link href="/prescriptions/new/step1">
                <Button size="lg" className="w-full sm:w-auto bg-[#1E3A8A] hover:bg-[#F97316] text-white">
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

        {/* Search Bar and Tabs */}
        <div className="mb-6">
          {/* Search Bar */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by patient or medication..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-[50px]"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-border">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab("in-progress")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "in-progress"
                    ? "border-[#1E3A8A] text-[#1E3A8A]"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                }`}
              >
                In Progress
                {prescriptions.filter((rx) => rx.status.toLowerCase() !== "delivered").length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                    {prescriptions.filter((rx) => rx.status.toLowerCase() !== "delivered").length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("completed")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "completed"
                    ? "border-[#1E3A8A] text-[#1E3A8A]"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                }`}
              >
                Completed
                {prescriptions.filter((rx) => rx.status.toLowerCase() === "delivered").length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                    {prescriptions.filter((rx) => rx.status.toLowerCase() === "delivered").length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions - Show in completed tab */}
        {activeTab === "completed" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Link
              href="/prescriptions/new/step1"
              className="group bg-[#1E3A8A] hover:bg-[#F97316] text-white rounded-[4px] p-8 flex flex-col items-center justify-center text-center transition-all duration-200 hover:-translate-y-1 shadow-lg hover:shadow-xl border border-gray-200"
            >
              <FileText className="h-12 w-12 mb-3 text-white" />
              <h3 className="text-xl font-bold text-white">Write New Prescription</h3>
              <p className="text-sm mt-2 text-white opacity-90">Create and submit e-prescriptions</p>
            </Link>
            <Link
              href="/basic-emr"
              className="group bg-[#1E3A8A] hover:bg-[#F97316] text-white rounded-[4px] p-8 flex flex-col items-center justify-center text-center transition-all duration-200 hover:-translate-y-1 shadow-lg hover:shadow-xl border border-gray-200"
            >
              <UserPlus className="h-12 w-12 mb-3 text-white" />
              <h3 className="text-xl font-bold text-white">Register New Patient</h3>
              <p className="text-sm mt-2 text-white opacity-90">Add patients to your EMR</p>
            </Link>
          </div>
        )}

        {/* Prescriptions Table */}
        {filteredPrescriptions.length === 0 ? (
          <div className="bg-white border border-border rounded-lg p-12 text-center">
            <Pill className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {activeTab === "in-progress"
                ? "No prescriptions in progress"
                : "No completed prescriptions"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {activeTab === "in-progress"
                ? "All prescriptions have been delivered"
                : "No prescriptions have been completed yet"}
            </p>
            {activeTab === "in-progress" && (
              <Link href="/prescriptions/new/step1">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Prescription
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-none">
                    <TableHead className="text-[#1E3A8A] font-bold border-none">Date & Time</TableHead>
                    <TableHead className="text-[#1E3A8A] font-bold border-none">Patient Name</TableHead>
                    <TableHead className="text-[#1E3A8A] font-bold border-none">
                      Medication + Strength/Dosage
                    </TableHead>
                    <TableHead className="text-[#1E3A8A] font-bold border-none">
                      Quantity / Refills
                    </TableHead>
                    <TableHead className="text-[#1E3A8A] font-bold border-none">Status</TableHead>
                    <TableHead className="text-[#1E3A8A] font-bold border-none text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrescriptions.map((prescription) => (
                    <TableRow key={prescription.id} className="hover:bg-gray-50 border-none">
                      <TableCell className="whitespace-nowrap border-none">
                        {formatDateTime(prescription.dateTime)}
                      </TableCell>
                      <TableCell className="font-medium border-none">
                        {prescription.patientName}
                      </TableCell>
                      <TableCell className="border-none">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {prescription.medication}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {prescription.strength}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="border-none">
                        <div className="flex flex-col">
                          <span>Qty: {prescription.quantity}</span>
                          <span className="text-sm text-muted-foreground">
                            Refills: {prescription.refills}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="border-none">
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant="outline"
                            className={`${getStatusColor()} uppercase rounded-[4px]`}
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
                      <TableCell className="text-right border-none">
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

        {/* AIM Official Receipt Modal */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto print:max-w-full">
            {selectedPrescription && (
              <div className="space-y-6" id="aim-receipt">
                {/* AIM Logo */}
                <div className="text-center pt-4">
                  <img
                    src="https://i.imgur.com/r65O4DB.png"
                    alt="AIM Medical Technologies"
                    className="h-[140px] mx-auto"
                  />
                </div>

                {/* Letterhead */}
                <div className="text-center text-sm text-gray-600 border-b pb-4">
                  <p className="font-semibold text-gray-900">AIM Medical Technologies</p>
                  <p>106 E 6th St, Suite 900 · Austin, TX 78701</p>
                  <p>(512) 377-9898 · Mon–Fri 9AM–6PM CST</p>
                </div>

                {/* Success Checkmark & Headline */}
                <div className="text-center py-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: '#00AEEF20' }}>
                    <CheckCircle2 className="w-10 h-10" style={{ color: '#00AEEF' }} />
                  </div>
                  <h2 className="text-2xl font-bold" style={{ color: '#00AEEF' }}>
                    Order Successfully Submitted
                  </h2>
                </div>

                {/* Reference Information */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Reference #</p>
                      <p className="font-bold text-lg">{selectedPrescription.queueId}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedPrescription.queueId);
                        toast.success("Reference # copied to clipboard");
                      }}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-sm text-gray-600">Patient</p>
                      <p className="font-medium">{selectedPrescription.patientName}</p>
                      {selectedPrescription.patientDOB && (
                        <p className="text-sm text-gray-600">DOB: {new Date(selectedPrescription.patientDOB).toLocaleDateString()}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="font-medium">{formatDateTime(selectedPrescription.dateTime)}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-600">Prescribed by</p>
                    <p className="font-medium">{selectedPrescription.doctorName || "Unknown Provider"}</p>
                  </div>
                </div>

                {/* Medications List */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg" style={{ color: '#00AEEF' }}>
                    Medication Details
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">Medication</th>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">Strength</th>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">Qty</th>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">SIG</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t">
                          <td className="p-3 font-medium">{selectedPrescription.medication}</td>
                          <td className="p-3">{selectedPrescription.strength}</td>
                          <td className="p-3">{selectedPrescription.quantity}</td>
                          <td className="p-3 text-sm">{selectedPrescription.sig}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Notes to Patient */}
                {selectedPrescription.pharmacyNotes && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="font-semibold text-sm text-gray-700 mb-1">Notes:</p>
                    <p className="text-sm text-gray-900">{selectedPrescription.pharmacyNotes}</p>
                  </div>
                )}

                {/* Fulfillment Box */}
                <div className="border-2 rounded-lg p-4 space-y-3" style={{ borderColor: '#00AEEF' }}>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 mt-0.5" style={{ color: '#00AEEF' }} />
                    <div>
                      <h3 className="font-semibold text-lg mb-2" style={{ color: '#00AEEF' }}>
                        Pickup Location
                      </h3>
                      <p className="font-semibold text-gray-900">AIM Medical Technologies</p>
                      <a
                        href="https://maps.google.com/?q=106+E+6th+St+Suite+900+Austin+TX+78701"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:underline inline-block mt-1"
                        style={{ color: '#00AEEF' }}
                      >
                        106 E 6th St, Suite 900, Austin, TX 78701 →
                      </a>
                    </div>
                  </div>
                </div>

                {/* Print Button */}
                <div className="pt-4">
                  <Button
                    onClick={() => window.print()}
                    className="w-full text-lg py-6"
                    style={{ backgroundColor: '#00AEEF' }}
                  >
                    <Printer className="h-5 w-5 mr-2" />
                    Print Patient Receipt
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DefaultLayout>
  );
}
