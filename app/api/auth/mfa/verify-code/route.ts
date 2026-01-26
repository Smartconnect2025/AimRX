import { NextRequest, NextResponse } from "next/server";
import { verifyMFACode } from "@/core/services/mfa/mfaService";
import { createServerClient } from "@core/supabase/server";

/**
 * Verify MFA code
 * POST /api/auth/mfa/verify-code
 *
 * Clears mfa_pending cookie on successful verification to allow access to protected routes
 * Returns user role for role-based redirect
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, code } = await request.json();

    if (!userId || !code) {
      return NextResponse.json(
        { success: false, error: "Missing userId or code" },
        { status: 400 }
      );
    }

    const result = await verifyMFACode(userId, code);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Fetch user role for role-based redirect
    const supabase = await createServerClient();
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    // Create response and clear MFA pending cookie
    const response = NextResponse.json({
      success: true,
      message: "Code verified successfully",
      role: roleData?.role || "user",
    });

    // Clear MFA pending cookie to allow access to protected routes
    response.cookies.delete("mfa_pending");

    return response;
  } catch (error) {
    console.error("Error in verify-code API:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify code" },
      { status: 500 }
    );
  }
}
