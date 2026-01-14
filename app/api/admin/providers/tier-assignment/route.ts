import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@core/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerId, tierCode } = body;

    if (!providerId || !tierCode) {
      return NextResponse.json(
        { error: "Missing providerId or tierCode" },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Update tier_level in providers table
    const { error } = await supabase
      .from("providers")
      .update({ tier_level: tierCode })
      .eq("id", providerId);

    if (error) {
      return NextResponse.json(
        { error: "Failed to update tier assignment. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Tier assignment updated successfully"
    });
  } catch (error) {
    console.error("Error updating tier assignment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
