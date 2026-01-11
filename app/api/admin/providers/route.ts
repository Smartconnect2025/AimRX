/**
 * Admin Providers API
 *
 * Endpoint for admin users to fetch provider data
 * Only accessible to users with admin role
 */

import { NextResponse } from "next/server";
import { getUser } from "@core/auth";
import { createAdminClient } from "@core/database/client";
import { mockProviderTiers } from "./mock-tier-assignments";
import { mockTierStore } from "../tiers/mock-store";

export async function GET() {
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

    // First get all user_ids with provider role
    const { data: providerUsers, error: roleError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "provider");

    if (roleError) {
      console.error("Error fetching provider roles:", roleError);
      return NextResponse.json(
        { error: "Failed to fetch providers" },
        { status: 500 },
      );
    }

    // Then get providers that match these user_ids
    const providerUserIds = providerUsers?.map((u) => u.user_id) || [];
    const { data: providers, error } = await supabase
      .from("providers")
      .select("*")
      .in("user_id", providerUserIds);

    if (error) {
      console.error("Error fetching providers:", error);
      return NextResponse.json(
        { error: "Failed to fetch providers" },
        { status: 500 },
      );
    }

    // Debug: Log all tier assignments in mock store
    console.log("🗂️ ALL tier assignments in mock store:");
    const allAssignments = mockProviderTiers.getAll();
    allAssignments.forEach((tierCode, providerId) => {
      console.log(`  - Provider ${providerId} -> ${tierCode}`);
    });

    // Fetch NPI numbers for all providers using database function (bypasses schema cache)
    const npiPromises = providers?.map(async (provider) => {
      const { data: npiNumber } = await supabase.rpc('get_provider_npi', {
        p_provider_id: provider.id
      });
      return { providerId: provider.id, npiNumber };
    }) || [];

    const npiResults = await Promise.all(npiPromises);
    const npiMap = new Map(npiResults.map(r => [r.providerId, r.npiNumber]));

    // Transform the data to match the expected format
    const transformedProviders =
      providers?.map((provider) => {
        // Get tier info from mock store
        const tierCode = mockProviderTiers.getTier(provider.id);
        const tier = tierCode ? mockTierStore.getTierByCode(tierCode) : null;

        console.log(`🔍 Provider ${provider.first_name} ${provider.last_name} (${provider.id}):`, {
          tierCode: tierCode || "NONE",
          foundTier: tier ? `${tier.tier_name} (${tier.discount_percentage}%)` : "NOT FOUND"
        });

        // Check if profile is complete (payment details, addresses filled)
        const hasPaymentDetails = provider.payment_details &&
          typeof provider.payment_details === 'object' &&
          Object.keys(provider.payment_details).length > 0;
        const hasPhysicalAddress = provider.physical_address &&
          typeof provider.physical_address === 'object' &&
          Object.keys(provider.physical_address).length > 0;
        const hasBillingAddress = provider.billing_address &&
          typeof provider.billing_address === 'object' &&
          Object.keys(provider.billing_address).length > 0;

        const profileComplete = hasPaymentDetails && hasPhysicalAddress && hasBillingAddress;

        // Debug logging
        console.log(`Provider ${provider.first_name} ${provider.last_name}:`, {
          is_active: provider.is_active,
          hasPaymentDetails,
          hasPhysicalAddress,
          hasBillingAddress,
          profileComplete
        });

        // Status logic:
        // - "pending" if profile is incomplete (even if is_active is true)
        // - "active" only if profile is complete AND is_active is true
        // - "inactive" if is_active is false and profile is complete
        let status = "pending";
        if (profileComplete) {
          status = provider.is_active ? "active" : "inactive";
        }

        return {
          id: provider.id,
          first_name: provider.first_name || "",
          last_name: provider.last_name || "",
          email: provider.email || "",
          phone_number: provider.phone_number || null,
          avatar_url: provider.avatar_url || "",
          npi_number: npiMap.get(provider.id) || null, // Fetched via database function to bypass schema cache
          specialty: provider.specialty || "",
          licensed_states: provider.licensed_states || [],
          service_types: provider.service_types || [],
          insurance_plans: provider.insurance_plans || [],
          created_at: provider.created_at,
          status: status,
          role: "provider",
          is_verified: provider.is_verified || false,
          tier_level: tier ? `${tier.tier_name} (${tier.discount_percentage}%)` : "Not set",
          tier_code: tierCode || null,
          is_active: provider.is_active || false,
          user_id: provider.user_id || "",
          physical_address: provider.physical_address || null,
          billing_address: provider.billing_address || null,
          payment_details: provider.payment_details || null,
          payment_method: provider.payment_method || null,
          payment_schedule: provider.payment_schedule || null,
          tax_id: provider.tax_id || null,
          medical_licenses: provider.medical_licenses || null,
        };
      }) || [];

    return NextResponse.json({
      providers: transformedProviders,
      total: transformedProviders.length,
    });
  } catch (error) {
    console.error("Error listing providers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
