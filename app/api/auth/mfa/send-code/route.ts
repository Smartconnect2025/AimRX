import { NextRequest, NextResponse } from "next/server";
import { sendMFACode } from "@/core/services/mfa/mfaService";

/**
 * Send MFA code to user's email
 * POST /api/auth/mfa/send-code
 *
 * Sets mfa_pending cookie to enforce MFA verification before accessing protected routes
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json();

    if (!userId || !email) {
      return NextResponse.json(
        { success: false, error: "Missing userId or email" },
        { status: 400 }
      );
    }

    const result = await sendMFACode(userId, email);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    // Create response with MFA pending cookie
    const response = NextResponse.json({
      success: true,
      message: "Verification code sent to your email",
    });

    // Set MFA pending cookie (HttpOnly, secure) to enforce MFA verification
    response.cookies.set("mfa_pending", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes (matches MFA code expiry)
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error in send-code API:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send verification code" },
      { status: 500 }
    );
  }
}
