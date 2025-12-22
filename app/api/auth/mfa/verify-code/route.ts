import { NextRequest, NextResponse } from "next/server";
import { verifyMFACode } from "@/core/services/mfa/mfaService";

/**
 * Verify MFA code
 * POST /api/auth/mfa/verify-code
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

    return NextResponse.json({
      success: true,
      message: "Code verified successfully",
    });
  } catch (error) {
    console.error("Error in verify-code API:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify code" },
      { status: 500 }
    );
  }
}
