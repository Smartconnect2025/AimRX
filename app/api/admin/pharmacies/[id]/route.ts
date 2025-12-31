import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@core/supabase/server";

/**
 * Update a pharmacy
 * PUT /api/admin/pharmacies/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerClient();

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const pharmacyId = params.id;

    // Parse request body
    const body = await request.json();
    const {
      name,
      slug,
      logo_url,
      primary_color,
      tagline,
      address,
      npi,
      phone,
      system_type,
      api_url,
      api_key,
      store_id,
      location_id,
    } = body;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Update pharmacy basic info
    const { error: updateError } = await supabase
      .from("pharmacies")
      .update({
        name,
        slug: slug.toLowerCase().trim(),
        logo_url: logo_url || null,
        primary_color: primary_color || "#00AEEF",
        tagline: tagline || null,
        address: address || null,
        npi: npi || null,
        phone: phone || null,
      })
      .eq("id", pharmacyId);

    if (updateError) {
      console.error("Error updating pharmacy:", updateError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update pharmacy",
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    // Update backend integration if provided
    if (system_type && store_id) {
      // Check if backend exists
      const { data: existingBackend } = await supabase
        .from("pharmacy_backends")
        .select("id")
        .eq("pharmacy_id", pharmacyId)
        .single();

      const backendData: Record<string, unknown> = {
        system_type,
        api_url: api_url || null,
        store_id,
        location_id: location_id || null,
      };

      // Only update API key if provided (not empty)
      if (api_key) {
        backendData.api_key_encrypted = api_key;
      }

      if (existingBackend) {
        // Update existing backend
        const { error: backendError } = await supabase
          .from("pharmacy_backends")
          .update(backendData)
          .eq("pharmacy_id", pharmacyId);

        if (backendError) {
          console.error("Error updating pharmacy backend:", backendError);
          return NextResponse.json(
            {
              success: false,
              error: "Failed to update pharmacy backend integration",
              details: backendError.message,
            },
            { status: 500 }
          );
        }
      } else {
        // Create new backend (requires API key)
        if (!api_key) {
          return NextResponse.json(
            {
              success: false,
              error: "API key is required to create backend integration",
            },
            { status: 400 }
          );
        }

        const { error: backendError } = await supabase
          .from("pharmacy_backends")
          .insert({
            pharmacy_id: pharmacyId,
            ...backendData,
            is_active: true,
          });

        if (backendError) {
          console.error("Error creating pharmacy backend:", backendError);
          return NextResponse.json(
            {
              success: false,
              error: "Failed to create pharmacy backend integration",
              details: backendError.message,
            },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Pharmacy "${name}" updated successfully`,
    });
  } catch (error) {
    console.error("Error in update pharmacy:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update pharmacy",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Delete a pharmacy
 * DELETE /api/admin/pharmacies/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerClient();

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const pharmacyId = params.id;

    // Check if pharmacy exists
    const { data: pharmacy, error: fetchError } = await supabase
      .from("pharmacies")
      .select("name")
      .eq("id", pharmacyId)
      .single();

    if (fetchError || !pharmacy) {
      return NextResponse.json(
        { success: false, error: "Pharmacy not found" },
        { status: 404 }
      );
    }

    // Delete pharmacy (cascade will handle related records due to foreign key constraints)
    // This will automatically delete:
    // - pharmacy_backends (on delete cascade)
    // - pharmacy_admins (on delete cascade)
    const { error: deleteError } = await supabase
      .from("pharmacies")
      .delete()
      .eq("id", pharmacyId);

    if (deleteError) {
      console.error("Error deleting pharmacy:", deleteError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to delete pharmacy",
          details: deleteError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Pharmacy "${pharmacy.name}" deleted successfully`,
    });
  } catch (error) {
    console.error("Error in delete pharmacy:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete pharmacy",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
