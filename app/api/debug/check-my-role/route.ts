import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getUserRole } from "@core/auth";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({
      authenticated: false,
      message: "Not logged in",
    });
  }

  // Get role from database
  const role = await getUserRole(user.id, supabase);

  // Get cached cookies
  const cachedRole = cookieStore.get("user_role_cache")?.value;
  const cachedRolePublic = cookieStore.get("user_role")?.value;

  return NextResponse.json({
    authenticated: true,
    userId: user.id,
    email: user.email,
    roleFromDatabase: role,
    cachedRole: cachedRole || null,
    cachedRolePublic: cachedRolePublic || null,
    allCookies: cookieStore.getAll().map(c => ({ name: c.name, value: c.value })),
  });
}
