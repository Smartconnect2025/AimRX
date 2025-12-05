"use client";

import React from "react";
import { useUser } from "@core/auth";
import { ProviderDashboard } from "@/features/provider-dashboard";
import { AdminDashboard } from "@/features/admin-dashboard";

import DefaultLayout from "@/components/layout/DefaultLayout";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  const { user, userRole } = useUser();

  // Show admin dashboard for admins
  if (userRole === "admin") {
    return (
      <DefaultLayout>
        <AdminDashboard />
      </DefaultLayout>
    );
  }

  // Show provider dashboard for providers
  if (userRole === "provider") {
    return (
      <DefaultLayout>
        <ProviderDashboard />
      </DefaultLayout>
    );
  }

  // Redirect authenticated users to provider login
  if (user) {
    return (
      <DefaultLayout>
        <div className="container mx-auto flex flex-col items-center justify-center px-4 py-16 max-w-5xl">
          <div className="mx-auto text-center pt-16">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              AIM Prescriber Portal
            </h1>
            <p className="mt-6 text-xl leading-8 text-muted-foreground">
              Seamless ordering of peptides, PRP/PRF, stem-cell therapies & regenerative medicine
            </p>
            <ul className="mt-8 space-y-3 text-base text-muted-foreground max-w-2xl mx-auto">
              <li>• Instant submission to AIM&apos;s secure fulfillment queue</li>
              <li>• Real-time status updates for you and your patients</li>
              <li>• HIPAA-compliant platform – exclusively for AIM providers</li>
            </ul>
            <div className="mt-10 flex justify-center gap-4">
              <Link href="/auth/login">
                <Button size="lg" className="text-lg px-8 py-6">
                  Provider Login / Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  // Default landing page for non-authenticated users
  return (
    <DefaultLayout>
      <div className="container mx-auto flex flex-col items-center justify-center px-4 py-16 max-w-5xl">
        <div className="mx-auto text-center pt-16">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            AIM Prescriber Portal
          </h1>
          <p className="mt-6 text-xl leading-8 text-muted-foreground">
            Seamless ordering of peptides, PRP/PRF, stem-cell therapies & regenerative medicine
          </p>
          <ul className="mt-8 space-y-3 text-base text-muted-foreground max-w-2xl mx-auto">
            <li>• Instant submission to AIM&apos;s secure fulfillment queue</li>
            <li>• Real-time status updates for you and your patients</li>
            <li>• HIPAA-compliant platform – exclusively for AIM providers</li>
          </ul>
          <div className="mt-10 flex justify-center gap-4">
            <Link href="/auth/login">
              <Button size="lg" className="text-lg px-8 py-6">
                Provider Login / Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
