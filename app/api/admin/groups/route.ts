/**
 * Admin Groups API
 *
 * Endpoint for admin users to manage provider groups
 * Only accessible to users with admin role
 */

import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@core/auth";
import { createServerClient } from "@core/supabase/server";

export async function GET() {
  try {
    const { user, userRole } = await getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    if (userRole !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const supabase = await createServerClient();

    const { data: dbGroups, error: dbError } = await supabase
      .from("groups")
      .select("*")
      .order("created_at", { ascending: false });

    if (dbError) {
      return NextResponse.json(
        { error: "Failed to load groups. Please try again." },
        { status: 500 },
      );
    }

    // Fetch platform managers to resolve names
    const pmIds = [
      ...new Set(
        (dbGroups || [])
          .map((g) => g.platform_manager_id)
          .filter(Boolean),
      ),
    ];

    let pmMap = new Map<string, string>();
    if (pmIds.length > 0) {
      const { data: pms } = await supabase
        .from("platform_managers")
        .select("id, name")
        .in("id", pmIds);

      pmMap = new Map((pms || []).map((pm) => [pm.id, pm.name]));
    }

    // Enrich groups with platform manager name
    const enrichedGroups = (dbGroups || []).map((group) => ({
      ...group,
      platform_manager_name: group.platform_manager_id
        ? pmMap.get(group.platform_manager_id) || null
        : null,
    }));

    return NextResponse.json({
      groups: enrichedGroups,
      total: enrichedGroups.length,
    });
  } catch (error) {
    console.error("Error listing groups:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, userRole } = await getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    if (userRole !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { name, platformManagerId } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Missing required field: name" },
        { status: 400 },
      );
    }

    const supabase = await createServerClient();

    const { data: dbGroup, error: dbError } = await supabase
      .from("groups")
      .insert({
        name,
        platform_manager_id: platformManagerId || null,
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json(
        { error: "Failed to create group. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      group: dbGroup,
      message: "Group created successfully",
    });
  } catch (error) {
    console.error("Error creating group:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
