import { JunctionLabDataService } from "@/features/labs/services/junctionLabData";
import { createServerClient } from "@core/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create Junction user
    const junctionUserId = await JunctionLabDataService.getJunctionUserId(
      user.id,
    );

    // Fetch available lab tests from Vital API
    const labService = new JunctionLabDataService(user.id, junctionUserId);

    const labTestsData = await labService.getAvailableLabs();

    // Return data in the expected format
    return NextResponse.json({
      data: labTestsData,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching lab tests:", error);
    return NextResponse.json(
      { error: "Failed to fetch lab tests" },
      { status: 500 },
    );
  }
}
