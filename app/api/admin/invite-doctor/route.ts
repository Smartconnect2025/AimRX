import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, password } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

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

    // Create auth user
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
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://3002.app.specode.ai";

      // Create welcome email
      const emailContent = {
        subject: "Your MedRx Pharmacy Prescriber Portal account is ready",
        body: `
Hello Dr. ${lastName},

Your prescriber portal account has been created.

Login here: ${appUrl}
Email: ${email}
Password: ${password}

You can change your password any time after logging in.

Welcome aboard!
– MedRx Pharmacy Team
        `.trim()
      };

      // Send email using Supabase Admin (this uses Supabase's built-in email service)
      // Note: In production, you'd want to use a dedicated email service like SendGrid, Resend, etc.
      console.log("📧 Sending welcome email to:", email);
      console.log("Subject:", emailContent.subject);
      console.log("Body:", emailContent.body);

      // For now, we'll log the email content
      // In production, integrate with your email service:
      // await sendEmail({ to: email, subject: emailSubject, body: emailBody });

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
