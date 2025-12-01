import { JunctionHealthDataService } from "@/features/vitals/services/junctionHealthData";
import { createServerClient } from "@core/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export interface CancelAppointmentRequest {
  orderId: string;
  cancellationReasonId: string;
}

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

    const body: CancelAppointmentRequest = await request.json();
    const { orderId, cancellationReasonId } = body;

    if (!orderId || !cancellationReasonId) {
      return NextResponse.json(
        { error: "Order ID and cancellation reason ID are required" },
        { status: 400 },
      );
    }

    // Cancel the appointment using Vital API
    const response = await JunctionHealthDataService.makeRequest(
      `/v3/order/${orderId}/phlebotomy/appointment/cancel`,
      {
        method: "PATCH",
        body: JSON.stringify({
          cancellation_reason_id: cancellationReasonId,
        }),
      },
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return NextResponse.json(
      { error: "Failed to cancel appointment" },
      { status: 500 },
    );
  }
}
