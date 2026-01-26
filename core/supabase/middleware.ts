/**
 * Supabase Middleware Module
 *
 * Handles authentication and session management in Next.js middleware.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { handleRouteAccess } from "@core/routing";
import { getUserRole } from "@core/auth";
import { envConfig } from "@core/config";
import { getCachedUserData } from "@core/auth/cache-helpers";

/**
 * Updates the Supabase session during middleware execution
 *
 * This function:
 * 1. Creates a middleware-compatible Supabase client
 * 2. Retrieves the current user and their role
 * 3. Handles route access control based on authentication status and role
 * 4. Updates cookies for maintaining the session
 *
 * @param request - The incoming Next.js request
 * @returns A Next.js response, either the original response with updated cookies or a redirect
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    envConfig.NEXT_PUBLIC_SUPABASE_URL,
    envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check MFA pending state BEFORE allowing access to protected routes
  if (user) {
    const cached = getCachedUserData(request);
    const pathname = request.nextUrl.pathname;

    // Skip MFA check for demo accounts
    const mfaBypassEmails = ["demo+admin@specode.ai", "npi@gmail.com"];
    const isDemoAccount = user.email && mfaBypassEmails.includes(user.email);

    // MFA-exempt paths (allow access while MFA is pending)
    const mfaExemptPaths = [
      "/auth/verify-mfa",
      "/auth/logout",
      "/auth/login",
      "/api/auth/mfa/",
    ];

    const isExemptPath = mfaExemptPaths.some((p) => pathname.startsWith(p));

    if (cached.mfaPending && !isExemptPath && !isDemoAccount) {
      // Redirect to MFA verification with preserved context
      const verifyUrl = new URL("/auth/verify-mfa", request.url);
      verifyUrl.searchParams.set("userId", user.id);
      if (user.email) {
        verifyUrl.searchParams.set("email", user.email);
      }
      verifyUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(verifyUrl);
    }
  }

  let userRole: string | null = null;

  if (user) {
    // Try to get role from cache first
    const cached = getCachedUserData(request);
    userRole = cached.role;

    // If not cached, query database
    if (!userRole) {
      userRole = await getUserRole(user.id, supabase);
      // Cache the role for future requests
      if (userRole) {
        // HttpOnly cookie for middleware
        supabaseResponse.cookies.set("user_role_cache", userRole, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 2, // 2 minutes
          path: "/",
        });
        // Readable cookie for frontend
        supabaseResponse.cookies.set("user_role", userRole, {
          httpOnly: false, // Frontend can read this
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 2, // 2 minutes
          path: "/",
        });
      }
    }
  } else {
    // Clear cache for logged out users
    supabaseResponse.cookies.delete("user_role_cache");
    supabaseResponse.cookies.delete("user_role");
    supabaseResponse.cookies.delete("intake_complete_cache");
    supabaseResponse.cookies.delete("provider_active_cache");
    supabaseResponse.cookies.delete("mfa_pending");
  }

  // Handle route access based on authentication and role
  const routeResponse = await handleRouteAccess(
    request,
    {
      isAuthenticated: !!user,
      role: userRole,
      userId: user?.id,
    },
    supabase,
  );
  if (routeResponse) {
    // If we need to redirect, copy cache cookies to redirect response
    if (userRole) {
      routeResponse.cookies.set("user_role_cache", userRole, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 2, // 2 minutes
        path: "/",
      });
      routeResponse.cookies.set("user_role", userRole, {
        httpOnly: false, // Frontend can read this
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 2, // 2 minutes
        path: "/",
      });
    }
    return routeResponse;
  }

  // If patient user successfully accessed a protected route, cache intake as complete
  const pathname = request.nextUrl.pathname;
  const isPatient = userRole === "user" || (user && userRole === null);
  const isProtectedRoute =
    pathname === "/" ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/catalog") ||
    pathname.startsWith("/appointments");

  if (user && isPatient && isProtectedRoute) {
    // Cache intake complete status for 2 minutes
    supabaseResponse.cookies.set("intake_complete_cache", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 2, // 2 minutes
      path: "/",
    });
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
