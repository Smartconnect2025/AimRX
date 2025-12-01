import { NextRequest, NextResponse } from "next/server";
import { CometChatHelpers } from "@/core/services/chat/cometchatService";
import { createClient } from "@/core/supabase";
import { getUser } from "@/core/auth";

// Response data type
interface UserCreationResponse {
  success: boolean;
  data?: {
    authToken: string;
    user: {
      uid: string;
      name: string;
    };
  };
  error?: string;
}

// Simple in-memory cache to prevent duplicate requests
// Map: userId -> { promise, timestamp }
const ongoingRequests = new Map<
  string,
  { promise: Promise<UserCreationResponse>; timestamp: number }
>();

// Cleanup old requests every 30 seconds
setInterval(() => {
  const now = Date.now();
  const FIVE_MINUTES = 5 * 60 * 1000;

  for (const [userId, request] of ongoingRequests.entries()) {
    if (now - request.timestamp > FIVE_MINUTES) {
      ongoingRequests.delete(userId);
    }
  }
}, 30000);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, email, avatar, forceRecreate } = body;

    // Validate required fields
    if (!userId || !name) {
      console.error(
        "[API /cometchat/user] Validation failed: Missing required fields",
      );
      return NextResponse.json(
        { success: false, error: "Missing required fields: userId, name" },
        { status: 400 },
      );
    }

    // Check if CometChat is properly configured
    const { cometchatService } = await import(
      "@/core/services/chat/cometchatService"
    );
    if (!cometchatService.isEnabled()) {
      console.error(
        "[API /cometchat/user] CometChat is not properly configured",
      );
      return NextResponse.json(
        {
          success: false,
          error:
            "CometChat is not properly configured. Please check environment variables.",
        },
        { status: 500 },
      );
    }

    // Require authentication - this works for both login and registration
    // since Supabase creates a session immediately after signUp()
    const authResult = await getUser();
    if (!authResult.user) {
      console.error(
        "[API /cometchat/user] Authentication failed: No user session",
      );
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Validate that authenticated user matches requested userId
    if (authResult.user.id !== userId) {
      console.error("[API /cometchat/user] UserId mismatch:", {
        authenticated: authResult.user.id,
        requested: userId,
      });
      return NextResponse.json(
        { success: false, error: "Unauthorized - userId mismatch" },
        { status: 403 },
      );
    }

    // Check for duplicate requests
    const ongoingRequest = ongoingRequests.get(userId);
    if (ongoingRequest) {
      const result = await ongoingRequest.promise;
      // Create a new response object from the cached data
      return NextResponse.json(result, { status: result.success ? 200 : 500 });
    }

    // Create a promise for this request that returns data (not NextResponse)
    const requestPromise = (async () => {
      try {
        return await processUserCreation(
          userId,
          name,
          email,
          avatar,
          forceRecreate,
        );
      } finally {
        // Remove from cache after completion
        ongoingRequests.delete(userId);
      }
    })();

    // Store in cache
    ongoingRequests.set(userId, {
      promise: requestPromise,
      timestamp: Date.now(),
    });

    const result = await requestPromise;
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error) {
    console.error("[API /cometchat/user] Unhandled exception:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Separate function to process user creation
async function processUserCreation(
  userId: string,
  name: string,
  email?: string,
  avatar?: string,
  forceRecreate?: boolean,
): Promise<UserCreationResponse> {
  try {
    const supabase = createClient();

    // If forceRecreate is true, delete stale token and recreate
    if (forceRecreate) {
      console.log(
        "[API /cometchat/user] Force recreate requested, clearing stale token",
      );

      // Delete the DB record to clear stale token
      await supabase.from("cometchat_users").delete().eq("user_id", userId);

      // Try to fetch user from CometChat
      const { cometchatService } = await import(
        "@/core/services/chat/cometchatService"
      );
      const cometchatUser = await cometchatService.getUser(userId);

      if (cometchatUser.success && cometchatUser.data) {
        // User exists in CometChat, just generate new token
        console.log(
          "[API /cometchat/user] User exists in CometChat, generating new token",
        );
        const tokenResult = await CometChatHelpers.generateAuthToken(userId);

        if (!tokenResult.success || !tokenResult.data) {
          return {
            success: false,
            error: tokenResult.error || "Failed to generate auth token",
          };
        }

        // Store new token in DB
        await supabase
          .from("cometchat_users")
          .upsert({
            user_id: userId,
            cometchat_auth_token: tokenResult.data.authToken,
          })
          .select();

        return {
          success: true,
          data: {
            authToken: tokenResult.data.authToken,
            user: { uid: userId, name },
          },
        };
      } else {
        // User doesn't exist in CometChat, create new user
        console.log(
          "[API /cometchat/user] User doesn't exist in CometChat, creating new user",
        );
        // Fall through to create new user below
      }
    }

    // First check if user already exists in our database
    const { data: existingUser, error: dbLookupError } = await supabase
      .from("cometchat_users")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (dbLookupError) {
      console.error(
        "[API /cometchat/user] Database lookup error:",
        dbLookupError,
      );
    }

    if (existingUser && !forceRecreate) {
      // User exists, use the existing auth token
      if (!existingUser.cometchat_auth_token) {
        // Generate new auth token if none exists
        const tokenResult = await CometChatHelpers.generateAuthToken(userId);

        if (!tokenResult.success || !tokenResult.data) {
          console.error(
            "[API /cometchat/user] Failed to generate auth token:",
            tokenResult.error,
          );
          return {
            success: false,
            error: tokenResult.error || "Failed to generate auth token",
          };
        }

        // Update the auth token in database
        const { error: updateError } = await supabase
          .from("cometchat_users")
          .update({
            cometchat_auth_token: tokenResult.data.authToken,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        if (updateError) {
          console.error(
            "[API /cometchat/user] Failed to update CometChat auth token in database:",
            updateError,
          );
          return {
            success: false,
            error: "Failed to update auth token in database",
          };
        }

        return {
          success: true,
          data: {
            authToken: tokenResult.data.authToken,
            user: { uid: userId, name },
          },
        };
      }

      // Use existing auth token
      return {
        success: true,
        data: {
          authToken: existingUser.cometchat_auth_token,
          user: { uid: userId, name },
        },
      };
    }

    // Fetch user's avatar from profile if not provided
    let userAvatar = avatar;
    if (!userAvatar) {
      // Try to get avatar from provider profile
      const { data: providerData } = await supabase
        .from("providers")
        .select("avatar_url")
        .eq("user_id", userId)
        .maybeSingle();

      if (providerData?.avatar_url) {
        userAvatar = providerData.avatar_url;
      } else {
        // Try to get avatar from patient profile
        const { data: patientData } = await supabase
          .from("patients")
          .select("avatar_url")
          .eq("user_id", userId)
          .maybeSingle();

        if (patientData?.avatar_url) {
          userAvatar = patientData.avatar_url;
        }
      }
    }

    // Create new CometChat user and get auth token
    const result = await CometChatHelpers.createUserWithAuth(
      userId,
      name,
      email,
      userAvatar,
    );

    if (!result.success || !result.data) {
      console.error(
        "[API /cometchat/user] Failed to create CometChat user:",
        result.error,
      );
      return {
        success: false,
        error: result.error || "Failed to create CometChat user",
      };
    }

    // Store the auth token in database
    const { error: dbError } = await supabase
      .from("cometchat_users")
      .upsert({
        user_id: userId,
        cometchat_auth_token: result.data.authToken,
      })
      .select();

    if (dbError) {
      console.error(
        "[API /cometchat/user] Failed to store CometChat auth token in database:",
        dbError,
      );
      return {
        success: false,
        error: "Failed to store auth token in database",
      };
    }

    return {
      success: true,
      data: {
        authToken: result.data.authToken,
        user: result.data.user,
      },
    };
  } catch (error) {
    console.error(
      "[API /cometchat/user] Exception in processUserCreation:",
      error,
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
