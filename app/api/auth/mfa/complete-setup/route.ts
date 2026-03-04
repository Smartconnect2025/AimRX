import { NextResponse, NextRequest } from "next/server";
import { createServerClient } from "@core/supabase/server";
import { createAdminClient } from "@core/database/client";
import { setSessionStarted } from "@core/auth/cache-helpers";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    let recoveryCodes: string[] = [];
    try {
      const body = await request.json();
      recoveryCodes = body.recoveryCodes || [];
    } catch {
    }

    if (recoveryCodes.length > 0) {
      const adminClient = createAdminClient();
      await adminClient.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          mfa_recovery_codes: recoveryCodes,
        },
      });
    }

    const response = NextResponse.json({
      success: true,
      message: "MFA setup complete, session started",
    });

    response.cookies.delete("mfa_pending");
    response.cookies.set("totp_verified", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8,
      path: "/",
    });
    await setSessionStarted(response);

    return response;
  } catch (error) {
    console.error("Error in complete-setup:", error);
    return NextResponse.json(
      { success: false, error: "Failed to complete MFA setup" },
      { status: 500 }
    );
  }
}
