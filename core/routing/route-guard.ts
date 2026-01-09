/**
 * Route Guard System
 * Handles route access control based on authentication status and user roles
 */

import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { UserAuthInfo } from "./types";
import { redirectPaths, publicAdminRoutes } from "./routes-config";
import {
  getRouteType,
  hasValidToken,
  hasValidRecoveryToken,
  getRedirectUrl,
} from "./utils";
import { checkIntakeStatusServer } from "@core/auth";
import { getCachedUserData } from "@core/auth/cache-helpers";

/**
 * Helper function to check if provider is active
 * @returns NextResponse redirect if provider is inactive, null if active
 */
async function checkProviderActiveStatus(
  userId: string,
  supabase: SupabaseClient,
  request: NextRequest,
): Promise<NextResponse | null> {
  try {
    // Check cache first
    const cached = getCachedUserData(request);
    if (cached.providerActive === false) {
      // Cached as inactive, redirect immediately
      return NextResponse.redirect(new URL("/account-inactive", request.url));
    }
    if (cached.providerActive === true) {
      // Cached as active, skip DB query
      return null;
    }

    // Query database to check is_active status
    const { data: provider, error } = await supabase
      .from("providers")
      .select("is_active")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error checking provider active status:", error);
      // On error, allow access to avoid blocking legitimate users
      return null;
    }

    if (!provider) {
      // Provider record doesn't exist yet (new provider)
      // Allow access so they can complete setup
      return null;
    }

    // Check if provider is inactive
    if (provider.is_active === false) {
      // Provider is inactive - redirect to blocked page
      return NextResponse.redirect(new URL("/account-inactive", request.url));
    }

    // Provider is active - allow access
    return null;
  } catch (error) {
    console.error("Error checking provider active status:", error);
    // On error, allow access to avoid blocking legitimate users
    return null;
  }
}

/**
 * Helper function to check intake status and redirect if incomplete
 * Only caches "complete" status to keep logic simple
 * @returns NextResponse redirect if intake incomplete, null if complete
 */
async function checkAndRedirectIntake(
  userId: string,
  role: string | null,
  supabase: SupabaseClient,
  request: NextRequest,
): Promise<NextResponse | null> {
  try {
    // Check cache first - only cache "complete" status
    const cached = getCachedUserData(request);
    if (cached.intakeComplete === true) {
      return null; // Cached as complete, skip DB query
    }

    // Query database (not cached or might be incomplete)
    const intakeStatus = await checkIntakeStatusServer(userId, role, supabase);

    if (!intakeStatus.hasCompletedIntake) {
      // Incomplete - redirect without caching
      const nextStepUrl =
        intakeStatus.nextStepUrl || "/intake/patient-information";
      return NextResponse.redirect(new URL(nextStepUrl, request.url));
    }

    // Complete - cache it to avoid future DB queries
    // Note: Can't set cookie on null response, so we don't cache here
    // Cookie will be set in middleware after first successful check
    return null;
  } catch (error) {
    console.error("Error checking intake status:", error);
    // On error, redirect to start of intake to be safe
    return NextResponse.redirect(
      new URL("/intake/patient-information", request.url),
    );
  }
}

/**
 * Handle routing based on route type, user authentication status, and role
 * @param request - The Next.js request object
 * @param auth - Authentication information (isAuthenticated, role, userId)
 * @param supabase - Supabase client instance for database queries
 * @returns NextResponse with redirect if access denied, null if access granted
 */
export async function handleRouteAccess(
  request: NextRequest,
  auth: UserAuthInfo & { userId?: string },
  supabase: SupabaseClient,
): Promise<NextResponse | null> {
  const { isAuthenticated, role } = auth;
  const pathname = request.nextUrl.pathname;

  // Check if this is a public admin route first (before any auth checks)
  if (publicAdminRoutes.includes(pathname)) {
    return null; // Allow access without authentication
  }

  const routeType = getRouteType(pathname);
  const searchParams = request.nextUrl.searchParams;

  // Create URL objects for redirects
  const homeUrl = new URL(redirectPaths.home, request.url);
  const loginUrl = new URL(redirectPaths.login, request.url);
  const dashboardUrl = new URL(redirectPaths.dashboard, request.url);
  const unauthorizedUrl = new URL(
    redirectPaths.unauthorized || redirectPaths.home,
    request.url,
  );

  // Special handling for root path "/" - accessible to all but patients need intake check
  if (pathname === "/") {
    // Allow unauthenticated users (they see marketing page)
    if (!isAuthenticated) {
      return null;
    }

    // Redirect authenticated users to their role-based dashboard
    if (role === "admin" || role === "pharmacy_admin") {
      return NextResponse.redirect(
        new URL(redirectPaths.adminDashboard, request.url),
      );
    }

    if (role === "provider") {
      return NextResponse.redirect(
        new URL(redirectPaths.providerDashboard, request.url),
      );
    }

    // For authenticated patients (role="user" or null), check intake completion
    if ((role === "user" || role === null) && auth.userId) {
      return await checkAndRedirectIntake(
        auth.userId,
        role ?? null,
        supabase,
        request,
      );
    }

    // Fallback: allow access (shouldn't happen but prevents errors)
    return null;
  }

  // Apply routing rules based on route type
  switch (routeType) {
    case "public":
      // Everyone can access public routes
      return null;

    case "auth":
      // Redirect authenticated users away from auth pages
      if (isAuthenticated) {
        return NextResponse.redirect(dashboardUrl);
      }
      return null;

    case "user":
      // Redirect unauthenticated users to login
      if (!isAuthenticated) {
        // Add a redirect param so user can return to this page after login
        return NextResponse.redirect(getRedirectUrl(loginUrl, pathname));
      }

      // Redirect admin/provider users to their appropriate dashboards
      if (role === "admin") {
        return NextResponse.redirect(
          new URL(redirectPaths.adminDashboard, request.url),
        );
      }
      if (role === "provider") {
        return NextResponse.redirect(
          new URL(redirectPaths.providerDashboard, request.url),
        );
      }

      // For "user" role or null role (patient users), check intake completion
      // Skip intake check for /intake routes (they handle their own flow)
      if (pathname.startsWith("/intake")) {
        return null;
      }

      // Check intake status for patient users (role === "user" or role === null)
      if (auth.userId) {
        return await checkAndRedirectIntake(
          auth.userId,
          role ?? null,
          supabase,
          request,
        );
      }

      return null;

    case "provider":
      // First check authentication
      if (!isAuthenticated) {
        return NextResponse.redirect(getRedirectUrl(loginUrl, pathname));
      }

      // Special case: /appointment route is accessible to both providers and patients
      if (pathname.startsWith("/appointment")) {
        // Allow both provider and user (patient) roles
        if (role === "provider") {
          // Check if provider is active before allowing access
          if (auth.userId) {
            const activeCheck = await checkProviderActiveStatus(
              auth.userId,
              supabase,
              request,
            );
            if (activeCheck) return activeCheck;
          }
          return null; // Providers can access directly
        }
        if (role === "user" && auth.userId) {
          // Patients need intake check before accessing appointments
          return await checkAndRedirectIntake(
            auth.userId,
            role,
            supabase,
            request,
          );
        }
        // Redirect other roles (admin, null, etc.) to unauthorized
        return NextResponse.redirect(unauthorizedUrl);
      }

      // Then check role
      if (role !== "provider") {
        // User is authenticated but not a provider
        return NextResponse.redirect(unauthorizedUrl);
      }

      // Check if provider is active (except for /account-inactive page itself)
      if (auth.userId && pathname !== "/account-inactive") {
        const activeCheck = await checkProviderActiveStatus(
          auth.userId,
          supabase,
          request,
        );
        if (activeCheck) return activeCheck;
      }

      return null;

    case "admin":
      // First check authentication
      if (!isAuthenticated) {
        return NextResponse.redirect(getRedirectUrl(loginUrl, pathname));
      }

      // Then check role
      if (role !== "admin") {
        // User is authenticated but not an admin
        return NextResponse.redirect(unauthorizedUrl);
      }
      return null;

    case "special":
      // Handle special routes with custom logic
      if (pathname === "/auth/reset-password") {
        // Check for recovery token
        if (hasValidRecoveryToken(searchParams)) {
          // Allow access with valid recovery token regardless of auth status
          return null;
        }

        // Without recovery token, redirect based on auth status
        return NextResponse.redirect(isAuthenticated ? dashboardUrl : loginUrl);
      }

      // Handle email verification page
      if (pathname === "/auth/verify") {
        // Check for verification token
        if (hasValidToken(searchParams, "verification")) {
          return null;
        }

        // No valid token, redirect based on auth status
        return NextResponse.redirect(isAuthenticated ? dashboardUrl : loginUrl);
      }

      // Default for unhandled special routes
      return NextResponse.redirect(homeUrl);
  }
}
