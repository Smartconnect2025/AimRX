"use client";

import { CustomerPortalButton } from "@/features/stripe/components/CustomerPortalButton";

export function SubscriptionManagementSection() {
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold">Subscription Management</h2>
      </div>
      <div className="flex items-center justify-start p-6">
        <CustomerPortalButton variant="default" size="default">
          Open Customer Portal
        </CustomerPortalButton>
      </div>
    </div>
  );
}
