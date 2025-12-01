import {
  JunctionLabDataService,
  BookAppointmentRequest,
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
    const { orderId, booking_key }: { orderId: string; booking_key: string } =
      await request.json();

    // Validate required fields
    if (!orderId || !booking_key) {
      return NextResponse.json(
        { error: "Missing required fields: orderId and booking_key" },
        { status: 400 },
      );
    }

    // Book the appointment through Junction API
    const labService = new JunctionLabDataService(user.id, junctionUserId);
    const bookingRequest: BookAppointmentRequest = { booking_key };
    const result = await labService.bookAppointment(orderId, bookingRequest);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: result.message || "Failed to book appointment" },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Error booking appointment:", error);
    return NextResponse.json(
      { error: "Failed to book appointment" },
      { status: 500 },
    );
  }
}
