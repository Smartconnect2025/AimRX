"use client";

/**
 * Order Review Header Component
 * 
 * Displays order header information with breadcrumbs and order details
 */

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { OrderReviewData } from "../types";
import { formatDateTime } from "../utils";

interface OrderReviewHeaderProps {
  order: OrderReviewData;
}

export function OrderReviewHeader({ order }: OrderReviewHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    router.push("/provider/orders");
  };

  return (
    <div className="mb-8">
      {/* Back Button */}
      <div className="pt-4 pb-6">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Breadcrumbs */}
      <Breadcrumb className="mb-4">
        <BreadcrumbList className="text-base">
          <BreadcrumbItem>
            <BreadcrumbLink href="/provider">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/provider/orders">Review Orders</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Order #{order.id} Review</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Order Title and Details */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Review Order #{order.id}</h1>
        
        <div className="text-gray-600 space-y-1">
          <p>
            <strong>Date:</strong> {formatDateTime(order.created_at)}
          </p>
          <p>
            <strong>Patient:</strong> {order.shipping_address.first_name} {order.shipping_address.last_name}
          </p>
          <p>
            <strong>Email:</strong> {order.user_email}
          </p>
        </div>
      </div>
    </div>
  );
} 