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
import { getCachedUserData, isSessionExpired, setSessionStarted } from "@core/auth/cache-helpers";

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

  if (!user) {
    const staleCookies = ["totp_verified", "session_started", "user_role_cache", "user_role", "user_role_uid", "intake_complete_cache", "provider_active_cache", "mfa_pending"];
    staleCookies.forEach((name) => {
      if (request.cookies.get(name)?.value) {
        supabaseResponse.cookies.set(name, "", { path: "/", maxAge: 0 });
      }
    });
  }

  if (user) {
    const cached = getCachedUserData(request);
    const pathname = request.nextUrl.pathname;

    const authExemptPaths = [
      "/auth/mfa-enroll",
      "/auth/mfa-verify",
      "/auth/logout",
      "/auth/login",
      "/api/auth/mfa/",
      "/api/auth/logout",
    ];

    const isExemptPath = authExemptPaths.some((p) => pathname.startsWith(p));

    if (!isExemptPath) {
      if (cached.sessionToken && await isSessionExpired(cached.sessionToken)) {
        await supabase.auth.signOut();
        const loginUrl = new URL("/auth/login", request.url);
        loginUrl.searchParams.set("reason", "session_expired");
        const redirectResponse = NextResponse.redirect(loginUrl);
        const expiredCookies = ["user_role_cache", "user_role", "user_role_uid", "intake_complete_cache", "provider_active_cache", "mfa_pending", "session_started", "totp_verified"];
        expiredCookies.forEach((name) => {
          redirectResponse.cookies.set(name, "", { path: "/", maxAge: 0 });
        });
        return redirectResponse;
      }

      const totpVerified = request.cookies.get("totp_verified")?.value === "true";

      if (!totpVerified) {
        const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

        if (aalData?.nextLevel === "aal2" && aalData?.currentLevel === "aal1") {
          const verifyUrl = new URL("/auth/mfa-verify", request.url);
          verifyUrl.searchParams.set("redirect", pathname);
          return NextResponse.redirect(verifyUrl);
        }

        if (aalData?.currentLevel === "aal2") {
          supabaseResponse.cookies.set("totp_verified", "true", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 8,
          });
          if (!cached.sessionToken) {
            await setSessionStarted(supabaseResponse);
          }
        } else if (aalData?.nextLevel === "aal1" || !aalData?.nextLevel) {
          const enrollUrl = new URL("/auth/mfa-enroll", request.url);
          enrollUrl.searchParams.set("redirect", pathname);
          return NextResponse.redirect(enrollUrl);
        }
      } else if (!cached.sessionToken) {
        await setSessionStarted(supabaseResponse);
      }
    }
  }

  let userRole: string | null = null;

  if (user) {
    // Try to get role from cache first, but only trust it if it's bound to the current user
    const cached = getCachedUserData(request);
    const cachedUserId = request.cookies.get("user_role_uid")?.value;

    if (cached.role && cachedUserId === user.id) {
      userRole = cached.role;
    }

    // If not cached or cache is for a different user, query database
    if (!userRole) {
      userRole = await getUserRole(user.id, supabase);
      // Cache the role for future requests, bound to user ID
      if (userRole) {
        supabaseResponse.cookies.set("user_role_cache", userRole, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60,
          path: "/",
        });
        supabaseResponse.cookies.set("user_role", userRole, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60,
          path: "/",
        });
        supabaseResponse.cookies.set("user_role_uid", user.id, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60,
          path: "/",
        });
      }
    }
  } else {
    const noUserCookies = ["user_role_cache", "user_role", "user_role_uid", "intake_complete_cache", "provider_active_cache", "mfa_pending", "session_started", "totp_verified"];
    noUserCookies.forEach((name) => {
      supabaseResponse.cookies.set(name, "", { path: "/", maxAge: 0 });
    });
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
    // Copy ALL cookies from supabaseResponse to redirect response (session + cache)
    for (const cookie of supabaseResponse.cookies.getAll()) {
      routeResponse.cookies.set(cookie.name, cookie.value);
    }
    // Also set role cookies on redirect if available
    if (userRole && user) {
      routeResponse.cookies.set("user_role_cache", userRole, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60,
        path: "/",
      });
      routeResponse.cookies.set("user_role", userRole, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60,
        path: "/",
      });
      routeResponse.cookies.set("user_role_uid", user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60,
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
    // Cache intake complete status for 1 hour
    supabaseResponse.cookies.set("intake_complete_cache", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour
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

  // Prevent browser caching of auth pages to avoid stale state
  if (request.nextUrl.pathname.startsWith("/auth/")) {
    supabaseResponse.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    supabaseResponse.headers.set("Pragma", "no-cache");
  }

  return supabaseResponse;
}
