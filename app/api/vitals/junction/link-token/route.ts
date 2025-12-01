import { JunctionHealthDataService } from "@/features/vitals/services/junctionHealthData";
import { createServerClient } from "@core/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Junction user ID and create service instance
    const junctionUserId = await JunctionHealthDataService.getJunctionUserId(
      user.id,
    );
    const healthService = new JunctionHealthDataService(
      user.id,
      junctionUserId,
    );
    const linkToken = await healthService.generateLinkToken();

    return NextResponse.json({
      link_token: linkToken,
      success: true,
    });
  } catch (error) {
    console.error("Failed to generate link token:", error);
    return NextResponse.json(
      {
        error: "Failed to generate link token",
        success: false,
      },
      { status: 500 },
    );
  }
}
