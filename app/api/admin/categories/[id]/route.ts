import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@core/supabase";
import { getUser } from "@core/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Check if the current user is an admin
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

    const { id } = await params;
    const body = await request.json();
    const supabase = await createServerClient();

    // For partial updates (like status changes), we only validate if certain fields are provided
    if (body.slug) {
      // Check if slug already exists for other categories
      const { data: existingCategory } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", body.slug)
        .neq("id", id)
        .single();

      if (existingCategory) {
        return NextResponse.json(
          { error: "Category with this slug already exists" },
          { status: 400 },
        );
      }
    }

    // Update category
    const { data: category, error } = await supabase
      .from("categories")
      .update({
        name: body.name,
        slug: body.slug,
        display_order: body.display_order || 0,
        is_active: body.is_active !== undefined ? body.is_active : true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating category:", error);
      return NextResponse.json(
        { error: "Failed to update category" },
        { status: 500 },
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error in category PUT:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Check if the current user is an admin
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

    const { id } = await params;
    const supabase = await createServerClient();

    // First, update any products in this category to have no category
    const { error: updateError } = await supabase
      .from("products")
      .update({ category_id: null })
      .eq("category_id", id);

    if (updateError) {
      console.error("Error updating products:", updateError);
      return NextResponse.json(
        { error: "Failed to update products in category" },
        { status: 500 },
      );
    }

    // Then delete category
    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      console.error("Error deleting category:", error);
      return NextResponse.json(
        { error: "Failed to delete category" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in category DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
