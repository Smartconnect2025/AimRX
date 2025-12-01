import { JunctionLabDataService } from "@/features/labs/services/junctionLabData";
import { JunctionHealthDataService } from "@/features/vitals/services/junctionHealthData";
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
    const patientId = searchParams.get("patientId");
    const orderIds = searchParams.get("order_ids");

    // Handle different use cases:
    // 1. If order_ids provided (for labs history view) - use logged-in user
    // 2. If patientId provided (for EMR) - use patient ID
    // 3. If neither provided (for personal labs) - use logged-in user
    const targetUserId = patientId || user.id;

    // Get Junction user ID for the target user
    const junctionUserId =
      await JunctionHealthDataService.getJunctionUserId(targetUserId);

    // Create lab data service instance for the target user
    const labService = new JunctionLabDataService(targetUserId, junctionUserId);

    // If order_ids are provided, fetch specific order results
    if (orderIds) {
      // This is for the labs history view - fetch specific order results
      const orderIdsArray = orderIds.split(",");
      const labResults =
        await labService.getLabResultsByOrderIds(orderIdsArray);

      return NextResponse.json({
        user_id: junctionUserId,
        lab_results: labResults,
        success: true,
      });
    } else {
      // This is for EMR or personal labs - fetch all lab data
      const labData = await labService.getLabData();

      return NextResponse.json({
        data: labData,
        success: true,
      });
    }
  } catch (error) {
    console.error("Failed to fetch lab data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch lab data",
        success: false,
      },
      { status: 500 },
    );
  }
}
