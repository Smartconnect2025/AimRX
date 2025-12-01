"use client";

import React from "react";
import { ProductsTable } from "./ProductsTable";

export function ProductsManagement() {
  return (
    <div className="container max-w-5xl mx-auto py-6 px-4 space-y-6">
      <ProductsTable />
    </div>
  );
}
