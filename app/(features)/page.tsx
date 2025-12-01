"use client";

import React from "react";
import { useUser } from "@core/auth";
import { ProviderDashboard } from "@/features/provider-dashboard";
import { PatientDashboard } from "@/features/patient-dashboard";
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

  // Show patient dashboard for patients and general users
  if (user && userRole !== "provider" && userRole !== "admin") {
    return (
      <DefaultLayout>
        <PatientDashboard />
      </DefaultLayout>
    );
  }

  // Default homepage for other users
  return (
    <DefaultLayout>
      <div className="container mx-auto flex flex-col items-center justify-center px-4 py-16 max-w-5xl">
        <div className="mx-auto text-center pt-16">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Complete Telehealth Platform
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Streamlined healthcare delivery with integrated EMR, scheduling,{" "}
            <br />
            billing, and prescriptions. Built with Next.js 15, TypeScript,
            Tailwind CSS,
            <br /> Shadcn UI, and Supabase
          </p>
          <div className="mt-8 flex justify-center gap-4 ">
            <Link href="/auth/login">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
