import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";
import sgMail from "@sendgrid/mail";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, password, tierLevel } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("🔐 Creating provider with password length:", password.length);

    // Create Supabase admin client
    const supabaseAdmin = createAdminClient();

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser?.users?.some((u: { email?: string }) => u.email === email);

    if (userExists) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    // Create auth user with email already confirmed
    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          role: "provider",
        },
      });

    console.log("✅ Auth user created:", {
      userId: authUser?.user?.id,
      email: authUser?.user?.email,
      emailConfirmed: authUser?.user?.email_confirmed_at
    });

    if (authError || !authUser.user) {
      console.error("Error creating auth user:", authError);
      return NextResponse.json(
        { error: authError?.message || "Failed to create user account" },
        { status: 500 }
      );
    }

    // Create user_roles record (REQUIRED for login to work)
    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: authUser.user.id,
      role: "provider",
    });

    if (roleError) {
      console.error("Error creating user role:", roleError);
      // Clean up auth user if role creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json(
        {
          error: "Failed to create user role",
          details: roleError.message || roleError.toString()
        },
        { status: 500 }
      );
    }

    // Create provider record using admin client (has proper permissions)
    const { error: providerError } = await supabaseAdmin.from("providers").insert({
      user_id: authUser.user.id,
      first_name: firstName,
      last_name: lastName,
      phone_number: phone || null,
      tier_level: tierLevel || "tier_1",
    });

    if (providerError) {
      console.error("Error creating provider record:", providerError);
      // Clean up auth user and role if provider creation fails
      await supabaseAdmin.from("user_roles").delete().eq("user_id", authUser.user.id);
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json(
        {
          error: "Failed to create provider record",
          details: providerError.message || providerError.toString()
        },
        { status: 500 }
      );
    }

    // Store email in provider record for easy access
    await supabaseAdmin
      .from("providers")
      .update({ email: email })
      .eq("user_id", authUser.user.id);

    // Send welcome email with credentials
    try {
      const sendGridApiKey = process.env.SENDGRID_API_KEY;

      if (sendGridApiKey) {
        sgMail.setApiKey(sendGridApiKey);

        const appUrl = "https://app.aimrx.com/auth/login";

        const emailSubject = "Welcome to AIM RX Portal - Your Provider Account";
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <div style="background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #00AEEF 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <img src="https://i.imgur.com/r65O4DB.png" alt="AIM Medical Technologies" style="height: 80px; margin-bottom: 15px;" />
              <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to AIM RX Portal</h1>
            </div>

            <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Hello Dr. ${lastName},
              </p>

              <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Your provider account has been successfully created! Please log in to complete your profile setup.
              </p>

              <div style="background: white; border: 2px solid #1E3A8A; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h2 style="color: #1E3A8A; margin-top: 0; font-size: 18px;">Your Login Credentials</h2>
                <p style="margin: 10px 0;"><strong>Portal URL:</strong> <a href="${appUrl}" style="color: #00AEEF;">${appUrl}</a></p>
                <p style="margin: 10px 0;"><strong>Username (Email):</strong> ${email}</p>
                <p style="margin: 10px 0;"><strong>Temporary Password:</strong> <code style="background: #f3f4f6; padding: 5px 10px; border-radius: 4px; font-size: 14px;">${password}</code></p>
              </div>

              <div style="background: #DBEAFE; border-left: 4px solid #2563EB; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #1E3A8A;">
                  <strong>📋 Next Steps:</strong>
                </p>
                <ol style="margin: 0; padding-left: 20px; font-size: 14px; color: #1E3A8A;">
                  <li style="margin-bottom: 8px;">Log in to your account using the credentials above</li>
                  <li style="margin-bottom: 8px;">Go to Settings → Profile to complete your provider information</li>
                  <li style="margin-bottom: 8px;">Add your payment details (bank account information)</li>
                  <li style="margin-bottom: 8px;">Add your addresses (physical and billing)</li>
                  <li>Change your temporary password for security</li>
                </ol>
              </div>

              <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #92400E;">
                  <strong>⚠️ Security Notice:</strong> This is a temporary password. For your security, please change your password immediately after your first login by going to Settings → Security.
                </p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${appUrl}" style="display: inline-block; background: #1E3A8A; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Log In to Portal
                </a>
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
          to: email,
          from: {
            email: process.env.SENDGRID_FROM_EMAIL || "noreply@aimrx.com",
            name: process.env.SENDGRID_FROM_NAME || "AIM RX Portal"
          },
          subject: emailSubject,
          html: emailHtml,
        };

        await sgMail.send(msg);
        console.log(`✅ Welcome email sent to provider: ${email}`);
      } else {
        console.warn("⚠️ SENDGRID_API_KEY not configured - welcome email not sent");
        console.log("📧 Provider credentials:", { email, password });
      }

    } catch (emailError) {
      console.error("Error sending welcome email:", emailError);
      // Don't fail the entire request if email sending fails
    }

    return NextResponse.json(
      {
        success: true,
        message: "Doctor invited successfully. Welcome email sent.",
        email: email,
        password: password,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error inviting doctor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
