import { NextRequest, NextResponse } from "next/server";
import { mockProviderTiers } from "../mock-tier-assignments";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerId, tierCode } = body;

    if (!providerId || !tierCode) {
      return NextResponse.json(
        { error: "Missing providerId or tierCode" },
        { status: 400 }
      );
    }

    // Update tier assignment in mock store
    mockProviderTiers.setTier(providerId, tierCode);

    console.log(`✅ Tier assignment updated: Provider ${providerId} -> ${tierCode}`);

    return NextResponse.json({
      success: true,
      message: "Tier assignment updated successfully"
    });
  } catch (error) {
    console.error("Error updating tier assignment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
