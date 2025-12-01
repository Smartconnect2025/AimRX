import { JunctionHealthDataService } from "@/features/vitals/services/junctionHealthData";
import { TimeRange } from "@/features/vitals/types/health";
import { createServerClient } from "@core/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const timeRangeParam = searchParams.get("timeRange");
    const patientId = searchParams.get("patientId");

    // Determine which user ID to use
    // If patientId is provided, use it (for EMR context)
    // Otherwise, use the logged-in user's ID (for personal vitals page)
    const targetUserId = patientId || user.id;

    // Default to 7 days for trial accounts to avoid API limitations
    const timeRange = timeRangeParam
      ? (parseInt(timeRangeParam) as TimeRange)
      : 7;

    if (![7, 30, 90].includes(timeRange)) {
      return NextResponse.json(
        { error: "Invalid time range. Must be 7, 30, or 90 days." },
        { status: 400 },
      );
    }

    // For trial accounts, limit to 7 days maximum
    const limitedTimeRange = Math.min(timeRange, 7) as TimeRange;

    // Get Junction user ID for the target user
    const junctionUserId =
      await JunctionHealthDataService.getJunctionUserId(targetUserId);
    const healthService = new JunctionHealthDataService(
      targetUserId,
      junctionUserId,
    );
    const healthData = await healthService.getHealthData(limitedTimeRange);

    return NextResponse.json({
      data: healthData,
      success: true,
    });
  } catch (error) {
    console.error("Failed to fetch health data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch health data",
        success: false,
      },
      { status: 500 },
    );
  }
}
