import { NextResponse } from "next/server";
import { createServerClient, createAdminClient } from "@core/supabase/server";
import sgMail from "@sendgrid/mail";

/**
 * Create a new pharmacy admin
 * POST /api/admin/pharmacy-admins
 */
export async function POST(request: Request) {
  const supabase = await createServerClient();
  const supabaseAdmin = await createAdminClient();

  try {
    // Get current user
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

    // Parse request body
    const body = await request.json();
    const { email, password, pharmacy_id, full_name } = body;

    // Validate required fields
    if (!email || !password || !pharmacy_id) {
      return NextResponse.json(
        { success: false, error: "Email, password, and pharmacy_id are required" },
        { status: 400 }
      );
    }

    // 1. Create auth user via Supabase Admin API (using admin client with service role key)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name || email.split("@")[0],
      },
    });

    if (authError || !authData.user) {
      console.error("Error creating auth user:", authError);

      // Check if it's a duplicate user error
      const isDuplicate = authError?.message?.includes("already") || authError?.message?.includes("exists");

      return NextResponse.json(
        {
          success: false,
          error: isDuplicate
            ? "A user with this email already exists. Please use a different email address."
            : "Failed to create user account",
          details: authError?.message || "Unknown error",
        },
        { status: isDuplicate ? 400 : 500 }
      );
    }

    const userId = authData.user.id;

    // 2. Add user_roles entry (role="admin")
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({
        user_id: userId,
        role: "admin",
      });

    if (roleError) {
      console.error("Error creating user role:", roleError);
      // Continue anyway - pharmacy_admins table is enough
    }

    // 3. Add pharmacy_admins link
    const { error: linkError } = await supabase
      .from("pharmacy_admins")
      .insert({
        user_id: userId,
        pharmacy_id,
      });

    if (linkError) {
      console.error("Error linking user to pharmacy:", linkError);
      // Cleanup: delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(userId);

      return NextResponse.json(
        {
          success: false,
          error: "Failed to link user to pharmacy",
          details: linkError.message,
        },
        { status: 500 }
      );
    }

    // 4. Get pharmacy details for response
    const { data: pharmacy } = await supabase
      .from("pharmacies")
      .select("name, slug")
      .eq("id", pharmacy_id)
      .single();

    // 5. Send confirmation email with credentials
    try {
      const sendGridApiKey = process.env.SENDGRID_API_KEY;

      if (sendGridApiKey) {
        sgMail.setApiKey(sendGridApiKey);

        const appUrl = "https://app.aimrx.com/auth/login";
        const pharmacyName = pharmacy?.name || "the pharmacy";

        const emailSubject = "Welcome to AIM RX Portal - Pharmacy Admin Account Created";
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <div style="background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #00AEEF 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <img src="https://i.imgur.com/r65O4DB.png" alt="AIM Medical Technologies" style="height: 80px; margin-bottom: 15px;" />
              <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to AIM RX Portal</h1>
            </div>

            <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Hello${full_name ? ` ${full_name}` : ""},
              </p>

              <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Your pharmacy administrator account has been successfully created for <strong>${pharmacyName}</strong>! You can now access the AIM RX Portal to manage pharmacy operations, prescriptions, and settings.
              </p>

              <div style="background: white; border: 2px solid #1E3A8A; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h2 style="color: #1E3A8A; margin-top: 0; font-size: 18px;">Your Login Credentials</h2>
                <p style="margin: 10px 0;"><strong>Portal URL:</strong> <a href="${appUrl}" style="color: #00AEEF;">${appUrl}</a></p>
                <p style="margin: 10px 0;"><strong>Pharmacy:</strong> ${pharmacyName}</p>
                <p style="margin: 10px 0;"><strong>Username (Email):</strong> ${email}</p>
                <p style="margin: 10px 0;"><strong>Password:</strong> <code style="background: #f3f4f6; padding: 5px 10px; border-radius: 4px; font-size: 14px;">${password}</code></p>
              </div>

              <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #92400E;">
                  <strong>⚠️ Security Notice:</strong> Please keep these credentials secure. We recommend changing your password after your first login by going to Settings → Security.
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
            name: process.env.SENDGRID_FROM_NAME || "AIM RX Portal",
          },
          subject: emailSubject,
          html: emailHtml,
        };

        await sgMail.send(msg);
        console.log(`✅ Confirmation email sent to pharmacy admin: ${email}`);
      } else {
        console.warn("⚠️ SENDGRID_API_KEY not configured - confirmation email not sent");
        console.log("📧 Pharmacy admin credentials:", { email, password });
      }
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError);
      // Don't fail the entire request if email sending fails
    }

    return NextResponse.json({
      success: true,
      message: `Pharmacy admin created successfully for ${pharmacy?.name || "pharmacy"}`,
      user: {
        id: userId,
        email,
        pharmacy: pharmacy?.name,
      },
    });
  } catch (error) {
    console.error("Error in create pharmacy admin:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create pharmacy admin",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Get all pharmacy admins
 * GET /api/admin/pharmacy-admins
 */
export async function GET() {
  const supabase = await createServerClient();
  const supabaseAdmin = await createAdminClient();

  try {
    // Get all pharmacy admin links with user and pharmacy details
    const { data: adminLinks, error } = await supabase
      .from("pharmacy_admins")
      .select(`
        user_id,
        pharmacy_id,
        created_at,
        pharmacy:pharmacies(name, slug, primary_color)
      `);

    if (error) {
      console.error("Error fetching pharmacy admins:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch pharmacy admins" },
        { status: 500 }
      );
    }

    // Get user details for each admin
    const adminsWithDetails = await Promise.all(
      (adminLinks || []).map(async (link) => {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(link.user_id);
        return {
          user_id: link.user_id,
          email: userData?.user?.email || "Unknown",
          full_name: userData?.user?.user_metadata?.full_name || null,
          pharmacy_id: link.pharmacy_id,
          pharmacy: link.pharmacy,
          created_at: link.created_at,
        };
      })
    );

    return NextResponse.json({
      success: true,
      admins: adminsWithDetails,
    });
  } catch (error) {
    console.error("Error in get pharmacy admins:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch pharmacy admins",
      },
      { status: 500 }
    );
  }
}
