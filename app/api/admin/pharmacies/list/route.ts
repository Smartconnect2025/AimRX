import { NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: pharmacies, error } = await supabase
      .from("pharmacies")
      .select("id, name, slug, is_active")
      .order("name");

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pharmacies: pharmacies || [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
