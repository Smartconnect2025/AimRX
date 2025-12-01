import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@core/auth";
import { CometChatHelpers } from "@core/services/chat/cometchatService";

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authResult = await getUser();
    if (!authResult.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { avatarUrl } = await request.json();

    if (!avatarUrl || typeof avatarUrl !== "string") {
      return NextResponse.json(
        { success: false, error: "Avatar URL is required" },
        { status: 400 },
      );
    }

    // Update the user's avatar in CometChat
    const result = await CometChatHelpers.updateUserAvatar(
      authResult.user.id,
      avatarUrl,
    );

    if (!result.success) {
      console.error("Failed to update CometChat user avatar:", result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to update avatar in CometChat",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Error updating CometChat user avatar:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
