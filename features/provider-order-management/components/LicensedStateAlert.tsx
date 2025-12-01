/**
 * LicensedStateAlert Component
 * 
 * Alert component showing provider's licensed state information.
 */

"use client";

import * as React from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { LicensedStateAlertProps } from "../types";

export function LicensedStateAlert({ licenseInfo, hasError = false }: LicensedStateAlertProps) {
  // Don't render if no license info
  if (!licenseInfo.licensedState || !licenseInfo.fullStateName) {
    return null;
  }

  if (hasError) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You can only view orders from {licenseInfo.fullStateName} ({licenseInfo.licensedState}), 
          where you are licensed to practice.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="mb-4 border-blue-200 bg-blue-50">
      <AlertTitle className="text-blue-900">Licensed State</AlertTitle>
      <AlertDescription className="text-blue-800">
        You are only viewing orders from {licenseInfo.fullStateName} ({licenseInfo.licensedState}), 
        where you are licensed to practice.
      </AlertDescription>
    </Alert>
  );
} 