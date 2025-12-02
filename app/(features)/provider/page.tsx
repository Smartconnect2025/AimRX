/**
 * Provider Dashboard Page
 *
 * Redirects to prescription wizard - no separate dashboard needed
 */

import { redirect } from "next/navigation";

export default function ProviderPage() {
  redirect("/prescriptions/new/step1");
} 