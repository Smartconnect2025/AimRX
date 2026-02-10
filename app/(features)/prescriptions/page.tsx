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
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Plus,
  Pill,
  CheckCircle2,
  Copy,
  Printer,
  MapPin,
  Clock,
  DollarSign,
  FileText,
} from "lucide-react";
import { createClient } from "@core/supabase";
import { useUser } from "@core/auth";
import { toast } from "sonner";
import { BillPatientModal } from "@/components/billing/BillPatientModal";
import { CompleteProfileModal } from "@/features/provider-profile";

// Force dynamic rendering - prescriptions are user-specific
export const dynamic = "force-dynamic";

// Function to print receipt using iframe (avoids CSS color compatibility issues)
const printReceipt = () => {
  const element = document.getElementById("aim-receipt");
  if (!element) {
    toast.error("Could not find receipt content");
    return;
  }

  // Clone the element and remove buttons
  const clone = element.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(".print-hide").forEach((el) => el.remove());

  // Create iframe for printing
  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.top = "-10000px";
  iframe.style.left = "-10000px";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    toast.error("Could not create print view");
    document.body.removeChild(iframe);
    return;
  }

  // Write content with inline styles
  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>AIM Receipt</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; padding: 12px; color: #333; font-size: 0.86rem; }
        img { max-width: 100%; height: auto; }
        .text-center { text-align: center; }
        .font-semibold { font-weight: 600; }
        .font-medium { font-weight: 500; }
        .text-sm { font-size: 0.75rem; }
        .text-base { font-size: 0.8rem; }
        .text-lg { font-size: 0.92rem; }
        .text-xl { font-size: 0.98rem; }
        .text-2xl { font-size: 1.03rem; }
        .text-gray-600 { color: #4b5563; }
        .text-gray-900 { color: #111827; }
        .mb-2 { margin-bottom: 0.17rem; }
        .mb-4 { margin-bottom: 0.29rem; }
        .mt-1 { margin-top: 0.12rem; }
        .pt-2, .pt-3, .pt-4 { padding-top: 0.17rem; }
        .pb-4 { padding-bottom: 0.29rem; }
        .space-y-2 > * + * { margin-top: 0.29rem; }
        .space-y-3 > * + * { margin-top: 0.29rem; }
        .space-y-4 > * + * { margin-top: 0.29rem; }
        .space-y-6 > * + * { margin-top: 0.29rem; }
        .border-t { border-top: 1px solid #e5e7eb; }
        .border-b { border-bottom: 1px solid #e5e7eb; }
        .grid { display: grid; }
        .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
        .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
        .gap-4 { gap: 0.4rem; }
        .flex { display: flex; }
        .items-center { align-items: center; }
        .items-start { align-items: flex-start; }
        .justify-between { justify-content: space-between; }
        .rounded-lg { border-radius: 0.3rem; }
        .p-4 { padding: 0.4rem; }
        .bg-blue-50 { background-color: #eff6ff; }
        .bg-green-50 { background-color: #f0fdf4; }
        .inline-flex { display: inline-flex; }
        .justify-center { justify-content: center; }
        .w-16 { width: 1.75rem; }
        .h-16 { height: 1.75rem; }
        .rounded-full { border-radius: 9999px; }
        a { color: #00AEEF; text-decoration: none; }
        @media print {
          body { padding: 6px; }
          @page { margin: 7mm; }
          .print-logo { height: 37px !important; margin-bottom: 0 !important; }
        }
      </style>
    </head>
    <body>
      ${clone.innerHTML}
    </body>
    </html>
  `);
  iframeDoc.close();

  // Wait for images to load then print
  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 250);
  };
};

// Print styles for single-page receipt
const printStyles = `
@media print {
  @page {
    size: auto;
    margin: 7mm;
  }

  /* Hide the main app content */
  #__next > *:not([data-radix-portal]),
  body > div:first-child > *:not([data-radix-portal]) {
    display: none !important;
  }

  /* Hide non-print elements */
  .print-hide {
    display: none !important;
  }

  /* Hide Radix overlay/backdrop but keep dialog */
  [data-radix-dialog-overlay] {
    display: none !important;
  }

  /* Make dialog content visible and positioned for print */
  [role="dialog"] {
    position: static !important;
    transform: none !important;
    max-height: none !important;
    max-width: 100% !important;
    width: 100% !important;
    overflow: visible !important;
    box-shadow: none !important;
    border: none !important;
    background: white !important;
    padding: 0 !important;
  }

  /* Hide dialog close button */
  [role="dialog"] button[class*="absolute"][class*="right"],
  [role="dialog"] > button:first-child {
    display: none !important;
  }

  /* Ensure portal is visible */
  [data-radix-portal] {
    display: block !important;
    position: static !important;
  }

  /* Kill all space-y gaps in print */
  .print-container,
  .print-container * {
    --tw-space-y-reverse: 0 !important;
  }
  .print-container > * + * {
    margin-top: 0.17rem !important;
  }

  /* Container spacing */
  .print-container {
    padding: 0 !important;
  }

  /* Compact logo */
  .print-logo {
    height: 37px !important;
    margin-bottom: 0 !important;
  }

  /* Compact letterhead */
  .print-letterhead {
    padding-bottom: 0.17rem !important;
    padding-top: 0 !important;
    margin-bottom: 0 !important;
    font-size: 0.69rem !important;
  }

  .print-letterhead p {
    margin: 0 !important;
    line-height: 1.2 !important;
  }

  /* Smaller success icon + title */
  .print-title {
    padding: 0.12rem 0 !important;
  }

  .print-icon {
    width: 1.75rem !important;
    height: 1.75rem !important;
    margin-bottom: 0.12rem !important;
  }

  .print-icon svg {
    width: 1.15rem !important;
    height: 1.15rem !important;
  }

  .print-title h2 {
    font-size: 0.98rem !important;
  }

  /* Compact sections */
  .print-section {
    padding: 0.29rem !important;
    margin-bottom: 0 !important;
    border-radius: 3px !important;
  }

  /* Smaller text */
  .print-text {
    font-size: 0.69rem !important;
    line-height: 1.2 !important;
  }

  .print-text-sm {
    font-size: 0.63rem !important;
    line-height: 1.15 !important;
  }

  /* Compact grids */
  .print-grid {
    gap: 0.17rem !important;
    padding-top: 0.17rem !important;
  }

  .print-grid-2 {
    gap: 0.23rem !important;
    padding-top: 0.17rem !important;
  }

  /* Reference section */
  .print-ref {
    padding: 0.29rem !important;
  }

  .print-ref-title {
    font-size: 0.86rem !important;
  }

  /* Production box */
  .print-production {
    padding: 0.29rem !important;
  }

  .print-production h3 {
    font-size: 0.75rem !important;
    margin-bottom: 0 !important;
  }

  .print-production p {
    font-size: 0.63rem !important;
    line-height: 1.2 !important;
    margin-bottom: 0 !important;
  }

  /* Prescription details */
  .print-details-title {
    font-size: 0.8rem !important;
    margin-bottom: 0.12rem !important;
  }

  /* Notes section */
  .print-notes {
    padding: 0.29rem !important;
  }

  .print-notes p {
    font-size: 0.63rem !important;
    line-height: 1.2 !important;
  }

  /* Pickup location */
  .print-pickup {
    padding: 0.29rem !important;
    border-width: 1px !important;
  }

  .print-pickup h3 {
    font-size: 0.75rem !important;
    margin-bottom: 0 !important;
  }

  .print-pickup p,
  .print-pickup a {
    font-size: 0.63rem !important;
    line-height: 1.2 !important;
  }
}
`;

interface Prescription {
  id: string;
  queueId: string;
  dateTime: string;
  patientName: string;
  patientEmail?: string;
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
  profitCents?: number;
  shippingFeeCents?: number;
  totalPaidCents?: number;
  paymentStatus?: string;
  pdfStoragePath?: string;
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
const mapDigitalRxStatus = (
  statusData: DigitalRxStatusData,
): { status: string; trackingNumber?: string } => {
  if (statusData.DeliveredDate) {
    return {
      status: "Delivered",
      trackingNumber: statusData.TrackingNumber,
    };
  } else if (statusData.PickupDate) {
    return {
      status: "Shipped",
      trackingNumber: statusData.TrackingNumber,
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
  const [activeTab, setActiveTab] = useState<"in-progress" | "completed">(
    "in-progress",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [checkingActive, setCheckingActive] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [isSubmittingToPharmacy, setIsSubmittingToPharmacy] = useState(false);

  // Profile completion modal state
  const [showCompleteProfileModal, setShowCompleteProfileModal] =
    useState(false);
  const [missingProfileFields, setMissingProfileFields] = useState({
    npi: false,
    medicalLicense: false,
    signature: false,
  });

  // Load prescriptions from Supabase with real-time updates
  const loadPrescriptions = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    const { data, error } = await supabase
      .from("prescriptions")
      .select(
        `
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
        profit_cents,
        shipping_fee_cents,
        total_paid_cents,
        status,
        payment_status,
        tracking_number,
        pharmacy_id,
        pdf_storage_path,
        patient:patients(first_name, last_name, date_of_birth, email),
        pharmacy:pharmacies(name, primary_color)
      `,
      )
      .eq("prescriber_id", user.id)
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error("❌ Error loading prescriptions:", error);
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
      const doctorName = providerData
        ? `Dr. ${providerData.first_name} ${providerData.last_name}`
        : "Unknown Provider";

      const formatted = data.map((rx) => {
        const patient = Array.isArray(rx.patient) ? rx.patient[0] : rx.patient;
        const pharmacy = Array.isArray(rx.pharmacy)
          ? rx.pharmacy[0]
          : rx.pharmacy;
        return {
          id: rx.id,
          queueId: rx.queue_id || "N/A",
          dateTime: rx.submitted_at,
          patientName: patient
            ? `${patient.first_name} ${patient.last_name}`
            : "Unknown Patient",
          patientEmail: patient?.email,
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
          profitCents: rx.profit_cents,
          shippingFeeCents: rx.shipping_fee_cents,
          totalPaidCents: rx.total_paid_cents,
          paymentStatus: rx.payment_status,
          pdfStoragePath: rx.pdf_storage_path,
        };
      });

      setPrescriptions(formatted);
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
        },
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
      loadPrescriptions();
      // Remove the refresh param from URL
      router.replace("/prescriptions");
    }
  }, [searchParams, loadPrescriptions, router]);

  // Check profile completion on page load and show modal if incomplete
  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (!user?.id) return;

      try {
        const { data: provider } = await supabase
          .from("providers")
          .select("npi_number, medical_licenses, signature_url")
          .eq("user_id", user.id)
          .single();

        const hasNPI = Boolean(provider?.npi_number?.trim());
        const hasLicense =
          Array.isArray(provider?.medical_licenses) &&
          provider.medical_licenses.length > 0 &&
          provider.medical_licenses.some(
            (l: { licenseNumber?: string; state?: string }) =>
              l.licenseNumber && l.state,
          );
        const hasSignature = Boolean(provider?.signature_url);

        if (!hasNPI || !hasLicense || !hasSignature) {
          setMissingProfileFields({ npi: !hasNPI, medicalLicense: !hasLicense, signature: !hasSignature });
          setShowCompleteProfileModal(true);
        }
      } catch (error) {
        console.error("Error checking profile completion:", error);
      }
    };

    checkProfileCompletion();
  }, [user?.id, supabase]);

  // Fetch real status updates from DigitalRx
  const fetchStatusUpdates = useCallback(async () => {
    if (!user?.id) return;
    if (prescriptions.length === 0) return; // Don't fetch if no prescriptions

    try {
      const response = await fetch("/api/prescriptions/status-batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: user.id }),
      });

      if (!response.ok) {
        // Silently fail - status updates are not critical
        // (Pharmacy backend may not be configured for status polling)
        return;
      }

      const data = await response.json();

      if (data.success && data.statuses) {
        // Update prescriptions with new statuses
        setPrescriptions((prev) => {
          const updated = prev.map((prescription) => {
            const statusUpdate = data.statuses.find(
              (s: {
                prescription_id: string;
                success: boolean;
                status?: DigitalRxStatusData;
              }) => s.prescription_id === prescription.id,
            );

            if (statusUpdate && statusUpdate.success && statusUpdate.status) {
              const { status, trackingNumber } = mapDigitalRxStatus(
                statusUpdate.status,
              );
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
    } catch {
      // Silently fail - status updates are not critical
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

  const handleCreatePrescription = async () => {
    setCheckingActive(true);
    try {
      // First check if profile is complete (NPI, medical license, and signature)
      const { data: provider } = await supabase
        .from("providers")
        .select("npi_number, medical_licenses, signature_url")
        .eq("user_id", user?.id)
        .single();
      const hasNPI = Boolean(provider?.npi_number?.trim());
      const hasLicense =
        Array.isArray(provider?.medical_licenses) &&
        provider.medical_licenses.length > 0 &&
        provider.medical_licenses.some(
          (l: { licenseNumber?: string; state?: string }) =>
            l.licenseNumber && l.state,
        );
      const hasSignature = Boolean(provider?.signature_url);

      if (!hasNPI || !hasLicense || !hasSignature) {
        setMissingProfileFields({ npi: !hasNPI, medicalLicense: !hasLicense, signature: !hasSignature });
        setShowCompleteProfileModal(true);
        return;
      }

      // Then check if account is active
      const response = await fetch("/api/provider/check-active");
      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error("Unable to verify account status");
        return;
      }

      if (!data.is_active) {
        toast.error(
          "Your account is inactive. Please contact administrator to activate your account.",
          {
            duration: 5000,
          },
        );
        return;
      }

      // If active and profile complete, navigate to prescription form
      router.push("/prescriptions/new/step1");
    } catch (error) {
      console.error("Error checking active status:", error);
      toast.error("Unable to verify account status");
    } finally {
      setCheckingActive(false);
    }
  };

  const handleViewDetails = async (prescription: Prescription) => {
    // Force refresh the prescription data from database
    const { data: freshData, error } = await supabase
      .from("prescriptions")
      .select(
        `
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
        profit_cents,
        shipping_fee_cents,
        total_paid_cents,
        status,
        payment_status,
        tracking_number,
        pdf_storage_path,
        patient:patients(first_name, last_name, date_of_birth)
      `,
      )
      .eq("id", prescription.id)
      .single();

    if (error) {
      console.error("❌ Error fetching fresh prescription data:", error);
      setSelectedPrescription(prescription);
    } else {
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
        profitCents: freshData.profit_cents,
        shippingFeeCents: freshData.shipping_fee_cents,
        totalPaidCents: freshData.total_paid_cents,
        paymentStatus: freshData.payment_status,
        pdfStoragePath: freshData.pdf_storage_path,
      };

      setSelectedPrescription(freshPrescription);
    }

    setIsDialogOpen(true);
  };

  const handleSubmitToPharmacy = async (prescriptionId: string) => {
    setIsSubmittingToPharmacy(true);
    try {
      const response = await fetch(
        `/api/prescriptions/${prescriptionId}/submit-to-pharmacy`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Check for invalid parameters error from DigitalRx
        if (
          data.error === "DigitalRx did not return a QueueID" &&
          data.details?.Error?.includes("Invalid Parameters")
        ) {
          toast.error("Invalid parameters, check pharmacy integration details");
        } else {
          toast.error(data.error || "Failed to submit to pharmacy");
        }
        return;
      }

      toast.success("Prescription submitted to pharmacy successfully");

      // Update the selected prescription status locally
      if (selectedPrescription) {
        setSelectedPrescription({
          ...selectedPrescription,
          status: "submitted",
          queueId: data.queue_id,
        });
      }

      // Reload prescriptions to reflect the change
      loadPrescriptions();
    } catch (error) {
      console.error("Error submitting to pharmacy:", error);
      toast.error("Failed to submit to pharmacy");
    } finally {
      setIsSubmittingToPharmacy(false);
    }
  };

  // Filter prescriptions based on active tab and search query
  const filteredPrescriptions = prescriptions.filter((rx) => {
    // Filter by tab
    const tabMatch =
      activeTab === "in-progress"
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
            <Button
              size="sm"
              className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white"
              onClick={handleCreatePrescription}
              disabled={checkingActive}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Prescription
            </Button>
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
                {prescriptions.filter(
                  (rx) => rx.status.toLowerCase() !== "delivered",
                ).length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                    {
                      prescriptions.filter(
                        (rx) => rx.status.toLowerCase() !== "delivered",
                      ).length
                    }
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
                {prescriptions.filter(
                  (rx) => rx.status.toLowerCase() === "delivered",
                ).length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                    {
                      prescriptions.filter(
                        (rx) => rx.status.toLowerCase() === "delivered",
                      ).length
                    }
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
              <Button
                onClick={handleCreatePrescription}
                disabled={checkingActive}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Prescription
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-white border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Date & Time</TableHead>
                    <TableHead className="font-semibold">
                      Patient Name
                    </TableHead>
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
                          <span
                            className="font-medium"
                            style={{
                              color: prescription.pharmacyColor || "#1E3A8A",
                            }}
                          >
                            {prescription.pharmacyName}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            Not specified
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant="outline"
                            className={`${getStatusColor(prescription.status)} text-xs px-2 py-1`}
                          >
                            {prescription.status.charAt(0).toUpperCase() +
                              prescription.status.slice(1)}
                          </Badge>
                          {prescription.queueId &&
                            prescription.queueId !== "N/A" && (
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

        {/* Print styles */}
        <style dangerouslySetInnerHTML={{ __html: printStyles }} />

        {/* AIM Official Receipt Modal */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto print:max-w-full">
            {selectedPrescription && (
              <div className="space-y-6 print-container" id="aim-receipt">
                {/* AIM Logo */}
                <div className="text-center pt-4">
                  <img
                    src="https://i.imgur.com/r65O4DB.png"
                    alt="AIM Medical Technologies"
                    className="h-[80px] mx-auto print-logo"
                  />
                </div>

                {/* Letterhead */}
                <div className="text-center text-sm text-gray-600 border-b pb-4 print-letterhead">
                  <p className="font-semibold text-gray-900">
                    AIM Medical Technologies
                  </p>
                  <p>106 E 6th St, Suite 900 · Austin, TX 78701</p>
                  <p>(512) 377-9898 · Mon–Fri 9AM–6PM CST</p>
                </div>

                {/* Success Checkmark & Headline */}
                <div className="text-center py-4 print-title">
                  <div
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 print-icon"
                    style={{ backgroundColor: "#00AEEF20" }}
                  >
                    <CheckCircle2
                      className="w-10 h-10"
                      style={{ color: "#00AEEF" }}
                    />
                  </div>
                  <h2
                    className="text-2xl font-bold"
                    style={{ color: "#00AEEF" }}
                  >
                    Order Successfully Submitted
                  </h2>
                </div>

                {/* Reference Information */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3 print-section print-ref">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 print-text">
                        Reference #
                      </p>
                      <p className="font-bold text-lg print-ref-title">
                        {selectedPrescription.queueId}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="print-hide"
                      onClick={() => {
                        // Fallback copy method that works in all browsers
                        const textarea = document.createElement("textarea");
                        textarea.value = selectedPrescription.queueId;
                        textarea.style.position = "fixed";
                        textarea.style.opacity = "0";
                        document.body.appendChild(textarea);
                        textarea.select();
                        try {
                          document.execCommand("copy");
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

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t print-grid-2">
                    <div>
                      <p className="text-sm text-gray-600 print-text">
                        Patient
                      </p>
                      <p className="font-medium print-text">
                        {selectedPrescription.patientName}
                      </p>
                      {selectedPrescription.patientDOB && (
                        <p className="text-sm text-gray-600 print-text-sm">
                          DOB:{" "}
                          {new Date(
                            selectedPrescription.patientDOB,
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 print-text">Date</p>
                      <p className="font-medium print-text">
                        {formatDateTime(selectedPrescription.dateTime)}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-600 print-text">
                      Prescribed by
                    </p>
                    <p className="font-medium print-text">
                      {selectedPrescription.doctorName || "Unknown Provider"}
                    </p>
                  </div>
                </div>

                {/* Production Status Box */}
                <div className="bg-gray-100 rounded-lg p-4 border border-gray-300 print-section print-production">
                  <div className="flex items-start gap-3">
                    <Clock
                      className="w-5 h-5 mt-0.5 flex-shrink-0 print-hide"
                      style={{ color: "#00AEEF" }}
                    />
                    <div className="space-y-2">
                      <h3 className="font-semibold text-gray-900">
                        In Production
                      </h3>
                      <p className="text-sm text-gray-900">
                        Your custom regenerative therapy is being freshly
                        compounded at AIM&apos;s lab.
                      </p>
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">
                          Typical preparation time:
                        </span>{" "}
                        5–10 business days
                      </p>
                      <p className="text-sm text-gray-900">
                        We will text or email you as soon as it&apos;s ready for
                        pickup or shipping.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Medications List */}
                <div className="space-y-3">
                  <h3
                    className="font-semibold text-lg print-details-title"
                    style={{ color: "#00AEEF" }}
                  >
                    Prescription Details
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3 print-section">
                    {/* Medication Name */}
                    <div className="grid grid-cols-2 gap-4 print-grid-2">
                      <div>
                        <p className="text-sm text-gray-600 font-medium print-text-sm">
                          Medication
                        </p>
                        <p className="text-base font-semibold text-gray-900 print-text">
                          {selectedPrescription.medication}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium print-text-sm">
                          Vial Size
                        </p>
                        <p className="text-base text-gray-900 print-text">
                          {selectedPrescription.vialSize || "5mL"}
                        </p>
                      </div>
                    </div>

                    {/* Dosage Information */}
                    <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-200 print-grid">
                      <div>
                        <p className="text-sm text-gray-600 font-medium print-text-sm">
                          Dosage Amount
                        </p>
                        <p className="text-base text-gray-900 print-text">
                          {selectedPrescription.dosageAmount ||
                            selectedPrescription.strength}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium print-text-sm">
                          Unit
                        </p>
                        <p className="text-base text-gray-900 print-text">
                          {selectedPrescription.dosageUnit || "mg"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium print-text-sm">
                          Form
                        </p>
                        <p className="text-base text-gray-900 print-text">
                          {selectedPrescription.form !== "N/A"
                            ? selectedPrescription.form
                            : "Injectable"}
                        </p>
                      </div>
                    </div>

                    {/* Quantity and Refills */}
                    <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-200 print-grid">
                      <div>
                        <p className="text-sm text-gray-600 font-medium print-text-sm">
                          Quantity
                        </p>
                        <p className="text-base text-gray-900 print-text">
                          {selectedPrescription.quantity}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium print-text-sm">
                          Refills
                        </p>
                        <p className="text-base text-gray-900 print-text">
                          {selectedPrescription.refills}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium print-text-sm">
                          DAW
                        </p>
                        <p className="text-base text-gray-900 print-text">
                          {selectedPrescription.dispenseAsWritten
                            ? "Yes"
                            : "No"}
                        </p>
                      </div>
                    </div>

                    {/* SIG - How to Use */}
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600 font-medium print-text-sm">
                        How to Use This Medication (Patient Directions)
                      </p>
                      <p className="text-base text-gray-900 mt-1 leading-relaxed print-text">
                        {selectedPrescription.sig ||
                          "Inject 0.5mL subcutaneously once daily in the evening. Rotate injection sites between abdomen, thigh, and upper arm. Store in refrigerator between 36-46°F. Allow to reach room temperature before injection. Dispose of used syringes in approved sharps container."}
                      </p>
                    </div>

                    {/* Pricing Breakdown */}
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600 font-medium mb-2 print-text-sm">
                        Pricing
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 print-text-sm">
                            Medication Price:
                          </span>
                          <span className="text-sm font-semibold text-gray-900 print-text-sm">
                            $
                            {selectedPrescription.totalPaidCents
                              ? (
                                  selectedPrescription.totalPaidCents / 100
                                ).toFixed(2)
                              : selectedPrescription.patientPrice || "299.00"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 print-text-sm">
                            Shipping Fee:
                          </span>
                          <span className="text-sm font-semibold text-gray-900 print-text-sm">
                            $
                            {selectedPrescription.shippingFeeCents
                              ? (
                                  selectedPrescription.shippingFeeCents / 100
                                ).toFixed(2)
                              : "0.00"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 print-text-sm">
                            Provider Oversight Fees:
                          </span>
                          <span className="text-sm font-semibold text-gray-900 print-text-sm">
                            $
                            {selectedPrescription.profitCents
                              ? (
                                  selectedPrescription.profitCents / 100
                                ).toFixed(2)
                              : "0.00"}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-300">
                          <span className="text-base font-semibold text-gray-900 print-text">
                            Total:
                          </span>
                          <span className="text-xl font-bold text-gray-900 print-text">
                            $
                            {(() => {
                              const medicationPrice =
                                selectedPrescription.totalPaidCents
                                  ? selectedPrescription.totalPaidCents / 100
                                  : parseFloat(
                                      selectedPrescription.patientPrice ||
                                        "299.00",
                                    );
                              const providerFees =
                                selectedPrescription.profitCents
                                  ? selectedPrescription.profitCents / 100
                                  : 0;
                              const shippingFee =
                                selectedPrescription.shippingFeeCents
                                  ? selectedPrescription.shippingFeeCents / 100
                                  : 0;
                              return (medicationPrice + providerFees + shippingFee).toFixed(
                                2,
                              );
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes from Pharmacy - Always show */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 print-section print-notes">
                  <p className="font-semibold text-sm text-gray-700 mb-2 print-text">
                    📋 Important Notes from AIM Pharmacy:
                  </p>
                  <div className="text-sm text-gray-900 space-y-1">
                    {(
                      selectedPrescription.pharmacyNotes ||
                      "• Keep refrigerated at 36-46°F until use\n• This medication requires proper injection technique - review instructions with your provider\n• Report any unusual side effects to your doctor immediately\n• Do not share needles or medication with others\n• Dispose of used supplies in an approved sharps container"
                    )
                      .split("\n")
                      .map((line, index) => (
                        <p
                          key={index}
                          className="leading-relaxed print-text-sm"
                        >
                          {line}
                        </p>
                      ))}
                  </div>
                </div>

                {/* Fulfillment Box */}
                <div
                  className="border-2 rounded-lg p-4 space-y-3 print-section print-pickup"
                  style={{ borderColor: "#00AEEF" }}
                >
                  <div className="flex items-start gap-2">
                    <MapPin
                      className="w-5 h-5 mt-0.5 print-hide"
                      style={{ color: "#00AEEF" }}
                    />
                    <div>
                      <h3
                        className="font-semibold text-lg mb-2"
                        style={{ color: "#00AEEF" }}
                      >
                        Pickup Location
                      </h3>
                      <p className="font-semibold text-gray-900 print-text">
                        AIM Medical Technologies
                      </p>
                      <a
                        href="https://maps.google.com/?q=106+E+6th+St+Suite+900+Austin+TX+78701"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:underline inline-block mt-1 print-text-sm"
                        style={{ color: "#00AEEF" }}
                      >
                        106 E 6th St, Suite 900, Austin, TX 78701 →
                      </a>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 space-y-3 print-hide">
                  {/* Bill Patient Button - varies based on payment_status */}
                  {selectedPrescription.paymentStatus === "paid" ? (
                    <>
                      <Button
                        disabled
                        className="w-full text-lg py-6 bg-green-600 cursor-not-allowed opacity-70"
                      >
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        Payment Received
                      </Button>
                      {/* Manual Submit to Pharmacy button - shows when paid but not yet submitted */}
                      {selectedPrescription.status === "payment_received" && (
                        <Button
                          onClick={() =>
                            handleSubmitToPharmacy(selectedPrescription.id)
                          }
                          disabled={isSubmittingToPharmacy}
                          className="w-full text-lg py-6 bg-blue-600 hover:bg-blue-700"
                        >
                          {isSubmittingToPharmacy ? (
                            <>
                              <span className="animate-spin mr-2">⏳</span>
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Pill className="h-5 w-5 mr-2" />
                              Submit to Pharmacy
                            </>
                          )}
                        </Button>
                      )}
                    </>
                  ) :  (
                    <Button
                      onClick={() => {
                        setIsBillModalOpen(true);
                      }}
                      className="w-full text-lg py-6 bg-green-600 hover:bg-green-700"
                    >
                      <DollarSign className="h-5 w-5 mr-2" />
                      Bill Patient
                    </Button>
                  )}

                  {/* View PDF Button - only show if PDF is attached */}
                  {selectedPrescription.pdfStoragePath && (
                    <Button
                      onClick={async () => {
                        try {
                          const response = await fetch(`/api/prescriptions/${selectedPrescription.id}/pdf`);
                          const data = await response.json();
                          if (data.success && data.url) {
                            window.open(data.url, "_blank");
                          } else {
                            toast.error("Failed to load PDF");
                          }
                        } catch {
                          toast.error("Failed to load PDF");
                        }
                      }}
                      variant="outline"
                      className="w-full text-lg py-6 border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      <FileText className="h-5 w-5 mr-2" />
                      View Prescription PDF
                    </Button>
                  )}

                  <Button
                    onClick={() => printReceipt()}
                    className="w-full text-lg py-6"
                    style={{ backgroundColor: "#00AEEF" }}
                  >
                    <Printer className="h-5 w-5 mr-2" />
                    Print Receipt
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Bill Patient Modal */}
        {selectedPrescription && (
          <BillPatientModal
            isOpen={isBillModalOpen}
            onClose={() => setIsBillModalOpen(false)}
            prescriptionId={selectedPrescription.id}
            patientName={selectedPrescription.patientName}
            patientEmail={selectedPrescription.patientEmail}
            medication={selectedPrescription.medication}
            medicationCostCents={selectedPrescription.totalPaidCents}
            profitCents={selectedPrescription.profitCents}
            shippingFeeCents={selectedPrescription.shippingFeeCents}
            paymentStatus={selectedPrescription.paymentStatus}
          />
        )}

        {/* Complete Profile Modal */}
        <CompleteProfileModal
          open={showCompleteProfileModal}
          onOpenChange={setShowCompleteProfileModal}
          missingFields={missingProfileFields}
        />
      </div>
    </DefaultLayout>
  );
}
