import { NextResponse } from "next/server";
import { createClient } from "@core/supabase/server";

/**
 * GET /api/auth/me
 * Returns the current user and their role
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ user: null, role: null });
  }

  const { data: userRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
    },
    role: userRole?.role || null,
  });
}
