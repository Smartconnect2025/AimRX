import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/core/supabase";
import { getUser } from "@/core/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Get authenticated user
    const authResult = await getUser();
    if (!authResult.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const appointmentId = params.id;

    if (!appointmentId) {
      return NextResponse.json(
        { success: false, error: "Appointment ID is required" },
        { status: 400 },
      );
    }

    const supabase = createClient();

    // Fetch appointment with provider and patient details
    const { data: appointment, error } = await supabase
      .from("appointments")
      .select(
        `
        *,
        provider:providers!inner(
          id,
          user_id,
          first_name,
          last_name,
          specialty,
          avatar_url
        ),
        patient:patients!inner(
          id,
          user_id,
          first_name,
          last_name,
          avatar_url,
          date_of_birth
        )
      `,
      )
      .eq("id", appointmentId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching appointment:", error);
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 },
      );
    }

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 },
      );
    }

    // Verify user is authorized to view this appointment
    const isProvider = appointment.provider.user_id === authResult.user.id;
    const isPatient = appointment.patient.user_id === authResult.user.id;

    if (!isProvider && !isPatient) {
      return NextResponse.json(
        { success: false, error: "Unauthorized to view this appointment" },
        { status: 403 },
      );
    }

    // Calculate patient age from date of birth
    const calculateAge = (dob: string) => {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }
      return age;
    };

    const patientAge = appointment.patient.date_of_birth
      ? calculateAge(appointment.patient.date_of_birth)
      : null;

    // Return structured appointment data
    return NextResponse.json({
      success: true,
      data: {
        id: appointment.id,
        datetime: appointment.datetime,
        duration: appointment.duration,
        type: appointment.type,
        reason: appointment.reason,
        provider: {
          userId: appointment.provider.user_id,
          name: `${appointment.provider.first_name || ""} ${appointment.provider.last_name || ""}`.trim(),
          specialty: appointment.provider.specialty,
          avatarUrl: appointment.provider.avatar_url,
        },
        patient: {
          userId: appointment.patient.user_id,
          name: `${appointment.patient.first_name || ""} ${appointment.patient.last_name || ""}`.trim(),
          age: patientAge,
          avatarUrl: appointment.patient.avatar_url,
        },
        currentUserRole: isProvider ? "provider" : "patient",
      },
    });
  } catch (error) {
    console.error("Error in appointment route:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
