import { NextRequest, NextResponse } from "next/server";
import { createServerClient, createAdminClient } from "@core/supabase/server";
import sgMail from "@sendgrid/mail";

interface AccessRequestData {
  type: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  form_data?: {
    pharmacyName?: string;
    companyName?: string;
  };
}

async function sendApprovalEmail(accessRequest: AccessRequestData) {
  const sendGridApiKey = process.env.SENDGRID_API_KEY;
  if (!sendGridApiKey) return;

  sgMail.setApiKey(sendGridApiKey);

  const isDoctor = accessRequest.type === "doctor";
  const recipientName = isDoctor
    ? `Dr. ${accessRequest.lastName}`
    : accessRequest.form_data?.pharmacyName || accessRequest.form_data?.companyName || `${accessRequest.firstName}`;

  const accountType = isDoctor ? "Provider" : "Pharmacy";

  const emailSubject = `Your AIM RX ${accountType} Access Request Has Been Approved!`;
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #00AEEF 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <img src="https://i.imgur.com/r65O4DB.png" alt="AIM Medical Technologies" style="height: 80px; margin-bottom: 15px;" />
        <h1 style="color: white; margin: 0; font-size: 24px;">Access Request Approved!</h1>
      </div>

      <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Hello ${recipientName},
        </p>

        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Great news! Your request to join the AIM RX Portal as a <strong>${accountType}</strong> has been approved.
        </p>

        <div style="background: #D1FAE5; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; color: #065F46;">
            <strong>✅ Your application has been reviewed and approved by our team.</strong>
          </p>
        </div>

        <div style="background: #DBEAFE; border-left: 4px solid #2563EB; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #1E3A8A;">
            <strong>📋 What happens next?</strong>
          </p>
          <p style="margin: 0; font-size: 14px; color: #1E3A8A;">
            Our team will create your account and send you a separate email with your login credentials. This typically happens within 1-2 business days.
          </p>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #6b7280; margin-top: 30px;">
          If you have any questions or need assistance, please contact our support team at <a href="mailto:support@aimrx.com" style="color: #00AEEF;">support@aimrx.com</a>.
        </p>

        <p style="font-size: 16px; line-height: 1.6; margin-top: 20px;">
          Best regards,<br>
          <strong>AIM RX Portal Team</strong>
        </p>
      </div>

      <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
        <p style="margin: 5px 0;">© ${new Date().getFullYear()} AIM Medical Technologies. All rights reserved.</p>
      </div>
    </div>
  `;

  const msg = {
    to: accessRequest.email,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL || "noreply@aimrx.com",
      name: process.env.SENDGRID_FROM_NAME || "AIM RX Portal",
    },
    subject: emailSubject,
    html: emailHtml,
  };

  await sgMail.send(msg);
}

/**
 * Approve or reject an access request
 * PATCH /api/access-requests/[id]
 * Body: { action: 'approve' | 'reject', rejectionReason?: string, password?: string }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const supabaseAdmin = await createAdminClient();
    const { id: requestId } = await params;

    // Check authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Check if user has admin role
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (userRole?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { action, rejectionReason } = body;

    if (!action || (action !== "approve" && action !== "reject")) {
      return NextResponse.json(
        { success: false, error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    // Get the access request
    const { data: accessRequest, error: fetchError } = await supabaseAdmin
      .from("access_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchError || !accessRequest) {
      return NextResponse.json(
        { success: false, error: "Access request not found" },
        { status: 404 }
      );
    }

    if (accessRequest.status !== "pending") {
      return NextResponse.json(
        { success: false, error: `Request has already been ${accessRequest.status}` },
        { status: 400 }
      );
    }

    if (action === "reject") {
      // Update request status to rejected
      const { error: updateError } = await supabaseAdmin
        .from("access_requests")
        .update({
          status: "rejected",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason || null,
        })
        .eq("id", requestId);

      if (updateError) {
        console.error("Error updating access request:", updateError);
        return NextResponse.json(
          { success: false, error: "Failed to reject request" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Access request rejected successfully",
      });
    }

    // Handle approval - mark as approved and send notification email
    if (action === "approve") {
      // Update access request status to approved
      const { error: updateError } = await supabaseAdmin
        .from("access_requests")
        .update({
          status: "approved",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (updateError) {
        console.error("Error updating access request:", updateError);
        return NextResponse.json(
          { success: false, error: "Failed to approve request" },
          { status: 500 }
        );
      }

      // Send approval notification email
      try {
        await sendApprovalEmail({
          type: accessRequest.type,
          firstName: accessRequest.first_name,
          lastName: accessRequest.last_name,
          email: accessRequest.email,
          form_data: accessRequest.form_data as AccessRequestData["form_data"],
        });
      } catch (emailError) {
        console.error("Error sending approval email:", emailError);
        // Don't fail the request if email fails
      }

      return NextResponse.json({
        success: true,
        message: "Access request approved and notification email sent",
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error processing access request action:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process request",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
