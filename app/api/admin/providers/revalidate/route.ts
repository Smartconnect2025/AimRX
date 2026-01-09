/**
 * Admin Providers Revalidation API
 *
 * Endpoint to revalidate all providers' verification status based on profile completion
 * Only accessible to admin users
 */

import { NextResponse } from "next/server";
import { getUser } from "@core/auth";
import { createAdminClient } from "@core/database/client";

export async function POST() {
  try {
    // Check if the current user is an admin
    const { user, userRole } = await getUser();

    if (!user || userRole !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 },
      );
    }

    const supabase = createAdminClient();

    // Get all providers
    const { data: providers, error: fetchError } = await supabase
      .from("providers")
      .select("*");

    if (fetchError) {
      console.error("Error fetching providers:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch providers" },
        { status: 500 },
      );
    }

    let updatedCount = 0;
    let activatedCount = 0;
    let deactivatedCount = 0;

    // Check each provider and update their status
    for (const provider of providers || []) {
      // Check if physical address is complete
      const physicalAddr = provider.physical_address as Record<string, string> | null;
      const hasPhysicalAddress = physicalAddr &&
        physicalAddr.street &&
        physicalAddr.city &&
        physicalAddr.state &&
        physicalAddr.zip;

      // Check if billing address is complete
      const billingAddr = provider.billing_address as Record<string, string> | null;
      const hasBillingAddress = billingAddr &&
        billingAddr.street &&
        billingAddr.city &&
        billingAddr.state &&
        billingAddr.zip;

      // Check if basic info is complete
      const hasBasicInfo = provider.first_name &&
        provider.last_name &&
        provider.date_of_birth &&
        provider.phone_number;

      const isComplete = !!(hasPhysicalAddress && hasBillingAddress && hasBasicInfo);

      // Only update if status needs to change
      if (provider.is_verified !== isComplete || provider.is_active !== isComplete) {
        const { error: updateError } = await supabase
          .from("providers")
          .update({
            is_verified: isComplete,
            is_active: isComplete,
            updated_at: new Date().toISOString(),
          })
          .eq("id", provider.id);

        if (!updateError) {
          updatedCount++;
          if (isComplete && !provider.is_active) {
            activatedCount++;
          } else if (!isComplete && provider.is_active) {
            deactivatedCount++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Revalidation complete. ${updatedCount} provider(s) updated.`,
      stats: {
        total: providers?.length || 0,
        updated: updatedCount,
        activated: activatedCount,
        deactivated: deactivatedCount,
      },
    });
  } catch (error) {
    console.error("Error revalidating providers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
