/**
 * Cache Helpers for Middleware
 *
 * Uses cookies to cache user role and intake status to reduce database queries
 */
import { NextRequest, NextResponse } from "next/server";

const ROLE_COOKIE = "user_role_cache";
const INTAKE_COOKIE = "intake_complete_cache";
const MFA_PENDING_COOKIE = "mfa_pending";
const CACHE_MAX_AGE = 60 * 60; // 1 hour
const MFA_PENDING_MAX_AGE = 60 * 10; // 10 minutes (matches MFA code expiry)

export interface CachedUserData {
  role: string | null;
  intakeComplete: boolean | null;
  mfaPending: boolean;
}

/**
 * Get cached user data from cookies
 */
export function getCachedUserData(request: NextRequest): CachedUserData {
  const roleCookie = request.cookies.get(ROLE_COOKIE)?.value;
  const intakeCookie = request.cookies.get(INTAKE_COOKIE)?.value;
  const mfaPendingCookie = request.cookies.get(MFA_PENDING_COOKIE)?.value;

  return {
    role: roleCookie || null,
    intakeComplete:
      intakeCookie === "true" ? true : intakeCookie === "false" ? false : null,
    mfaPending: mfaPendingCookie === "true",
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
 * Clear all cached user data (call on logout or role/intake change)
 */
export function clearCachedUserData(response: NextResponse): void {
  response.cookies.delete(ROLE_COOKIE);
  response.cookies.delete(INTAKE_COOKIE);
  response.cookies.delete(MFA_PENDING_COOKIE);
}

/**
 * Set MFA pending state in response cookies
 */
export function setMfaPending(response: NextResponse, isPending: boolean): void {
  if (isPending) {
    response.cookies.set(MFA_PENDING_COOKIE, "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MFA_PENDING_MAX_AGE,
      path: "/",
    });
  } else {
    response.cookies.delete(MFA_PENDING_COOKIE);
  }
}

/**
 * Clear MFA pending state from response cookies
 */
export function clearMfaPending(response: NextResponse): void {
  response.cookies.delete(MFA_PENDING_COOKIE);
}
