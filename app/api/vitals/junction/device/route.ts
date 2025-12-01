import { JunctionHealthDataService } from "@/features/vitals/services/junctionHealthData";
import { createServerClient } from "@core/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const deviceId = searchParams.get("deviceId");

    if (!deviceId) {
      return NextResponse.json(
        { error: "Device ID is required" },
        { status: 400 },
      );
    }

    // Get Junction user ID and create service instance
    const junctionUserId = await JunctionHealthDataService.getJunctionUserId(
      user.id,
    );
    const healthService = new JunctionHealthDataService(
      user.id,
      junctionUserId,
    );
    await healthService.disconnectDevice(deviceId);

    return NextResponse.json({
      message: "Device disconnected successfully",
      success: true,
    });
  } catch (error) {
    console.error("Failed to disconnect device:", error);
    return NextResponse.json(
      {
        error: "Failed to disconnect device",
        success: false,
      },
      { status: 500 },
    );
  }
}
