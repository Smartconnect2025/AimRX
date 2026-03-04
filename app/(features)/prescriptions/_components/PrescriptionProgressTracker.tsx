"use client";

import { useEffect, useState } from "react";
import {
  ClipboardCheck,
  CreditCard,
  FlaskConical,
  Truck,
  PackageCheck,
  ExternalLink,
  Check,
} from "lucide-react";

interface PrescriptionProgressTrackerProps {
  status: string;
  trackingNumber?: string;
  pharmacyName?: string;
}

const STEPS = [
  {
    key: "submitted",
    label: "Submitted",
    description: "Order placed",
    icon: ClipboardCheck,
  },
  {
    key: "billing",
    label: "Billing",
    description: "Payment",
    icon: CreditCard,
  },
  {
    key: "processing",
    label: "Processing",
    description: "Compounding",
    icon: FlaskConical,
  },
  {
    key: "shipped",
    label: "Shipped",
    description: "In transit",
    icon: Truck,
  },
  {
    key: "delivered",
    label: "Delivered",
    description: "Received",
    icon: PackageCheck,
  },
];

function getStepIndex(status: string): number {
  const normalized = status.trim().toLowerCase().replace(/[\s_-]/g, "");
  if (normalized === "delivered" || normalized === "completed") return 4;
  if (normalized === "shipped" || normalized === "pickedup") return 3;
  if (
    normalized === "processing" ||
    normalized === "pharmacyprocessing" ||
    normalized === "compounding" ||
    normalized === "approved" ||
    normalized === "packed"
  )
    return 2;
  if (
    normalized === "billing" ||
    normalized === "paymentpending" ||
    normalized === "pendingpayment" ||
    normalized === "paymentreceived"
  )
    return 1;
  return 0;
}

export function PrescriptionProgressTracker({
  status,
  trackingNumber,
  pharmacyName,
}: PrescriptionProgressTrackerProps) {
  const currentStepIndex = getStepIndex(status);
  const [mounted, setMounted] = useState(false);

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
        {pharmacyName && (
          <span className="text-xs text-muted-foreground bg-gray-100 px-2.5 py-0.5 rounded-full">
            {pharmacyName}
          </span>
        )}
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
                        background: "rgba(30, 58, 138, 0.15)",
                        animationDuration: "2s",
                      }}
                    />
                  )}
                  <div
                    className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                      isCompleted
                        ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-200/60"
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
                  {step.description}
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
