"use client";

import { useEffect, useState } from "react";
import {
  ClipboardCheck,
  Package,
  ShieldCheck,
  Truck,
  PackageCheck,
  ExternalLink,
  Check,
  DollarSign,
  CreditCard,
} from "lucide-react";

interface PrescriptionProgressTrackerProps {
  status: string;
  trackingNumber?: string;
  pharmacyName?: string;
  billingStatus?: string;
  patientCopay?: string;
}

const STEPS = [
  {
    key: "submitted",
    label: "Submitted",
    description: "Order placed",
    icon: ClipboardCheck,
  },
  {
    key: "payment",
    label: "Payment",
    description: "Awaiting payment",
    icon: CreditCard,
  },
  {
    key: "packed",
    label: "Packed",
    description: "Rx filled",
    icon: Package,
  },
  {
    key: "approved",
    label: "Approved",
    description: "Pharmacist OK",
    icon: ShieldCheck,
  },
  {
    key: "picked_up",
    label: "Picked Up",
    description: "With carrier",
    icon: Truck,
  },
  {
    key: "delivered",
    label: "Delivered",
    description: "Received",
    icon: PackageCheck,
  },
];

function getStepIndex(status: string, billingStatus?: string): number {
  const normalized = status.trim().toLowerCase().replace(/[\s_-]/g, "");
  const billing = billingStatus?.trim().toLowerCase() || "";

  if (normalized === "delivered" || normalized === "completed") return 5;
  if (normalized === "shipped" || normalized === "pickedup") return 4;
  if (normalized === "approved" || normalized === "providerapproved") return 3;
  if (
    normalized === "packed" ||
    normalized === "processing" ||
    normalized === "pharmacyprocessing" ||
    normalized === "compounding"
  )
    return 2;

  if (
    normalized === "paymentreceived" ||
    normalized === "billed" ||
    billing === "paid" ||
    billing === "billed" ||
    billing === "cash"
  )
    return 2;

  if (
    normalized === "billing" ||
    normalized === "paymentpending" ||
    normalized === "pendingpayment" ||
    billing === "pending"
  )
    return 1;

  return 0;
}

function getPaymentStepState(
  stepIndex: number,
  billingStatus?: string,
  status?: string,
): "pending" | "paid" | "future" {
  const billing = billingStatus?.trim().toLowerCase() || "";
  const s = status?.trim().toLowerCase().replace(/[\s_-]/g, "") || "";

  if (stepIndex > 1) return "paid";

  if (
    billing === "paid" ||
    billing === "billed" ||
    billing === "cash" ||
    s === "paymentreceived" ||
    s === "billed"
  )
    return "paid";

  if (
    billing === "pending" ||
    s === "billing" ||
    s === "paymentpending" ||
    s === "pendingpayment"
  )
    return "pending";

  if (stepIndex >= 1) return "pending";

  return "future";
}

function formatCopay(copay?: string): string {
  if (!copay) return "";
  const num = parseFloat(copay);
  if (isNaN(num)) return copay;
  return num.toFixed(2);
}

function getPaymentLabel(
  billingStatus?: string,
  patientCopay?: string,
  status?: string,
): { label: string; color: string } | null {
  const s = status?.trim().toLowerCase().replace(/[\s_-]/g, "") || "";
  const formattedCopay = formatCopay(patientCopay);

  if (billingStatus) {
    const bs = billingStatus.toLowerCase();
    if (bs === "billed" || bs === "paid" || bs === "cash") {
      return {
        label: formattedCopay ? `Paid · $${formattedCopay}` : "Payment Confirmed",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    }
    if (bs === "pending") {
      return {
        label: formattedCopay ? `Due · $${formattedCopay}` : "Payment Pending",
        color: "bg-amber-50 text-amber-700 border-amber-200",
      };
    }
  }

  if (s === "paymentreceived" || s === "billed") {
    return {
      label: formattedCopay ? `Paid · $${formattedCopay}` : "Payment Confirmed",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  }
  if (s === "pendingpayment" || s === "paymentpending" || s === "billing") {
    return {
      label: formattedCopay ? `Due · $${formattedCopay}` : "Payment Pending",
      color: "bg-amber-50 text-amber-700 border-amber-200",
    };
  }

  return null;
}

export function PrescriptionProgressTracker({
  status,
  trackingNumber,
  pharmacyName,
  billingStatus,
  patientCopay,
}: PrescriptionProgressTrackerProps) {
  const currentStepIndex = getStepIndex(status, billingStatus);
  const [mounted, setMounted] = useState(false);
  const paymentInfo = getPaymentLabel(billingStatus, patientCopay, status);
  const paymentState = getPaymentStepState(currentStepIndex, billingStatus, status);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const progressPercent = mounted
    ? Math.min(100, (currentStepIndex / (STEPS.length - 1)) * 100)
    : 0;

  return (
    <div
      className="bg-gradient-to-br from-white to-slate-50 border border-gray-200 rounded-xl p-5 space-y-5"
      data-testid="prescription-progress-tracker"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-gray-900 tracking-tight">
          Order Progress
        </h3>
        <div className="flex items-center gap-2">
          {paymentInfo && (
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${paymentInfo.color}`}
              data-testid="badge-payment-status"
            >
              <DollarSign className="w-3 h-3" />
              {paymentInfo.label}
            </span>
          )}
          {pharmacyName && (
            <span className="text-xs text-muted-foreground bg-gray-100 px-2.5 py-0.5 rounded-full">
              {pharmacyName}
            </span>
          )}
        </div>
      </div>

      <div className="relative pt-1 pb-1">
        <div
          className="absolute h-[2px] bg-gray-200 rounded-full"
          style={{
            top: "20px",
            left: `${100 / (STEPS.length * 2)}%`,
            right: `${100 / (STEPS.length * 2)}%`,
          }}
        >
          <div
            className="h-full rounded-full transition-all ease-out"
            style={{
              width: `${progressPercent}%`,
              background: "linear-gradient(90deg, #10B981, #059669)",
              transitionDuration: mounted ? "1000ms" : "0ms",
            }}
          />
        </div>

        <div className="relative flex justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isFuture = index > currentStepIndex;

            const isPaymentStep = step.key === "payment";
            const isPaymentPending = isPaymentStep && paymentState === "pending" && isCurrent;

            let description = step.description;
            if (isPaymentStep) {
              if (paymentState === "paid") description = "Payment received";
              else if (paymentState === "pending") description = "Awaiting payment";
              else description = "Payment required";
            }

            return (
              <div
                key={step.key}
                className="flex flex-col items-center"
                style={{
                  width: `${100 / STEPS.length}%`,
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateY(0)" : "translateY(6px)",
                  transition: `opacity 350ms ease ${index * 80}ms, transform 350ms ease ${index * 80}ms`,
                }}
                data-testid={`step-${step.key}`}
              >
                <div className="relative">
                  {isCurrent && currentStepIndex < STEPS.length - 1 && (
                    <span
                      className="absolute inset-0 rounded-full animate-ping motion-reduce:animate-none"
                      style={{
                        background: isPaymentPending
                          ? "rgba(245, 158, 11, 0.15)"
                          : "rgba(30, 58, 138, 0.15)",
                        animationDuration: "2s",
                      }}
                    />
                  )}
                  <div
                    className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                      isCompleted
                        ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-200/60"
                        : isPaymentPending
                          ? "bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-lg shadow-amber-300/50 ring-[3px] ring-amber-100"
                          : isCurrent
                            ? "bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] text-white shadow-lg shadow-blue-300/50 ring-[3px] ring-blue-100"
                            : "bg-gray-100 text-gray-400 border border-gray-200"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" strokeWidth={2.5} />
                    ) : (
                      <Icon className="w-[18px] h-[18px]" />
                    )}
                  </div>
                </div>

                <p
                  className={`mt-2 text-[11px] font-semibold text-center leading-tight ${
                    isCompleted
                      ? "text-emerald-600"
                      : isPaymentPending
                        ? "text-amber-600"
                        : isCurrent
                          ? "text-[#1E3A8A]"
                          : "text-gray-400"
                  }`}
                >
                  {step.label}
                </p>
                <p
                  className={`text-[9px] text-center leading-tight mt-0.5 hidden sm:block ${
                    isFuture ? "text-gray-300" : "text-gray-500"
                  }`}
                >
                  {description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {trackingNumber && (
        <div className="flex items-center justify-between bg-blue-50/80 border border-blue-100 rounded-lg px-4 py-2.5">
          <div>
            <p className="text-[10px] font-medium text-blue-500 uppercase tracking-wider">
              Tracking Number
            </p>
            <p className="text-sm font-mono font-semibold text-[#1E3A8A]">
              {trackingNumber}
            </p>
          </div>
          <a
            href={`https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(trackingNumber)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-white bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 px-3 py-1.5 rounded-md transition-colors"
            data-testid="link-track-shipment"
          >
            Track
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}
