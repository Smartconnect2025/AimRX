/**
 * Client-side CometChat Service
 * Provides easy-to-use functions for CometChat operations on the client side
 */

"use client";

export class ClientChatService {
  /**
   * Get or create auth token for a user
   * This method makes a single API call that handles everything:
   * - Checks database cache for existing token
   * - Returns cached token if exists
   * - Creates new user + token if doesn't exist
   * @param forceRecreate - If true, deletes stale token and recreates user/token
   */
  static async getOrCreateAuthToken(
    userId: string,
    name: string,
    email?: string,
    avatar?: string,
    forceRecreate?: boolean,
  ): Promise<{
    success: boolean;
    authToken?: string;
    error?: string;
  }> {
    try {
      // Make API call to ensure user exists and get auth token
      const response = await fetch("/api/cometchat/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ userId, name, email, avatar, forceRecreate }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "API call failed");
      }

      if (result.success && result.data?.authToken) {
        return {
          success: true,
          authToken: result.data.authToken,
        };
      }

      console.error(
        "[ClientChatService] Failed to get auth token:",
        result.error,
      );
      return {
        success: false,
        error: result.error || "Failed to get or create CometChat auth token",
      };
    } catch (error) {
      console.error(
        "[ClientChatService] Exception in getOrCreateAuthToken:",
        error,
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Ensure CometChat user exists (alias for getOrCreateAuthToken)
   * Used by login/registration and video calls
   */
  static async ensureUser(
    userId: string,
    name: string,
    email?: string,
    avatar?: string,
    forceRecreate?: boolean,
  ): Promise<{
    success: boolean;
    authToken?: string;
    error?: string;
  }> {
    return this.getOrCreateAuthToken(
      userId,
      name,
      email,
      avatar,
      forceRecreate,
    );
  }
}
