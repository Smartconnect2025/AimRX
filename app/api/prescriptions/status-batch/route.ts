import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";
import {
  resolvePharmacyBackendsBatch,
  fetchDigitalRxStatus,
  mapDigitalRxStatus,
  type ResolvedBackend,
} from "../_shared/digitalrx-helpers";
import { fetchFedExTracking } from "../_shared/fedex-helpers";

/**
 * Batch Prescription Status Check API
 *
 * Retrieves status updates for multiple prescriptions from DigitalRx.
 * Pre-fetches pharmacy backends in bulk to avoid N+1 queries.
 */

interface BatchStatusRequest {
  prescription_ids?: string[];
  user_id?: string;
}

interface PrescriptionRow {
  id: string;
  queue_id: string | null;
  status: string;
  pharmacy_id: string | null;
  tracking_number: string | null;
  fedex_status: string | null;
  estimated_delivery: string | null;
  last_tracking_check: string | null;
}

async function fetchPrescriptions(
  supabase: ReturnType<typeof createAdminClient>,
  body: BatchStatusRequest,
): Promise<{ data: PrescriptionRow[] | null; error: string | null }> {
  let query = supabase
    .from("prescriptions")
    .select(
      "id, queue_id, status, pharmacy_id, tracking_number, fedex_status, estimated_delivery, last_tracking_check",
    );

  if (body.prescription_ids && body.prescription_ids.length > 0) {
    query = query.in("id", body.prescription_ids);
  } else if (body.user_id) {
    query = query.eq("prescriber_id", body.user_id);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Database error fetching prescriptions:", error);
    return { data: null, error: "Failed to fetch prescriptions" };
  }

  return { data, error: null };
}

async function processPrescription(
  supabase: ReturnType<typeof createAdminClient>,
  prescription: PrescriptionRow,
  backendMap: Map<string, ResolvedBackend>,
) {
  const TRACKING_CHECK_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

  // Return current DB status as baseline
  const dbResult = {
    prescription_id: prescription.id,
    queue_id: prescription.queue_id,
    success: true,
    updated_status: prescription.status,
    tracking_number: prescription.tracking_number,
    fedex_status: prescription.fedex_status,
    estimated_delivery: prescription.estimated_delivery,
  };

  if (!prescription.queue_id) {
    return dbResult;
  }

  const backend =
    (prescription.pharmacy_id
      ? backendMap.get(prescription.pharmacy_id)
      : null) || backendMap.get("__default__");

  // DigitalRx status check (non-blocking)
  let newStatus = prescription.status;
  let trackingNumber = prescription.tracking_number;

  // update prescription with digitalrx data
  if (backend) {
    try {
      const apiResult = await fetchDigitalRxStatus(
        backend,
        prescription.queue_id,
      );

      if (apiResult.success) {
        const mapped = mapDigitalRxStatus(apiResult.data, prescription.status);
        newStatus = mapped.newStatus;
        trackingNumber = mapped.trackingNumber || trackingNumber;

        // Update database only if something changed
        const updates: { status?: string; tracking_number?: string } = {};
        if (newStatus !== prescription.status) {
          updates.status = newStatus;
        }
        if (mapped.trackingNumber) {
          updates.tracking_number = mapped.trackingNumber;
        }

        if (Object.keys(updates).length > 0) {
          console.error(
            `[status-batch] Updating prescription ${prescription.id}: ${JSON.stringify(updates)}`,
          );
          await supabase
            .from("prescriptions")
            .update(updates)
            .eq("id", prescription.id);
        }
      }
    } catch {
      // DigitalRx failed — continue with DB data
    }
  }

  // FedEx tracking: call if we have a tracking number and haven't checked recently
  let fedexStatus = prescription.fedex_status;
  let estimatedDelivery = prescription.estimated_delivery;

  if (trackingNumber) {
    const lastCheck = prescription.last_tracking_check
      ? new Date(prescription.last_tracking_check).getTime()
      : 0;
    const shouldCheck = Date.now() - lastCheck > TRACKING_CHECK_INTERVAL_MS;

    if (shouldCheck) {
      try {
        const fedexResult = await fetchFedExTracking(trackingNumber);
        if (fedexResult) {
          fedexStatus = fedexResult.fedexStatus;
          estimatedDelivery = fedexResult.estimatedDelivery;

          await supabase
            .from("prescriptions")
            .update({
              fedex_status: fedexStatus,
              estimated_delivery: estimatedDelivery,
              last_tracking_check: new Date().toISOString(),
            })
            .eq("id", prescription.id);
        }
      } catch {
        // FedEx failed — continue with DB data
      }
    }
  }

  return {
    prescription_id: prescription.id,
    queue_id: prescription.queue_id,
    success: true,
    updated_status: newStatus,
    tracking_number: trackingNumber,
    fedex_status: fedexStatus,
    estimated_delivery: estimatedDelivery,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: BatchStatusRequest = await request.json();
    const supabase = createAdminClient();

    // Validate input
    if (
      !(body.prescription_ids && body.prescription_ids.length > 0) &&
      !body.user_id
    ) {
      return NextResponse.json(
        { success: false, error: "Must provide prescription_ids or user_id" },
        { status: 400 },
      );
    }

    // Fetch prescriptions (unified query)
    const { data: prescriptions, error: fetchError } = await fetchPrescriptions(
      supabase,
      body,
    );

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: fetchError },
        { status: 500 },
      );
    }

    if (!prescriptions || prescriptions.length === 0) {
      return NextResponse.json(
        { success: true, statuses: [] },
        { status: 200 },
      );
    }

    // Pre-fetch all pharmacy backends in bulk (fixes N+1 query problem)
    const pharmacyIds = prescriptions
      .map((p) => p.pharmacy_id)
      .filter((id): id is string => id !== null);

    const backendMap = await resolvePharmacyBackendsBatch(
      supabase,
      pharmacyIds,
    );

    // Process all prescriptions in parallel
    const statuses = await Promise.all(
      prescriptions.map((prescription) =>
        processPrescription(supabase, prescription, backendMap),
      ),
    );

    return NextResponse.json({ success: true, statuses }, { status: 200 });
  } catch (error) {
    console.error("Batch Status Check Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        ...(process.env.NODE_ENV === "development" && {
          error_details: error instanceof Error ? error.stack : String(error),
        }),
      },
      { status: 500 },
    );
  }
}
