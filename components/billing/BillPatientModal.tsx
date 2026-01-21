"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, DollarSign, Copy, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface BillPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescriptionId: string;
  patientName: string;
  patientEmail?: string;
  medication: string;
  medicationCostCents?: number;
  profitCents?: number;
  paymentStatus?: string;
}

export function BillPatientModal({
  isOpen,
  onClose,
  prescriptionId,
  patientName,
  patientEmail: initialPatientEmail,
  medication,
  medicationCostCents = 0,
  profitCents = 0,
  paymentStatus,
}: BillPatientModalProps) {
  const [consultationFeeDollars, setConsultationFeeDollars] = useState(
    profitCents > 0 ? (profitCents / 100).toFixed(2) : ""
  );
  const [medicationCostDollars, setMedicationCostDollars] = useState(
    medicationCostCents > 0 ? (medicationCostCents / 100).toFixed(2) : ""
  );
  const [description, setDescription] = useState(
    `Payment for ${medication} prescription`
  );
  const [patientEmail, setPatientEmail] = useState(initialPatientEmail || "");
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [isExistingLink, setIsExistingLink] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [autoFetchLoading, setAutoFetchLoading] = useState(false);

  // Auto-fetch existing payment link when modal opens with pending status
  useEffect(() => {
    if (isOpen && paymentStatus === "pending" && !paymentUrl) {
      console.log("[BillPatientModal] Auto-fetching existing payment link...");
      fetchExistingPaymentLink();
    }
  }, [isOpen, paymentStatus]);

  const fetchExistingPaymentLink = async () => {
    try {
      setAutoFetchLoading(true);

      const requestBody = {
        prescriptionId,
        consultationFeeCents: Math.round((parseFloat(consultationFeeDollars) || 0) * 100),
        medicationCostCents: Math.round((parseFloat(medicationCostDollars) || 0) * 100),
        description,
        patientEmail,
        sendEmail: false, // Don't auto-send email on fetch
      };

      console.log("[BillPatientModal] Fetching existing link for prescription:", prescriptionId);

      const response = await fetch("/api/payments/generate-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      console.log("[BillPatientModal] Auto-fetch response:", {
        ok: response.ok,
        success: data.success,
        existing: data.existing,
        expiresAt: data.expiresAt,
      });

      if (response.ok && data.success) {
        setPaymentUrl(data.paymentUrl);
        setIsExistingLink(data.existing || false);
        setExpiresAt(data.expiresAt || null);

        // Update amounts from existing transaction if available
        if (data.existing) {
          console.log("[BillPatientModal] Loaded existing payment link");
        }
      }
    } catch (error) {
      console.log("[BillPatientModal] Auto-fetch error:", error);
    } finally {
      setAutoFetchLoading(false);
    }
  };

  const calculateTotal = () => {
    const consultationFee = parseFloat(consultationFeeDollars) || 0;
    const medicationCost = parseFloat(medicationCostDollars) || 0;
    return (consultationFee + medicationCost).toFixed(2);
  };

  const handleGeneratePaymentLink = async () => {
    console.log("[BillPatientModal] Starting payment link generation...");

    // Validate inputs
    const consultationFee = parseFloat(consultationFeeDollars);
    const medicationCost = parseFloat(medicationCostDollars);

    console.log("[BillPatientModal] Validating inputs:", {
      consultationFee,
      medicationCost,
      patientEmail,
      prescriptionId,
    });

    if (isNaN(consultationFee) || consultationFee < 0) {
      console.log("[BillPatientModal] ERROR: Invalid consultation fee");
      toast.error("Please enter a valid consultation fee");
      return;
    }

    if (isNaN(medicationCost) || medicationCost < 0) {
      console.log("[BillPatientModal] ERROR: Invalid medication cost");
      toast.error("Please enter a valid medication cost");
      return;
    }

    if (consultationFee === 0 && medicationCost === 0) {
      console.log("[BillPatientModal] ERROR: Total is zero");
      toast.error("Total amount must be greater than $0.00");
      return;
    }

    if (!patientEmail || !patientEmail.includes("@")) {
      console.log("[BillPatientModal] ERROR: Invalid email");
      toast.error("Please enter a valid patient email address");
      return;
    }

    try {
      setLoading(true);

      const requestBody = {
        prescriptionId,
        consultationFeeCents: Math.round(consultationFee * 100),
        medicationCostCents: Math.round(medicationCost * 100),
        description,
        patientEmail,
        sendEmail: true,
      };

      console.log("[BillPatientModal] Calling generate-link API:", requestBody);

      const response = await fetch("/api/payments/generate-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      console.log("[BillPatientModal] API response:", {
        ok: response.ok,
        success: data.success,
        existing: data.existing,
        paymentUrl: data.paymentUrl,
        emailSent: data.emailSent,
        error: data.error,
      });

      if (response.ok && data.success) {
        setPaymentUrl(data.paymentUrl);
        setEmailSent(data.emailSent || false);
        setIsExistingLink(data.existing || false);
        setExpiresAt(data.expiresAt || null);

        if (data.existing) {
          // Existing payment link was found and resent
          console.log("[BillPatientModal] INFO: Existing payment link found and resent");
          toast.info("Payment link already exists for this prescription", {
            icon: <AlertCircle className="h-5 w-5" />,
            description: data.emailSent
              ? `Email resent to ${patientEmail}`
              : "Use the existing link below",
          });
        } else if (data.emailSent) {
          console.log("[BillPatientModal] SUCCESS: Payment link sent via email");
          toast.success("Payment link sent to patient's email!", {
            icon: <CheckCircle2 className="h-5 w-5" />,
            description: `Email sent to ${patientEmail}`,
          });
        } else {
          console.log("[BillPatientModal] SUCCESS: Payment link generated (email not sent)");
          toast.success("Payment link generated successfully!", {
            icon: <CheckCircle2 className="h-5 w-5" />,
            description: "Copy the link below to send to patient",
          });
        }
      } else {
        console.log("[BillPatientModal] ERROR:", data.error);
        toast.error(data.error || "Failed to generate payment link");
      }
    } catch (error) {
      console.log("[BillPatientModal] FETCH ERROR:", error);
      toast.error("Failed to generate payment link");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!paymentUrl) return;

    const textarea = document.createElement("textarea");
    textarea.value = paymentUrl;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      toast.success("Payment link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
    document.body.removeChild(textarea);
  };

  const handleClose = () => {
    // Reset state
    setPaymentUrl(null);
    setConsultationFeeDollars(profitCents > 0 ? (profitCents / 100).toFixed(2) : "");
    setMedicationCostDollars(medicationCostCents > 0 ? (medicationCostCents / 100).toFixed(2) : "");
    setDescription(`Payment for ${medication} prescription`);
    setIsExistingLink(false);
    setExpiresAt(null);
    setEmailSent(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Bill Patient</DialogTitle>
          <DialogDescription>
            Generate a secure payment link for {patientName}
          </DialogDescription>
        </DialogHeader>

        {autoFetchLoading ? (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading payment information...</p>
            </div>
          </div>
        ) : !paymentUrl ? (
          <div className="space-y-6 py-4">
            {/* Patient and Medication Info - Form View */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Patient:</span>
                <span className="font-medium">{patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Medication:</span>
                <span className="font-medium">{medication}</span>
              </div>
            </div>

            {/* Patient Email */}
            <div className="space-y-2">
              <Label htmlFor="patientEmail">
                Patient Email Address
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="patientEmail"
                type="email"
                placeholder="patient@example.com"
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Payment link will be sent to this email automatically
              </p>
            </div>

            {/* Consultation Fee */}
            <div className="space-y-2">
              <Label htmlFor="consultationFee">
                Consultation Fee
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="consultationFee"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={consultationFeeDollars}
                  onChange={(e) => setConsultationFeeDollars(e.target.value)}
                  className="pl-9"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Provider oversight fees for this prescription
              </p>
            </div>

            {/* Medication Cost */}
            <div className="space-y-2">
              <Label htmlFor="medicationCost">
                Medication Cost
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="medicationCost"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={medicationCostDollars}
                  onChange={(e) => setMedicationCostDollars(e.target.value)}
                  className="pl-9"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Cost of medication and pharmacy processing
              </p>
            </div>

            {/* Total Amount */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                <span className="text-2xl font-bold text-blue-600">
                  ${calculateTotal()}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Payment description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
              <p className="text-sm text-muted-foreground">
                This will appear on the payment form and receipt
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGeneratePaymentLink}
                className="flex-1 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Payment Link"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Success Message - Different styling for existing vs new links */}
            <div className="text-center py-4">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                isExistingLink ? "bg-yellow-100" : "bg-green-100"
              }`}>
                {isExistingLink ? (
                  <AlertCircle className="w-10 h-10 text-yellow-600" />
                ) : (
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {isExistingLink
                  ? "Existing Payment Link"
                  : emailSent
                    ? "Payment Link Sent!"
                    : "Payment Link Generated!"}
              </h3>
              <p className="text-gray-600">
                {isExistingLink
                  ? emailSent
                    ? `A payment link already exists. Email resent to ${patientEmail}`
                    : `A payment link was previously generated for this prescription`
                  : emailSent
                    ? `Payment link sent to ${patientEmail}`
                    : `Send this secure link to ${patientName} to complete payment`}
              </p>
            </div>

            {/* Existing Link Warning Banner */}
            {isExistingLink && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">This is an existing payment link</p>
                    <p>
                      A payment link was already generated for this prescription.
                      The amounts shown below are from the original link and cannot be changed.
                      {emailSent && " The patient has been notified again via email."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Amount:</span>
                <span className="text-lg font-bold text-gray-900">${calculateTotal()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Consultation Fee:</span>
                <span className="font-medium">${consultationFeeDollars}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Medication Cost:</span>
                <span className="font-medium">${medicationCostDollars}</span>
              </div>
            </div>

            {/* Payment URL */}
            <div className="space-y-2">
              <Label>Payment Link</Label>
              <div className="flex gap-2">
                <Input
                  value={paymentUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {expiresAt ? (
                  <span>
                    Link expires on {new Date(expiresAt).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                ) : (
                  <span>Link expires in 7 days</span>
                )}
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Next Steps:</h4>
              <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                <li>Copy and send this link to {patientName} via email or text</li>
                <li>Patient clicks the link and completes payment</li>
                <li>You&apos;ll be notified when payment is received</li>
                <li>Order automatically progresses to pharmacy processing</li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {isExistingLink && !emailSent && (
                <Button
                  onClick={handleGeneratePaymentLink}
                  variant="outline"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Resend Email to Patient"
                  )}
                </Button>
              )}
              <Button
                onClick={handleClose}
                className={`${isExistingLink && !emailSent ? "flex-1" : "w-full"} bg-[#1E3A8A] hover:bg-[#1E3A8A]/90`}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
