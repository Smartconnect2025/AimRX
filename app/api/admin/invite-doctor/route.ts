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

    // Create provider record using admin client (has proper permissions)
    const { error: providerError } = await supabaseAdmin.from("providers").insert({
      user_id: authUser.user.id,
      first_name: firstName,
      last_name: lastName,
      phone_number: phone || null,
    });

    if (providerError) {
      console.error("Error creating provider record:", providerError);
      // Clean up auth user if provider creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json(
        {
          error: "Failed to create provider record",
          details: providerError.message || providerError.toString()
        },
        { status: 500 }
      );
    }

    // Send welcome email (in a real app, you'd use a proper email service)
    // For now, we'll just return success
    // TODO: Integrate with email service to send credentials

    return NextResponse.json(
      {
        success: true,
        message: "Doctor invited successfully",
        email: email,
        defaultPassword: password,
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
