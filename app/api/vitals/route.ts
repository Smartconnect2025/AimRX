import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@core/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, value, systolic, diastolic } = body;

    if (!["weight", "blood_pressure"].includes(type)) {
      return NextResponse.json(
        {
          error:
            "Invalid vital type. Only weight and blood_pressure are supported.",
        },
        { status: 400 },
      );
    }

    // Get or create patient record for the user
    let patient;
    const { data: patientData, error: patientError } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (patientError || !patientData) {
      // Create a basic patient record for vitals logging
      const { data: newPatient, error: createError } = await supabase
        .from("patients")
        .insert({
          user_id: user.id,
          first_name: "User",
          last_name: "",
          date_of_birth: new Date().toISOString().split("T")[0],
          email: user.email,
          is_active: true,
        })
        .select("id")
        .single();

      if (createError || !newPatient) {
        console.error("Failed to create patient record:", createError);
        return NextResponse.json(
          {
            error: "Failed to create patient record",
            details: createError?.message,
          },
          { status: 500 },
        );
      }
      patient = newPatient;
    } else {
      patient = patientData;
    }

    // For manual vitals logging, we need to create an encounter
    // Let's create a simple encounter for manual vitals entry
    const { data: encounter, error: encounterError } = await supabase
      .from("encounters")
      .insert({
        patient_id: patient.id,
        title: `Manual Vitals Entry - ${new Date().toLocaleDateString()}`,
        encounter_date: new Date().toISOString(),
        status: "completed",
        encounter_type: "consultation",
        business_type: "appointment_based",
      })
      .select("id")
      .single();

    if (encounterError || !encounter) {
      console.error("Failed to create encounter:", encounterError);
      console.error(
        "Encounter error details:",
        JSON.stringify(encounterError, null, 2),
      );
      return NextResponse.json(
        {
          error: "Failed to create encounter",
          details: encounterError?.message,
          code: encounterError?.code,
          hint: encounterError?.hint,
        },
        { status: 500 },
      );
    }

    // Prepare vitals data
    const vitalsData: Record<string, unknown> = {
      patient_id: patient.id,
      encounter_id: encounter.id,
    };

    if (type === "weight") {
      vitalsData.weight = value;
    } else if (type === "blood_pressure") {
      vitalsData.blood_pressure = `${systolic}/${diastolic}`;
    }

    // Insert into vitals table
    const { data: vitalEntry, error: vitalError } = await supabase
      .from("vitals")
      .insert(vitalsData)
      .select("*")
      .single();

    if (vitalError || !vitalEntry) {
      console.error("Failed to create vital entry:", vitalError);
      return NextResponse.json(
        { error: "Failed to create vital entry", details: vitalError?.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: {
        id: vitalEntry.id,
        type: type,
        value: type === "weight" ? vitalEntry.weight : undefined,
        systolic:
          type === "blood_pressure"
            ? parseInt(vitalEntry.blood_pressure?.split("/")[0] || "0")
            : undefined,
        diastolic:
          type === "blood_pressure"
            ? parseInt(vitalEntry.blood_pressure?.split("/")[1] || "0")
            : undefined,
        date: vitalEntry.created_at.split("T")[0],
        created_at: new Date(vitalEntry.created_at),
      },
      success: true,
    });
  } catch (error) {
    console.error("Failed to create vital entry:", error);
    return NextResponse.json(
      {
        error: "Failed to create vital entry",
        success: false,
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");
    const days = parseInt(searchParams.get("days") || "30");

    if (!type || !["weight", "blood_pressure"].includes(type)) {
      return NextResponse.json(
        {
          error:
            "Invalid vital type. Only weight and blood_pressure are supported.",
        },
        { status: 400 },
      );
    }

    // Get patient record
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (patientError || !patient) {
      return NextResponse.json(
        { error: "Patient record not found" },
        { status: 404 },
      );
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Get vitals from the vitals table
    let query = supabase
      .from("vitals")
      .select("*")
      .eq("patient_id", patient.id)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    // Filter by vital type
    if (type === "weight") {
      query = query.not("weight", "is", null);
    } else if (type === "blood_pressure") {
      query = query.not("blood_pressure", "is", null);
    }

    const { data: vitals, error } = await query;

    if (error) {
      console.error("Failed to fetch vitals:", error);
      return NextResponse.json(
        { error: "Failed to fetch vitals" },
        { status: 500 },
      );
    }

    // Transform data to match expected format
    const transformedVitals =
      vitals?.map((vital) => {
        const result: Record<string, unknown> = {
          id: vital.id,
          date: vital.created_at.split("T")[0],
          created_at: new Date(vital.created_at),
        };

        if (type === "weight" && vital.weight) {
          result.value = vital.weight;
        } else if (type === "blood_pressure" && vital.blood_pressure) {
          const [systolic, diastolic] = vital.blood_pressure
            .split("/")
            .map(Number);
          result.systolic = systolic;
          result.diastolic = diastolic;
        }

        return result;
      }) || [];

    return NextResponse.json({
      data: transformedVitals,
      success: true,
    });
  } catch (error) {
    console.error("Failed to fetch vitals:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch vitals",
        success: false,
      },
      { status: 500 },
    );
  }
}
