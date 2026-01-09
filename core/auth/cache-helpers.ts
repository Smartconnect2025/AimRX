/**
 * Cache Helpers for Middleware
 *
 * Uses cookies to cache user role and intake status to reduce database queries
 */
import { NextRequest, NextResponse } from "next/server";

const ROLE_COOKIE = "user_role_cache";
const INTAKE_COOKIE = "intake_complete_cache";
const PROVIDER_ACTIVE_COOKIE = "provider_active_cache";
const CACHE_MAX_AGE = 60 * 2; // 2 minutes

export interface CachedUserData {
  role: string | null;
  intakeComplete: boolean | null;
  providerActive: boolean | null;
}

/**
 * Get cached user data from cookies
 */
export function getCachedUserData(request: NextRequest): CachedUserData {
  const roleCookie = request.cookies.get(ROLE_COOKIE)?.value;
  const intakeCookie = request.cookies.get(INTAKE_COOKIE)?.value;
  const providerActiveCookie = request.cookies.get(PROVIDER_ACTIVE_COOKIE)?.value;

  return {
    role: roleCookie || null,
    intakeComplete:
      intakeCookie === "true" ? true : intakeCookie === "false" ? false : null,
    providerActive:
      providerActiveCookie === "true" ? true : providerActiveCookie === "false" ? false : null,
  };
}

/**
 * Set user role cache in response cookies
 */
export function setCachedRole(
  response: NextResponse,
  role: string | null,
): void {
  if (role) {
    response.cookies.set(ROLE_COOKIE, role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: CACHE_MAX_AGE,
      path: "/",
    });
  }
}

/**
 * Set intake completion cache in response cookies
 */
export function setCachedIntakeStatus(
  response: NextResponse,
  isComplete: boolean,
): void {
  response.cookies.set(INTAKE_COOKIE, isComplete.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: CACHE_MAX_AGE,
    path: "/",
  });
}

/**
 * Set provider active status cache in response cookies
 */
export function setCachedProviderActive(
  response: NextResponse,
  isActive: boolean,
): void {
  response.cookies.set(PROVIDER_ACTIVE_COOKIE, isActive.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: CACHE_MAX_AGE,
    path: "/",
  });
}

/**
 * Clear all cached user data (call on logout or role/intake change)
 */
export function clearCachedUserData(response: NextResponse): void {
  response.cookies.delete(ROLE_COOKIE);
  response.cookies.delete(INTAKE_COOKIE);
  response.cookies.delete(PROVIDER_ACTIVE_COOKIE);
}
