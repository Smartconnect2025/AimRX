"use client";
/**
 * Client-side Authentication Context Provider
 *
 * Provides user authentication state to client components and manages
 * authentication state changes.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { createClient } from "@core/supabase";
import { User } from "@supabase/supabase-js"; // Import User type
import { SerializedUser, serializeUser, getUserRole } from "./auth-utils";

// Define types
type UserContextType = {
  user: SerializedUser;
  userRole: string | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
};

// Create context
const UserContext = createContext<UserContextType | undefined>(undefined);

// The Supabase client should be initialized outside the component to prevent re-creation on every render.
const supabase = createClient();

/**
 * Helper function to get a cookie value by name
 */
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null;
  }
  return null;
}

/**
 * Client-side authentication state provider component
 *
 * This component:
 * 1. Manages user authentication state
 * 2. Listens for auth state changes from Supabase
 * 3. Provides the user data and role to child components
 * 4. Offers a way to refresh authentication data
 *
 * @param props - Component props
 * @param props.children - Child components to wrap with authentication context
 * @param props.user - Initial user data from server
 * @param props.userRole - Initial user role from server
 * @returns A component tree with authentication context
 */
export function UserClient({
  children,
  user: initialUser,
  userRole: initialUserRole,
}: {
  children: React.ReactNode;
  user: SerializedUser;
  userRole: string | null;
}) {
  const [currentUser, setCurrentUser] = useState<SerializedUser>(initialUser);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(
    initialUserRole,
  );
  const [isLoading, setIsLoading] = useState(!initialUser); // Start with loading true if no initial user

  const refresh = useCallback(async () => {
    // Only set loading if we don't have a user yet, or to avoid quick flashes
    if (!currentUser) {
      setIsLoading(true);
    }

    let newSupabaseUser: User | null = null;

    try {
      const {
        data: { user: supaUser },
      } = await supabase.auth.getUser();
      newSupabaseUser = supaUser;
    } catch {
      // Potentially handle by setting user to null if fetch fails
      setCurrentUser(null);
      setCurrentUserRole(null);
      setIsLoading(false);
      return;
    }

    const newSerializedUser = newSupabaseUser
      ? serializeUser(newSupabaseUser)
      : null;

    // Try to get role from cookie first (set by middleware)
    let newExtractedUserRole: string | null = getCookie("user_role");

    // If not in cookie, fallback to database query
    if (!newExtractedUserRole && newSupabaseUser?.id) {
      newExtractedUserRole = await getUserRole(newSupabaseUser.id, supabase);
    }

    if (
      currentUser?.id !== newSerializedUser?.id ||
      (currentUser &&
        newSerializedUser &&
        JSON.stringify(currentUser) !== JSON.stringify(newSerializedUser))
    ) {
      setCurrentUser(newSerializedUser);
    }

    if (currentUserRole !== newExtractedUserRole) {
      setCurrentUserRole(newExtractedUserRole);
    }
    setIsLoading(false);
  }, [currentUser, currentUserRole]);

  useEffect(() => {
    // Initial explicit refresh if no initialUser was provided server-side,
    // or to ensure client is in sync if it was.
    // This also handles the case where the tab becomes active.

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (
          event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED" ||
          event === "USER_UPDATED" ||
          event === "INITIAL_SESSION"
        ) {
          refresh();
        } else if (event === "SIGNED_OUT") {
          setCurrentUser(null);
          setCurrentUserRole(null);
          refresh();
        }
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [refresh]); // refresh is memoized

  return (
    <UserContext.Provider
      value={{
        user: currentUser,
        userRole: currentUserRole,
        isLoading,
        refresh,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

/**
 * Hook to access the user authentication context
 *
 * @returns Authentication context with user data, role, loading state, and refresh function
 * @throws Error if used outside of UserProvider
 */
export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
