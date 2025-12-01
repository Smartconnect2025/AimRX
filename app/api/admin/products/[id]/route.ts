import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@core/supabase";
import { getUser } from "@core/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Check if the current user is an admin
    const { user, userRole } = await getUser();

    if (!user || userRole !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = createClient();

    // For partial updates (like status changes), we only validate if certain fields are provided
    if (body.slug) {
      // Check if slug already exists for other products
      const { data: existingProduct } = await supabase
        .from("products")
        .select("id")
        .eq("slug", body.slug)
        .neq("id", id)
        .single();

      if (existingProduct) {
        return NextResponse.json(
          { error: "Product with this slug already exists" },
          { status: 400 },
        );
      }
    }

    // Update product
    const { data: product, error } = await supabase
      .from("products")
      .update({
        name: body.name,
        slug: body.slug,
        description: body.description,
        category_id: body.category_id,
        image_url: body.image_url,
        stripe_product_id: body.stripe_product_id,
        active_ingredient: body.active_ingredient,
        benefits: body.benefits,
        safety_info: body.safety_info,
        subscription_price: body.subscription_price,
        subscription_price_discounted: body.subscription_price_discounted,
        stock_quantity: body.stock_quantity || 0,
        low_stock_threshold: body.low_stock_threshold || 10,
        is_active: body.is_active !== undefined ? body.is_active : true,
        is_best_seller: body.is_best_seller || false,
        requires_prescription: body.requires_prescription || false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating product:", error);
      return NextResponse.json(
        { error: "Failed to update product" },
        { status: 500 },
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error in product PUT:", error);
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

    if (!user || userRole !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const supabase = createClient();

    // Delete product
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      console.error("Error deleting product:", error);
      return NextResponse.json(
        { error: "Failed to delete product" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in product DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
