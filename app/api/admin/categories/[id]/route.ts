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

    if (!userRole || !["admin", "super_admin"].includes(userRole)) {
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

    // If name is changing, look up the old name to update pharmacy_medications references
    let oldCategoryName: string | null = null;
    if (body.name !== undefined) {
      const { data: existing } = await supabase
        .from("categories")
        .select("name")
        .eq("id", id)
        .single();
      if (existing && existing.name !== body.name) {
        oldCategoryName = existing.name;
      }
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (body.name !== undefined) updateData.name = body.name;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.display_order !== undefined) updateData.display_order = body.display_order;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.image_url !== undefined) updateData.image_url = body.image_url;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.description !== undefined) updateData.description = body.description;

    const { data: category, error } = await supabase
      .from("categories")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (!error && oldCategoryName && body.name) {
      const newName = body.name as string;
      const { data: medsToUpdate } = await supabase
        .from("pharmacy_medications")
        .select("id, category")
        .like("category", `%${oldCategoryName}%`);

      if (medsToUpdate && medsToUpdate.length > 0) {
        for (const med of medsToUpdate) {
          const cats = (med.category || "").split("|").map((c: string) => c.trim()).filter(Boolean);
          if (cats.includes(oldCategoryName)) {
            const updated = cats.map((c: string) => c === oldCategoryName ? newName : c).join(" | ");
            await supabase
              .from("pharmacy_medications")
              .update({ category: updated })
              .eq("id", med.id);
          }
        }
      }
    }

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

    if (!userRole || !["admin", "super_admin"].includes(userRole)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const supabase = await createServerClient();

    // Look up the category name first (needed to clear pharmacy_medications references)
    const { data: categoryData } = await supabase
      .from("categories")
      .select("name")
      .eq("id", id)
      .single();

    if (categoryData?.name) {
      const deletedName = categoryData.name;
      const { data: medsToUpdate } = await supabase
        .from("pharmacy_medications")
        .select("id, category")
        .like("category", `%${deletedName}%`);

      if (medsToUpdate && medsToUpdate.length > 0) {
        for (const med of medsToUpdate) {
          const cats = (med.category || "").split("|").map((c: string) => c.trim()).filter(Boolean);
          if (cats.includes(deletedName)) {
            const remaining = cats.filter((c: string) => c !== deletedName);
            await supabase
              .from("pharmacy_medications")
              .update({ category: remaining.length > 0 ? remaining.join(" | ") : null })
              .eq("id", med.id);
          }
        }
      }
    }

    // Also clear any products.category_id references
    const { error: updateError } = await supabase
      .from("products")
      .update({ category_id: null })
      .eq("category_id", id);

    if (updateError) {
      console.error("Error updating products:", updateError);
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
