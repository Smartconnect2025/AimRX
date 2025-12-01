import { JunctionHealthDataService } from "@/features/vitals/services/junctionHealthData";
import { createServerClient } from "@core/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export interface JunctionOrderEvent {
  id: number;
  created_at: string;
  status:
    | "received.walk_in_test.ordered"
    | "received.walk_in_test.requisition_created"
    | "received.walk_in_test.requisition_bypassed"
    | "collecting_sample.walk_in_test.appointment_pending"
    | "collecting_sample.walk_in_test.appointment_scheduled"
    | "collecting_sample.walk_in_test.appointment_cancelled"
    | "sample_with_lab.walk_in_test.partial_results"
    | "completed.walk_in_test.completed"
    | "failed.walk_in_test.sample_error"
    | "cancelled.walk_in_test.cancelled"
    | "received.at_home_phlebotomy.ordered"
    | "received.at_home_phlebotomy.requisition_created"
    | "received.at_home_phlebotomy.requisition_bypassed"
    | "collecting_sample.at_home_phlebotomy.appointment_pending"
    | "collecting_sample.at_home_phlebotomy.appointment_scheduled"
    | "collecting_sample.at_home_phlebotomy.draw_completed"
    | "collecting_sample.at_home_phlebotomy.appointment_cancelled"
    | "sample_with_lab.at_home_phlebotomy.partial_results"
    | "completed.at_home_phlebotomy.completed"
    | "cancelled.at_home_phlebotomy.cancelled"
    | "received.testkit.ordered"
    | "received.testkit.awaiting_registration"
    | "received.testkit.testkit_registered"
    | "received.testkit.requisition_created"
    | "received.testkit.requisition_bypassed"
    | "collecting_sample.testkit.transit_customer"
    | "collecting_sample.testkit.out_for_delivery"
    | "collecting_sample.testkit.with_customer"
    | "collecting_sample.testkit.transit_lab"
    | "collecting_sample.testkit.problem_in_transit_customer"
    | "collecting_sample.testkit.problem_in_transit_lab"
    | "sample_with_lab.testkit.delivered_to_lab"
    | "completed.testkit.completed"
    | "failed.testkit.failure_to_deliver_to_customer"
    | "failed.testkit.failure_to_deliver_to_lab"
    | "failed.testkit.sample_error"
    | "failed.testkit.lost"
    | "cancelled.testkit.cancelled"
    | "cancelled.testkit.do_not_process";
}

export interface JunctionOrder {
  id: string;
  user_id: string;
  events: Array<JunctionOrderEvent>;
  status:
    | "received"
    | "collecting_sample"
    | "sample_with_lab"
    | "completed"
    | "cancelled"
    | "failed";
  created_at: string;
  updated_at: string;
  patient_details: {
    dob: string;
    gender: "male" | "female";
  };
  patient_address: {
    receiver_name: string;
    first_line: string;
    second_line: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone_number: string;
  };
  // Adding test details to determine if schedulable
  lab_test?: {
    id: string;
    name: string;
    method: "walk_in_test" | "at_home_phlebotomy" | "testkit" | string;
    sample_type: string;
    price: number;
    fasting: boolean;
  };
}

export interface JunctionOrdersResponse {
  orders: Array<JunctionOrder>;
  total: number;
  page: number;
  size: number;
}

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
    const junctionUserId = await JunctionHealthDataService.getJunctionUserId(
      user.id,
    );

    // Fetch orders from Junction API, filtering by user_id
    const response =
      await JunctionHealthDataService.makeRequest<JunctionOrdersResponse>(
        `/v3/orders?user_id=${junctionUserId}`,
      );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching lab orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch lab orders" },
      { status: 500 },
    );
  }
}
