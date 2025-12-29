import { NextResponse } from "next/server";
import { createClient } from "@core/supabase";

// This is a one-time fix endpoint
export async function GET() {
  try {
    const supabase = await createClient();
    const email = "hafsah+2@topflightapps.com";

    // Update access request to approved
    const { error: updateError } = await supabase
      .from("access_requests")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
      })
      .eq("email", email)
      .eq("status", "pending");

    if (updateError) {
      console.error("Error updating access request:", updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Updated access request for ${email}`,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
