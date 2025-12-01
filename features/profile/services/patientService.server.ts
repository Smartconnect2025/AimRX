"use server";

import { createServerClient } from "@/core/supabase/server";
import { createAdminClient } from "@/core/database/client";

export async function deletePatientAccount(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // Get the current user from the session
    const supabase = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        message: "No authenticated user found",
      };
    }

    const adminClient = createAdminClient();

    // Step 1: Soft-delete patient data
    const { error: patientError } = await adminClient
      .from("patients")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (patientError) {
      console.error("Error updating patient:", patientError);
      return { success: false, message: "Failed to update patient record" };
    }

    // Step 2: Soft-delete the user in Supabase Auth
    const { error: authError } = await adminClient.auth.admin.deleteUser(
      user.id,
      true, // soft delete
    );

    if (authError) {
      console.error("Error soft-deleting user in Auth:", authError);
      return { success: false, message: "Failed to disable user in auth" };
    }

    return { success: true, message: "User disabled successfully" };
  } catch (error) {
    console.error("Unexpected error disabling user:", error);
    return {
      success: false,
      message: "An unexpected error occurred while disabling user",
    };
  }
}
