"use client";

import type { CartSummaryProps } from "../types";
import { BILLING_INFO } from "../constants";

export function CartSummary({ subtotal }: CartSummaryProps) {
  return (
    <div className="space-y-4 text-sm border-t border-slate-200 pt-4">
      {/* Total */}
      <div className="flex justify-between py-4">
        <span className="font-medium text-slate-500">Total</span>
        <span className="font-medium text-slate-900">{subtotal}</span>
      </div>

      {/* Cancellation Policy */}
      <div className="text-xs text-slate-500">
        {BILLING_INFO.CANCELLATION_POLICY}
      </div>
    </div>
  );
}
