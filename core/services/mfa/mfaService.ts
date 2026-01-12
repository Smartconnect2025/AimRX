import { createAdminClient } from "@core/database/client";
import sgMail from "@sendgrid/mail";

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || "";
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "noreply@yourdomain.com";
const FROM_NAME = process.env.SENDGRID_FROM_NAME || "Your App";

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

/**
 * Generate a random 6-digit MFA code
 */
function generateMFACode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send MFA code via email
 */
export async function sendMFACode(userId: string, email: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!SENDGRID_API_KEY) {
      console.error("SendGrid API key not configured");
      return { success: false, error: "Email service not configured" };
    }

    const supabase = createAdminClient();

    // Generate 6-digit code
    const code = generateMFACode();

    // Set expiration to 1 hour from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 60);

    // Invalidate any existing unused codes for this user
    await supabase
      .from("mfa_codes")
      .update({ is_used: true })
      .eq("user_id", userId)
      .eq("is_used", false);

    // Store code in database
    const { error: dbError } = await supabase
      .from("mfa_codes")
      .insert({
        user_id: userId,
        code: code,
        expires_at: expiresAt.toISOString(),
        is_used: false,
      });

    if (dbError) {
      console.error("Error storing MFA code:", dbError);
      return { success: false, error: "Failed to generate verification code" };
    }

    // Send email with code
    const msg = {
      to: email,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: "Your Verification Code",
      text: `Your verification code is: ${code}\n\nThis code will expire in 1 hour.\n\nIf you didn't request this code, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Your Verification Code</h2>
          <p style="font-size: 16px; color: #666;">Enter this code to complete your login:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">${code}</span>
          </div>
          <p style="font-size: 14px; color: #999;">This code will expire in 1 hour.</p>
          <p style="font-size: 14px; color: #999;">If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    };

    await sgMail.send(msg);

    console.log(`✅ MFA code sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error("Error sending MFA code:", error);
    return { success: false, error: "Failed to send verification code" };
  }
}

/**
 * Verify MFA code
 */
export async function verifyMFACode(userId: string, code: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();

    // Find valid code
    const { data: mfaCode, error: fetchError } = await supabase
      .from("mfa_codes")
      .select("*")
      .eq("user_id", userId)
      .eq("code", code)
      .eq("is_used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !mfaCode) {
      return { success: false, error: "Invalid or expired code" };
    }

    // Mark code as used
    await supabase
      .from("mfa_codes")
      .update({ is_used: true })
      .eq("id", mfaCode.id);

    console.log(`✅ MFA code verified for user ${userId}`);
    return { success: true };
  } catch (error) {
    console.error("Error verifying MFA code:", error);
    return { success: false, error: "Failed to verify code" };
  }
}
