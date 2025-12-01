/**
 * CometChat Integration Service
 * Handles CometChat user creation and authentication token management.
 * Server-side service for secure CometChat API operations.
 */

import { envConfig } from "@core/config";

export interface CometChatUser {
  uid: string;
  name: string;
  avatar?: string;
  link?: string;
  role?: "default"; // Only valid CometChat role
  statusMessage?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  withAuthToken?: boolean;
}

export interface CometChatUserResponse {
  data: {
    uid: string;
    name: string;
    link?: string;
    avatar?: string;
    metadata?: {
      rawMetadata?: string;
    };
    status: string;
    role?: string;
    createdAt: number;
    tags?: string[];
    authToken?: string;
  };
}

export interface CometChatAuthTokenResponse {
  data: {
    uid: string;
    authToken: string;
    createdAt: number;
  };
}

export interface CometChatErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

class CometChatService {
  private readonly appId: string;
  private readonly region: string;
  private readonly apiKey: string;
  private readonly restApiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.appId = envConfig.NEXT_PUBLIC_COMETCHAT_APP_ID;
    this.region = envConfig.NEXT_PUBLIC_COMETCHAT_REGION;
    this.apiKey = envConfig.NEXT_PUBLIC_COMETCHAT_AUTH_KEY;
    this.restApiKey = envConfig.COMETCHAT_REST_API_KEY;
    this.baseUrl = `https://${this.appId}.api-${this.region}.cometchat.io/v3`;
  }

  isEnabled(): boolean {
    const enabled = Boolean(this.appId && this.region && this.apiKey);
    return enabled;
  }

  /**
   * Get a user by UID from CometChat
   */
  async getUser(
    uid: string,
  ): Promise<ApiResponse<CometChatUserResponse["data"]>> {
    if (!this.isEnabled()) {
      return {
        success: false,
        error:
          "CometChat is not properly configured. Missing required environment variables.",
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/users/${uid}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          apikey: this.restApiKey || this.apiKey, // Use REST API key for server-side operations
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            error: "User not found",
          };
        }
        const errorData: CometChatErrorResponse = await response.json();
        throw new Error(
          `CometChat API error: ${errorData.error?.message || "Unknown error"}`,
        );
      }

      const result: CometChatUserResponse = await response.json();

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        return {
          success: false,
          error: `Network error: ${error.message}. Please check your CometChat configuration and network connectivity.`,
        };
      }

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Create a new user in CometChat
   */
  async createUser(
    userData: CometChatUser,
  ): Promise<ApiResponse<CometChatUserResponse["data"]>> {
    if (!this.isEnabled()) {
      return {
        success: false,
        error:
          "CometChat is not properly configured. Missing required environment variables.",
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: this.restApiKey || this.apiKey, // Use REST API key for server-side operations
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData: CometChatErrorResponse = await response.json();
        console.error(
          "[CometChatService] CometChat API error:",
          errorData.error?.message,
          errorData.error?.details,
        );

        throw new Error(
          `CometChat API error: ${errorData.error?.message || "Unknown error"}`,
        );
      }

      const result: CometChatUserResponse = await response.json();

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      // Add more detailed error information
      if (error instanceof TypeError && error.message.includes("fetch")) {
        console.error("[CometChatService] Network error:", error);
        return {
          success: false,
          error: `Network error: ${error.message}. Please check your CometChat configuration and network connectivity.`,
        };
      }

      console.error("[CometChatService] Error creating user:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Generate auth token for a user
   */
  async createAuthToken(
    uid: string,
    force: boolean = true,
  ): Promise<ApiResponse<CometChatAuthTokenResponse["data"]>> {
    if (!this.isEnabled()) {
      return {
        success: false,
        error:
          "CometChat is not properly configured. Missing required environment variables.",
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/users/${uid}/auth_tokens`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: this.restApiKey || this.apiKey, // Use REST API key for server-side operations
        },
        body: JSON.stringify({ force }),
      });

      if (!response.ok) {
        const errorData: CometChatErrorResponse = await response.json();
        throw new Error(
          `CometChat API error: ${errorData.error?.message || "Unknown error"}`,
        );
      }

      const result: CometChatAuthTokenResponse = await response.json();

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      // Add more detailed error information
      if (error instanceof TypeError && error.message.includes("fetch")) {
        return {
          success: false,
          error: `Network error: ${error.message}. Please check your CometChat configuration and network connectivity.`,
        };
      }

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Update an existing CometChat user
   */
  async updateUser(
    uid: string,
    userData: Partial<CometChatUser>,
  ): Promise<ApiResponse<CometChatUserResponse["data"]>> {
    if (!this.isEnabled()) {
      return {
        success: false,
        error:
          "CometChat is not properly configured. Missing required environment variables.",
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/users/${uid}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          apikey: this.restApiKey || this.apiKey, // Use REST API key for server-side operations
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData: CometChatErrorResponse = await response.json();
        throw new Error(
          `CometChat API error: ${errorData.error?.message || "Unknown error"}`,
        );
      }

      const result: CometChatUserResponse = await response.json();

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      // Add more detailed error information
      if (error instanceof TypeError && error.message.includes("fetch")) {
        return {
          success: false,
          error: `Network error: ${error.message}. Please check your CometChat configuration and network connectivity.`,
        };
      }

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Create user and generate auth token in one operation
   */
  async createUserWithAuthToken(userData: CometChatUser): Promise<
    ApiResponse<{
      user: CometChatUserResponse["data"];
      authToken: string;
    }>
  > {
    // First create the user with withAuthToken=true
    const userWithToken = { ...userData, withAuthToken: true };
    const userResult = await this.createUser(userWithToken);

    if (!userResult.success || !userResult.data) {
      return {
        success: false,
        error: userResult.error || "Failed to create user",
      };
    }

    // If authToken is returned directly from user creation
    if (userResult.data.authToken) {
      return {
        success: true,
        data: {
          user: userResult.data,
          authToken: userResult.data.authToken,
        },
      };
    }

    // Fallback: Create auth token separately
    const tokenResult = await this.createAuthToken(userData.uid);

    if (!tokenResult.success || !tokenResult.data) {
      return {
        success: false,
        error: tokenResult.error || "Failed to create auth token",
      };
    }

    return {
      success: true,
      data: {
        user: userResult.data,
        authToken: tokenResult.data.authToken,
      },
    };
  }
}

// Export singleton instance
export const cometchatService = new CometChatService();

// Helper functions for easy access
export const CometChatHelpers = {
  /**
   * Create a complete CometChat user with auth token
   * If user already exists, generates auth token for existing user
   */
  async createUserWithAuth(
    dbUserId: string,
    name: string,
    email?: string,
    avatar?: string,
  ) {
    // Use the database UUID directly as the CometChat UID (no prefix needed)
    const cometchatUID = dbUserId;

    // First check if user already exists in CometChat
    const existingUser = await cometchatService.getUser(cometchatUID);

    if (existingUser.success && existingUser.data) {
      // User exists, just generate a new auth token
      const tokenResult = await cometchatService.createAuthToken(cometchatUID);

      if (!tokenResult.success || !tokenResult.data) {
        console.error(
          "[CometChatHelpers] Failed to generate auth token:",
          tokenResult.error,
        );
        return {
          success: false,
          error:
            tokenResult.error ||
            "Failed to generate auth token for existing user",
        };
      }

      return {
        success: true,
        data: {
          user: existingUser.data,
          authToken: tokenResult.data.authToken,
        },
      };
    }

    // Import sanitization function
    const { sanitizeNameForCometChat } = await import("./utils");

    // CometChat only accepts 'default' role, so we'll use that for all users
    const cometchatRole = "default";

    // Build metadata object, only including defined values
    const metadata: Record<string, unknown> = {};
    if (email) metadata.email = email;

    // Sanitize name to remove special characters that CometChat might reject
    const cleanName = sanitizeNameForCometChat(name);

    // Only include defined values to avoid validation issues
    const userData: CometChatUser = {
      uid: cometchatUID,
      name: cleanName,
      role: cometchatRole, // Always use 'default' role for CometChat
      tags: ["user"], // Use 'user' tag for identification
    };

    // Only add metadata if it has at least one value
    if (Object.keys(metadata).length > 0) {
      userData.metadata = metadata;
    }

    // Only add avatar if it's defined, not empty, and starts with https
    if (avatar && avatar.trim() && avatar.trim().startsWith("https://")) {
      userData.avatar = avatar.trim();
    }

    return await cometchatService.createUserWithAuthToken(userData);
  },

  /**
   * Generate auth token for existing user
   */
  async generateAuthToken(userId: string) {
    // The userId IS the CometChat UID (no conversion needed)
    return await cometchatService.createAuthToken(userId);
  },

  /**
   * Update user avatar in CometChat
   * Only updates if avatarUrl starts with https://
   */
  async updateUserAvatar(userId: string, avatarUrl: string) {
    // Validate avatar URL starts with https
    if (
      !avatarUrl ||
      !avatarUrl.trim() ||
      !avatarUrl.trim().startsWith("https://")
    ) {
      return {
        success: false,
        error: "Avatar URL must start with https://",
      };
    }

    // The userId IS the CometChat UID (no conversion needed)
    return await cometchatService.updateUser(userId, {
      avatar: avatarUrl.trim(),
    });
  },
};
