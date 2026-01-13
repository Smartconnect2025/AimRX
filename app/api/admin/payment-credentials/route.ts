import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";
import { getUser } from "@/core/auth/get-user";
import { encryptAuthNetKey } from "@/core/services/encryption/authnet-encryption";

/**
 * GET /api/admin/payment-credentials
 * Load AMRX Authorize.Net credentials (admin only)
 */
export async function GET() {
  try {
    const { user, userRole } = await getUser();

    if (!user || userRole !== "admin") {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const supabase = createAdminClient();

    // Get active payment credentials
    const { data: credentials, error } = await supabase
      .from("payment_credentials")
      .select("*")
      .eq("is_active", true)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found, which is ok
      console.error("Error loading payment credentials:", error);
      return NextResponse.json({ error: "Failed to load credentials" }, { status: 500 });
    }

    if (!credentials) {
      // No credentials configured yet
      return NextResponse.json({
        success: true,
        credentials: null,
      });
    }

    // Return credentials with masked keys for security
    return NextResponse.json({
      success: true,
      credentials: {
        id: credentials.id,
        apiLoginId: credentials.api_login_id,
        // Don't return actual encrypted keys - show masked version
        transactionKey: credentials.transaction_key_encrypted
          ? "••••••••••••" + credentials.transaction_key_encrypted.slice(-4)
          : "",
        publicClientKey: credentials.public_client_key,
        signatureKey: credentials.signature_key_encrypted
          ? "••••••••••••" + credentials.signature_key_encrypted.slice(-4)
          : "",
        environment: credentials.environment,
        isVerified: credentials.is_verified,
        lastVerifiedAt: credentials.last_verified_at,
        verificationError: credentials.verification_error,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/admin/payment-credentials:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/payment-credentials
 * Save AMRX Authorize.Net credentials (admin only, encrypted)
 */
export async function POST(request: NextRequest) {
  try {
    const { user, userRole } = await getUser();

    if (!user || userRole !== "admin") {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const {
      apiLoginId,
      transactionKey,
      publicClientKey,
      signatureKey,
      environment,
    } = body;

    // Validate required fields
    if (!apiLoginId || !transactionKey) {
      return NextResponse.json(
        { error: "API Login ID and Transaction Key are required" },
        { status: 400 }
      );
    }

    if (!["sandbox", "live"].includes(environment)) {
      return NextResponse.json({ error: "Environment must be 'sandbox' or 'live'" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Encrypt sensitive keys
    let transactionKeyEncrypted: string;
    let signatureKeyEncrypted: string | null = null;

    try {
      transactionKeyEncrypted = encryptAuthNetKey(transactionKey);
      if (signatureKey) {
        signatureKeyEncrypted = encryptAuthNetKey(signatureKey);
      }
    } catch (error) {
      console.error("Encryption error:", error);
      return NextResponse.json(
        { error: "Failed to encrypt keys. Check AUTHNET_ENCRYPTION_KEY in environment." },
        { status: 500 }
      );
    }

    // Deactivate all existing credentials first
    await supabase
      .from("payment_credentials")
      .update({ is_active: false })
      .eq("is_active", true);

    // Insert new credentials
    const { data: newCredentials, error: insertError } = await supabase
      .from("payment_credentials")
      .insert({
        merchant_name: "AMRX",
        api_login_id: apiLoginId,
        transaction_key_encrypted: transactionKeyEncrypted,
        public_client_key: publicClientKey || null,
        signature_key_encrypted: signatureKeyEncrypted,
        environment,
        is_active: true,
        is_verified: false, // Will be verified on first test
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting payment credentials:", insertError);
      return NextResponse.json({ error: "Failed to save credentials" }, { status: 500 });
    }

    console.log("✅ Payment credentials saved successfully:", {
      id: newCredentials.id,
      environment,
    });

    return NextResponse.json({
      success: true,
      message: "Payment credentials saved and encrypted successfully",
      credentialsId: newCredentials.id,
    });
  } catch (error) {
    console.error("Error in POST /api/admin/payment-credentials:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
