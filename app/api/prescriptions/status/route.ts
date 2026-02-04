import { NextRequest, NextResponse } from "next/server";

/**
 * DigitalRx Prescription Status Check API
 *
 * Checks the status of a prescription using the QueueID from DigitalRx.
 */

const DIGITALRX_API_KEY = process.env.DIGITALRX_API_KEY || "12345678901234567890";
const DIGITALRX_STATUS_URL = "https://www.dbswebserver.com/DBSRestApi/API/RxRequestStatus";
const STORE_ID = "190190"; // Greenwich

interface StatusRequest {
  queue_id: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: StatusRequest = await request.json();

    // Validate required fields
    if (!body.queue_id) {
      return NextResponse.json(
        { success: false, error: "Missing queue_id" },
        { status: 400 }
      );
    }

    console.log("📋 Checking status for QueueID:", body.queue_id);

    // Build DigitalRx status request payload
    const statusPayload = {
      StoreID: STORE_ID,
      QueueID: body.queue_id,
    };

    // Request status from DigitalRx API
    const digitalRxResponse = await fetch(DIGITALRX_STATUS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": DIGITALRX_API_KEY,
      },
      body: JSON.stringify(statusPayload),
    });

    if (!digitalRxResponse.ok) {
      const errorText = await digitalRxResponse.text().catch(() => "Unknown error");
      console.error("❌ DigitalRx status check error:", digitalRxResponse.status, errorText);
      return NextResponse.json(
        {
          success: false,
          error: `DigitalRx API error: ${digitalRxResponse.status} ${digitalRxResponse.statusText}`,
          details: errorText,
        },
        { status: digitalRxResponse.status }
      );
    }

    const statusData = await digitalRxResponse.json();
    console.log("📥 DigitalRx Status Response:", statusData);

    return NextResponse.json(
      {
        success: true,
        status: statusData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Status Check Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        ...(process.env.NODE_ENV === "development" && {
          error_details: error instanceof Error ? error.stack : String(error),
        }),
      },
      { status: 500 }
    );
  }
}
