import { NextRequest, NextResponse } from "next/server";
import { mockProviderTiers } from "../../mock-tier-assignments";
import { mockTierStore } from "../../../tiers/mock-store";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const providerId = params.id;

    if (!providerId) {
      return NextResponse.json(
        { error: "Provider ID is required" },
        { status: 400 }
      );
    }

    // Get tier code from mock provider tiers
    const tierCode = mockProviderTiers.getTier(providerId);

    if (!tierCode) {
      return NextResponse.json({
        tier_level: "Not set",
        tier_code: null,
      });
    }

    // Get tier details from mock tier store
    const tier = mockTierStore.getTierByCode(tierCode);

    if (!tier) {
      return NextResponse.json({
        tier_level: "Not set",
        tier_code: tierCode,
      });
    }

    return NextResponse.json({
      tier_level: `${tier.tier_name} (${tier.discount_percentage}%)`,
      tier_code: tierCode,
      tier_details: tier,
    });
  } catch (error) {
    console.error("Error fetching provider tier:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
