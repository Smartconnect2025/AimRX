"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Plus, Pill, CheckCircle2, Copy, Printer, MapPin, Clock } from "lucide-react";
import Link from "next/link";
import { createClient } from "@core/supabase";
import { useUser } from "@core/auth";
import { toast } from "sonner";

// Force dynamic rendering - prescriptions are user-specific
export const dynamic = 'force-dynamic';

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
  patientPrice?: string;
  vialSize?: string;
  dosageAmount?: string;
  dosageUnit?: string;
  pharmacyName?: string;
  pharmacyColor?: string;
}

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

interface DigitalRxStatusData {
  BillingStatus?: string;
  PackDateTime?: string;
  ApprovedDate?: string;
  PickupDate?: string;
  DeliveredDate?: string;
  TrackingNumber?: string;
}

// Map DigitalRx status to display status
const mapDigitalRxStatus = (statusData: DigitalRxStatusData): { status: string; trackingNumber?: string } => {
  if (statusData.DeliveredDate) {
    return {
      status: "Delivered",
      trackingNumber: statusData.TrackingNumber
    };
  } else if (statusData.PickupDate) {
    return {
      status: "Shipped",
      trackingNumber: statusData.TrackingNumber
    };
  } else if (statusData.ApprovedDate) {
    return { status: "Approved" };
  } else if (statusData.PackDateTime) {
    return { status: "Processing" };
  } else if (statusData.BillingStatus) {
    return { status: "Billing" };
  }
  return { status: "Submitted" };
};

export default function PrescriptionsPage() {
  const supabase = createClient();
  const { user } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedPrescription, setSelectedPrescription] =
    useState<Prescription | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // const [, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"in-progress" | "completed">("in-progress");
  const [searchQuery, setSearchQuery] = useState("");

  // Load prescriptions from Supabase with real-time updates
  const loadPrescriptions = useCallback(async () => {
    if (!user?.id) {
      console.warn("⚠️ No user ID, cannot load prescriptions");
      return;
    }

    console.log("🔄 Loading prescriptions for user:", user.id);
    console.log("🔄 Current time:", new Date().toISOString());

    const { data, error} = await supabase
      .from("prescriptions")
      .select(`
        id,
        queue_id,
        submitted_at,
        medication,
        dosage,
        dosage_amount,
        dosage_unit,
        vial_size,
        form,
        quantity,
        refills,
        sig,
        dispense_as_written,
        pharmacy_notes,
        patient_price,
        status,
        tracking_number,
        pharmacy_id,
        patient:patients(first_name, last_name, date_of_birth),
        pharmacy:pharmacies(name, primary_color)
      `)
      .eq("prescriber_id", user.id)
      .order("submitted_at", { ascending: false });

    console.log("📊 Current user ID:", user.id, "Found prescriptions:", data?.length || 0);
    if (error) {
      console.error("❌ Error loading prescriptions:", error);
    }
    if (data && data.length > 0) {
      console.log("📋 First prescription (newest):", data[0]);
    } else {
      console.warn("⚠️ No prescriptions found for user:", user.id);
    }

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
      console.log("📥 Raw prescription data from database:", data);

      const doctorName = providerData
        ? `Dr. ${providerData.first_name} ${providerData.last_name}`
        : "Unknown Provider";

      const formatted = data.map((rx) => {
        console.log("📋 Processing prescription:", {
          medication: rx.medication,
          vial_size: rx.vial_size,
          form: rx.form,
          patient_price: rx.patient_price,
          pharmacy_notes: rx.pharmacy_notes,
          sig: rx.sig,
        });
        const patient = Array.isArray(rx.patient) ? rx.patient[0] : rx.patient;
        const pharmacy = Array.isArray(rx.pharmacy) ? rx.pharmacy[0] : rx.pharmacy;
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
          form: rx.form,
          dispenseAsWritten: rx.dispense_as_written || false,
          pharmacyNotes: rx.pharmacy_notes,
          patientPrice: rx.patient_price,
          vialSize: rx.vial_size,
          dosageAmount: rx.dosage_amount,
          dosageUnit: rx.dosage_unit,
          pharmacyName: pharmacy?.name,
          pharmacyColor: pharmacy?.primary_color,
        };
      });

      setPrescriptions(formatted);
      console.log("✅ Loaded prescriptions from Supabase:", formatted.length);
      console.log("📋 All prescriptions:", formatted.map(p => ({
        id: p.id,
        queueId: p.queueId,
        medication: p.medication,
        patient: p.patientName,
        dateTime: p.dateTime,
        patientPrice: p.patientPrice,
        pharmacyNotes: p.pharmacyNotes?.substring(0, 50),
      })));
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

  // Force refresh when redirected with ?refresh=true
  useEffect(() => {
    const shouldRefresh = searchParams.get("refresh");
    if (shouldRefresh === "true") {
      console.log("🔄 FORCE REFRESH TRIGGERED - Loading new prescription");
      loadPrescriptions();
      // Remove the refresh param from URL
      router.replace("/prescriptions");
    }
  }, [searchParams, loadPrescriptions, router]);

  // Fetch real status updates from DigitalRx
  const fetchStatusUpdates = useCallback(async () => {
    if (!user?.id) return;
    if (prescriptions.length === 0) return; // Don't fetch if no prescriptions

    try {
      console.log("🔄 Fetching status updates from DigitalRx...");

      const response = await fetch("/api/prescriptions/status-batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: user.id }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("❌ Failed to fetch status updates:", response.status, errorData);
        return;
      }

      const data = await response.json();

      if (data.success && data.statuses) {
        console.log("✅ Received status updates:", data.statuses.length);

        // Update prescriptions with new statuses
        setPrescriptions((prev) => {
          const updated = prev.map((prescription) => {
            const statusUpdate = data.statuses.find(
              (s: { prescription_id: string; success: boolean; status?: DigitalRxStatusData }) =>
                s.prescription_id === prescription.id
            );

            if (statusUpdate && statusUpdate.success && statusUpdate.status) {
              const { status, trackingNumber } = mapDigitalRxStatus(statusUpdate.status);
              return {
                ...prescription,
                status,
                ...(trackingNumber && { trackingNumber }),
              };
            }

            return prescription;
          });

          return updated;
        });
      }
    } catch (error) {
      console.error("❌ Error fetching status updates:", error);
    }
  }, [user?.id, prescriptions.length]);

  // Fetch status updates on mount and when prescriptions change
  useEffect(() => {
    if (prescriptions.length > 0) {
      fetchStatusUpdates();
    }
  }, [prescriptions.length, fetchStatusUpdates]);

  // Auto-refresh status every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStatusUpdates();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchStatusUpdates]);

  const handleViewDetails = async (prescription: Prescription) => {
    console.log("👁️ VIEW clicked for prescription:", prescription.id);
    console.log("📋 Prescription data being displayed:", {
      medication: prescription.medication,
      vialSize: prescription.vialSize,
      form: prescription.form,
      patientPrice: prescription.patientPrice,
      pharmacyNotes: prescription.pharmacyNotes,
      sig: prescription.sig,
    });

    // Force refresh the prescription data from database
    const { data: freshData, error } = await supabase
      .from("prescriptions")
      .select(`
        id,
        queue_id,
        submitted_at,
        medication,
        dosage,
        dosage_amount,
        dosage_unit,
        vial_size,
        form,
        quantity,
        refills,
        sig,
        dispense_as_written,
        pharmacy_notes,
        patient_price,
        status,
        tracking_number,
        patient:patients(first_name, last_name, date_of_birth)
      `)
      .eq("id", prescription.id)
      .single();

    if (error) {
      console.error("❌ Error fetching fresh prescription data:", error);
      setSelectedPrescription(prescription);
    } else {
      console.log("✅ Fresh prescription data from database:", freshData);

      const freshPrescription = {
        ...prescription,
        vialSize: freshData.vial_size,
        form: freshData.form,
        patientPrice: freshData.patient_price,
        pharmacyNotes: freshData.pharmacy_notes,
        sig: freshData.sig,
        dispenseAsWritten: freshData.dispense_as_written || false,
        dosageAmount: freshData.dosage_amount,
        dosageUnit: freshData.dosage_unit,
      };

      console.log("🔄 Updated prescription for modal:", freshPrescription);
      console.log("💰 Displaying patient price:", freshPrescription.patientPrice);
      setSelectedPrescription(freshPrescription);
    }

    setIsDialogOpen(true);
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
      <div className="container max-w-7xl mx-auto py-8 px-4">
        {/* Search Bar and New Prescription Button */}
        <div className="mb-6">
          <div className="flex justify-between items-center gap-4 mb-4">
            <Input
              placeholder="Search by patient or medication..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md border-gray-300 rounded-lg"
            />
            <Link href="/prescriptions/new/step1">
              <Button size="sm" className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white">
                <Plus className="mr-2 h-4 w-4" />
                New Prescription
              </Button>
            </Link>
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
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Date & Time</TableHead>
                    <TableHead className="font-semibold">Patient Name</TableHead>
                    <TableHead className="font-semibold">
                      Medication + Strength/Dosage
                    </TableHead>
                    <TableHead className="font-semibold">
                      Quantity / Refills
                    </TableHead>
                    <TableHead className="font-semibold">Pharmacy</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrescriptions.map((prescription) => (
                    <TableRow
                      key={prescription.id}
                      className="hover:bg-gray-50"
                    >
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
                        {prescription.pharmacyName ? (
                          <span className="font-medium" style={{ color: prescription.pharmacyColor || "#1E3A8A" }}>
                            {prescription.pharmacyName}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not specified</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant="outline"
                            className={`${getStatusColor(prescription.status)} text-xs px-2 py-1`}
                          >
                            {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                          </Badge>
                          {prescription.queueId && prescription.queueId !== "N/A" && (
                            <span className="text-xs text-muted-foreground">
                              Queue: {prescription.queueId}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(prescription)}
                          className="border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white"
                        >
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
                        // Fallback copy method that works in all browsers
                        const textarea = document.createElement('textarea');
                        textarea.value = selectedPrescription.queueId;
                        textarea.style.position = 'fixed';
                        textarea.style.opacity = '0';
                        document.body.appendChild(textarea);
                        textarea.select();
                        try {
                          document.execCommand('copy');
                          toast.success("Reference # copied to clipboard");
                        } catch {
                          toast.error("Failed to copy");
                        }
                        document.body.removeChild(textarea);
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

                {/* Production Status Box */}
                <div className="bg-gray-100 rounded-lg p-4 border border-gray-300">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#00AEEF' }} />
                    <div className="space-y-2">
                      <h3 className="font-semibold text-gray-900">In Production</h3>
                      <p className="text-sm text-gray-900">
                        Your custom regenerative therapy is being freshly compounded at AIM&apos;s lab.
                      </p>
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">Typical preparation time:</span> 5–10 business days
                      </p>
                      <p className="text-sm text-gray-900">
                        We will text or email you as soon as it&apos;s ready for pickup or shipping.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Medications List */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg" style={{ color: '#00AEEF' }}>
                    Prescription Details
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    {/* Medication Name */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Medication</p>
                        <p className="text-base font-semibold text-gray-900">{selectedPrescription.medication}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Vial Size</p>
                        <p className="text-base text-gray-900">{selectedPrescription.vialSize || "5mL"}</p>
                      </div>
                    </div>

                    {/* Dosage Information */}
                    <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-200">
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Dosage Amount</p>
                        <p className="text-base text-gray-900">{selectedPrescription.dosageAmount || selectedPrescription.strength}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Unit</p>
                        <p className="text-base text-gray-900">{selectedPrescription.dosageUnit || "mg"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Form</p>
                        <p className="text-base text-gray-900">{selectedPrescription.form !== "N/A" ? selectedPrescription.form : "Injectable"}</p>
                      </div>
                    </div>

                    {/* Quantity and Refills */}
                    <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-200">
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Quantity</p>
                        <p className="text-base text-gray-900">{selectedPrescription.quantity}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Refills</p>
                        <p className="text-base text-gray-900">{selectedPrescription.refills}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">DAW</p>
                        <p className="text-base text-gray-900">{selectedPrescription.dispenseAsWritten ? "Yes" : "No"}</p>
                      </div>
                    </div>

                    {/* SIG - How to Use */}
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600 font-medium">How to Use This Medication (Patient Directions)</p>
                      <p className="text-base text-gray-900 mt-1 leading-relaxed">
                        {selectedPrescription.sig || "Inject 0.5mL subcutaneously once daily in the evening. Rotate injection sites between abdomen, thigh, and upper arm. Store in refrigerator between 36-46°F. Allow to reach room temperature before injection. Dispose of used syringes in approved sharps container."}
                      </p>
                    </div>

                    {/* Patient Price - Always show with demo value if not available */}
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600 font-medium">Patient Price</p>
                      <p className="text-xl font-bold text-gray-900 mt-1">
                        ${selectedPrescription.patientPrice || "299.00"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notes from Pharmacy - Always show */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="font-semibold text-sm text-gray-700 mb-2">📋 Important Notes from AIM Pharmacy:</p>
                  <div className="text-sm text-gray-900 space-y-1">
                    {(selectedPrescription.pharmacyNotes || "• Keep refrigerated at 36-46°F until use\n• This medication requires proper injection technique - review instructions with your provider\n• Report any unusual side effects to your doctor immediately\n• Do not share needles or medication with others\n• Dispose of used supplies in an approved sharps container")
                      .split('\n')
                      .map((line, index) => (
                        <p key={index} className="leading-relaxed">{line}</p>
                      ))}
                  </div>
                </div>

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
