/**
 * API Route for Klaviyo Onboarding Completed Event
 */

import { NextRequest, NextResponse } from "next/server";
import { KlaviyoHelpers } from "@/core/services/crm/klaviyoService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { success: false, error: "Missing userId or email" },
        { status: 400 },
      );
    }

    const result = await KlaviyoHelpers.sendOnboardingCompleted(userId, email);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Failed to send Onboarding Completed event:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
