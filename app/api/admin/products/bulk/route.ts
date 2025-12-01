import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@core/supabase";
import { getUser } from "@core/auth";

export async function PUT(request: NextRequest) {
  try {
    // Check if the current user is an admin
    const { user, userRole } = await getUser();

    if (!user || userRole !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { product_ids, updates } = body;

    if (
      !product_ids ||
      !Array.isArray(product_ids) ||
      product_ids.length === 0
    ) {
      return NextResponse.json(
        { error: "Invalid product IDs" },
        { status: 400 },
      );
    }

    if (!updates || typeof updates !== "object") {
      return NextResponse.json({ error: "Invalid updates" }, { status: 400 });
    }

    const supabase = createClient();

    // Update multiple products
    const { data: products, error } = await supabase
      .from("products")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .in("id", product_ids)
      .select();

    if (error) {
      console.error("Error updating products:", error);
      return NextResponse.json(
        { error: "Failed to update products" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      updated_count: products?.length || 0,
      products,
    });
  } catch (error) {
    console.error("Error in bulk products PUT:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
