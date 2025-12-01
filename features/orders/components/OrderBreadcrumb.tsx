"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface OrderBreadcrumbProps {
  orderId: string;
}

export function OrderBreadcrumb({ orderId }: OrderBreadcrumbProps) {
  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList className="text-base">
        <BreadcrumbItem>
          <BreadcrumbLink href="/orders">Orders</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Order #{orderId}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
} 