/**
 * Admin Dashboard Page
 *
 * Redirects to prescriptions queue for all admin users.
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect all admin users to prescriptions queue
    router.replace("/admin/prescriptions");
  }, [router]);

  return null;
}
