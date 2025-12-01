import {
  JunctionLabDataService,
  AppointmentAvailabilityRequest,
} from "@/features/labs/services/junctionLabData";
import { createServerClient } from "@core/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
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

    // Parse the request body
    const addressData: AppointmentAvailabilityRequest = await request.json();

    // Validate required fields
    if (
      !addressData.first_line ||
      !addressData.city ||
      !addressData.state ||
      !addressData.zip_code
    ) {
      return NextResponse.json(
        { error: "Missing required address fields" },
        { status: 400 },
      );
    }

    // Fetch appointment availability from Junction API
    const labService = new JunctionLabDataService(user.id, junctionUserId);
    const availabilityData =
      await labService.getAppointmentAvailability(addressData);

    return NextResponse.json(availabilityData);
  } catch (error) {
    console.error("Error fetching appointment availability:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointment availability" },
      { status: 500 },
    );
  }
}
