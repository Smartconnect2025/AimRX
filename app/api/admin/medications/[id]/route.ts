import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@core/supabase/server";

/**
 * Update a medication
 * PATCH /api/admin/medications/[id]
 */
export async function PATCH(
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

    // Get pharmacy admin's pharmacy
    const { data: adminLink } = await supabase
      .from("pharmacy_admins")
      .select("pharmacy_id")
      .eq("user_id", user.id)
      .single();

    if (!adminLink) {
      return NextResponse.json(
        { success: false, error: "You are not linked to any pharmacy" },
        { status: 403 }
      );
    }

    const pharmacyId = adminLink.pharmacy_id;
    const medicationId = params.id;

    // Verify medication belongs to this pharmacy
    const { data: existingMed } = await supabase
      .from("pharmacy_medications")
      .select("id")
      .eq("id", medicationId)
      .eq("pharmacy_id", pharmacyId)
      .single();

    if (!existingMed) {
      return NextResponse.json(
        { success: false, error: "Medication not found or unauthorized" },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      name,
      strength,
      vial_size,
      form,
      ndc,
      retail_price_cents,
      category,
      dosage_instructions,
      detailed_description,
      image_url,
      is_active,
      in_stock,
      preparation_time_days,
      notes,
    } = body;

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (strength !== undefined || vial_size !== undefined) {
      updateData.strength = strength || vial_size || null;
    }
    if (form !== undefined) updateData.form = form;
    if (ndc !== undefined) updateData.ndc = ndc;
    if (retail_price_cents !== undefined) {
      updateData.retail_price_cents = parseInt(retail_price_cents);
    }
    if (category !== undefined) updateData.category = category;
    if (dosage_instructions !== undefined || detailed_description !== undefined) {
      updateData.dosage_instructions = detailed_description || dosage_instructions || null;
    }
    if (image_url !== undefined) updateData.image_url = image_url;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (in_stock !== undefined) updateData.in_stock = in_stock;
    if (preparation_time_days !== undefined) {
      updateData.preparation_time_days = preparation_time_days ? parseInt(preparation_time_days) : 0;
    }
    if (notes !== undefined) updateData.notes = notes;

    // Update medication
    const { data: medication, error: updateError } = await supabase
      .from("pharmacy_medications")
      .update(updateData)
      .eq("id", medicationId)
      .eq("pharmacy_id", pharmacyId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating medication:", updateError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update medication",
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Medication updated successfully",
      medication,
    });
  } catch (error) {
    console.error("Error in update medication:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update medication",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Delete a medication
 * DELETE /api/admin/medications/[id]
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

    // Check if user is a pharmacy admin
    const { data: adminLink } = await supabase
      .from("pharmacy_admins")
      .select("pharmacy_id")
      .eq("user_id", user.id)
      .single();

    const medicationId = params.id;

    // Delete medication
    let deleteError;
    if (adminLink) {
      // Pharmacy admin - can only delete medications from their pharmacy
      const pharmacyId = adminLink.pharmacy_id;
      const result = await supabase
        .from("pharmacy_medications")
        .delete()
        .eq("id", medicationId)
        .eq("pharmacy_id", pharmacyId);
      deleteError = result.error;
    } else {
      // Platform admin - can delete any medication
      const result = await supabase
        .from("pharmacy_medications")
        .delete()
        .eq("id", medicationId);
      deleteError = result.error;
    }

    if (deleteError) {
      console.error("Error deleting medication:", deleteError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to delete medication",
          details: deleteError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Medication deleted successfully",
    });
  } catch (error) {
    console.error("Error in delete medication:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete medication",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
