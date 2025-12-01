"use client";

import React from "react";
import { CategoriesTable } from "./CategoriesTable";

export function CategoriesManagement() {
  return (
    <div className="container max-w-5xl mx-auto py-6 px-4 space-y-6">
      <CategoriesTable />
    </div>
  );
}
