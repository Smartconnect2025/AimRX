"use client";

import CheckoutSuccess from "@/features/checkout/components/CheckoutSuccess";
import { Suspense } from "react";

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <CheckoutSuccess />
    </Suspense>
  );
}
