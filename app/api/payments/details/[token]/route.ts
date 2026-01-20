import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";

/**
 * GET /api/payments/details/[token]
 * Get payment details by token (for patient magic link)
 * No authentication required - uses secure token
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  console.log("[PAYMENT:details] ========== START ==========");

  try {
    const { token } = await params;

    console.log("[PAYMENT:details] Token received:", token?.substring(0, 16) + "...");

    if (!token) {
      console.log("[PAYMENT:details] ERROR: Missing payment token");
      return NextResponse.json({ error: "Payment token is required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    console.log("[PAYMENT:details] Querying payment transaction...");

    // Get payment transaction by token
    const { data: payment, error } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("payment_token", token)
      .single();

    if (error || !payment) {
      console.log("[PAYMENT:details] ERROR: Payment not found", {
        token: token?.substring(0, 16) + "...",
        error,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Payment not found or link is invalid"
        },
        { status: 404 }
      );
    }

    console.log("[PAYMENT:details] Payment found:", {
      id: payment.id,
      status: payment.payment_status,
      orderProgress: payment.order_progress,
      amount: payment.total_amount_cents,
    });

    // Check if payment link has expired
    const expiresAt = payment.payment_link_expires_at
      ? new Date(payment.payment_link_expires_at)
      : null;
    const now = new Date();

    console.log("[PAYMENT:details] Checking expiration:", {
      expiresAt: expiresAt?.toISOString(),
      now: now.toISOString(),
      isExpired: expiresAt ? expiresAt < now : false,
    });

    if (expiresAt && expiresAt < now) {
      console.log("[PAYMENT:details] ERROR: Payment link expired");
      return NextResponse.json(
        {
          success: false,
          error: "Payment link has expired",
        },
        { status: 410 }
      );
    }

    console.log("[PAYMENT:details] SUCCESS - Returning payment details");
    console.log("[PAYMENT:details] ========== END ==========");

    // Return payment details (without sensitive info)
    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        totalAmountCents: payment.total_amount_cents,
        consultationFeeCents: payment.consultation_fee_cents,
        medicationCostCents: payment.medication_cost_cents,
        patientName: payment.patient_name,
        patientEmail: payment.patient_email,
        providerName: payment.provider_name,
        pharmacyName: payment.pharmacy_name,
        description: payment.description,
        paymentLinkUrl: payment.payment_link_url,
        paymentStatus: payment.payment_status,
        orderProgress: payment.order_progress,
        deliveryMethod: payment.delivery_method || "pickup",
        expiresAt: payment.payment_link_expires_at,
      },
    });
  } catch (error) {
    console.log("[PAYMENT:details] FATAL ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load payment details",
      },
      { status: 500 }
    );
  }
}
