import { NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";
import { categoriesData } from "@/core/database/seeds/data/categories";

export async function POST() {
  try {
    const supabase = createAdminClient();

    const results = [];

    for (const cat of categoriesData) {
      const { data: existing } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", cat.slug)
        .single();

      if (existing) {
        const { data, error } = await supabase
          .from("categories")
          .update({
            name: cat.name,
            description: cat.description,
            color: cat.color,
            image_url: cat.image_url,
            display_order: cat.display_order,
            is_active: cat.is_active,
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) {
          results.push({ slug: cat.slug, action: "error", error: error.message });
        } else {
          results.push({ slug: cat.slug, action: "updated", id: data.id });
        }
      } else {
        const { data, error } = await supabase
          .from("categories")
          .insert(cat)
          .select()
          .single();

        if (error) {
          results.push({ slug: cat.slug, action: "error", error: error.message });
        } else {
          results.push({ slug: cat.slug, action: "created", id: data.id });
        }
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Processed ${results.length} categories`,
    });
  } catch (error) {
    console.error("Error seeding categories:", error);
    return NextResponse.json(
      { success: false, error: "Failed to seed categories" },
      { status: 500 }
    );
  }
}
