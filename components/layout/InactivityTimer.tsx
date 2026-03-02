"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

const INACTIVITY_LIMIT_MS = 30 * 60 * 1000;
const WARNING_BEFORE_MS = 60 * 1000;
const CHECK_INTERVAL_MS = 30 * 1000;
const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "scroll", "mousemove"];
const THROTTLE_MS = 10 * 1000;

const AUTH_PATHS = ["/auth/login", "/auth/logout", "/auth/verify-mfa", "/auth/signup"];

export function InactivityTimer() {
  const lastActivityRef = useRef(Date.now());
  const warningShownRef = useRef(false);
  const loggedOutRef = useRef(false);
  const pathname = usePathname();

  const isAuthPage = AUTH_PATHS.some((p) => pathname?.startsWith(p));

  const recordActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastActivityRef.current > THROTTLE_MS) {
      lastActivityRef.current = now;
      warningShownRef.current = false;
      try {
        sessionStorage.setItem("last_activity", now.toString());
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (isAuthPage) return;

    try {
      const stored = sessionStorage.getItem("last_activity");
      if (stored) {
        lastActivityRef.current = parseInt(stored, 10);
      }
    } catch {}

    ACTIVITY_EVENTS.forEach((event) =>
      document.addEventListener(event, recordActivity, { passive: true })
    );

    const interval = setInterval(() => {
      if (loggedOutRef.current) return;

      const idle = Date.now() - lastActivityRef.current;

      if (idle >= INACTIVITY_LIMIT_MS) {
        loggedOutRef.current = true;
        window.location.href = "/auth/logout?reason=inactivity";
        return;
      }

      if (idle >= INACTIVITY_LIMIT_MS - WARNING_BEFORE_MS && !warningShownRef.current) {
        warningShownRef.current = true;
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((event) =>
        document.removeEventListener(event, recordActivity)
      );
      clearInterval(interval);
    };
  }, [isAuthPage, recordActivity]);

  return null;
}
