/**
 * Admin Providers API
 *
 * Endpoint for admin users to fetch provider data
 * Only accessible to users with admin role
 */

import { NextResponse } from "next/server";
import { getUser } from "@core/auth";
import { createAdminClient } from "@core/database/client";

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

    // Transform the data to match the expected format
    const transformedProviders =
      providers?.map((provider) => ({
        id: provider.id,
        first_name: provider.first_name || "",
        last_name: provider.last_name || "",
        email: provider.email || "",
        avatar_url: provider.avatar_url || "",
        specialty: provider.specialty || "",
        licensed_states: provider.licensed_states || [],
        service_types: provider.service_types || [],
        insurance_plans: provider.insurance_plans || [],
        created_at: provider.created_at,
        status: provider.is_active ? "active" : "inactive",
        role: "provider",
      })) || [];

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
