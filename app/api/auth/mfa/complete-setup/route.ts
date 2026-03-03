import { NextResponse } from "next/server";
import { createServerClient } from "@core/supabase/server";
import { setSessionStarted } from "@core/auth/cache-helpers";

export async function POST() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
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
