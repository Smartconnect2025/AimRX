import { NextResponse } from "next/server";
import { getUser } from "@core/auth";
import { createAdminClient } from "@core/supabase/server";

export async function GET() {
  try {
    const { user, userRole } = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!userRole || !["admin", "super_admin"].includes(userRole)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const supabase = await createAdminClient();

    const { data: prescriptionsData, error: prescriptionsError } = await supabase
      .from("prescriptions")
      .select(`
        id,
        queue_id,
        submitted_at,
        medication,
        dosage,
        quantity,
        refills,
        sig,
        status,
        tracking_number,
        prescriber_id,
        pharmacy_id,
        patient:patients(first_name, last_name),
        pharmacy:pharmacies(name, primary_color)
      `)
      .order("submitted_at", { ascending: false });

    if (prescriptionsError) {
      console.error("Error loading prescriptions:", prescriptionsError);
      return NextResponse.json({ error: prescriptionsError.message }, { status: 500 });
    }

    const prescriberIds = [
      ...new Set((prescriptionsData || []).map((rx) => rx.prescriber_id)),
    ].filter(Boolean);

    let providerMap = new Map<string, { first_name: string; last_name: string }>();

    if (prescriberIds.length > 0) {
      const { data: providersData } = await supabase
        .from("providers")
        .select("user_id, first_name, last_name")
        .in("user_id", prescriberIds);

      providerMap = new Map(
        providersData?.map((p) => [p.user_id, p]) || []
      );
    }

    const formatted = (prescriptionsData || []).map((rx) => {
      const patient = Array.isArray(rx.patient) ? rx.patient[0] : rx.patient;
      const provider = providerMap.get(rx.prescriber_id);
      const pharmacy = Array.isArray(rx.pharmacy) ? rx.pharmacy[0] : rx.pharmacy;

      return {
        id: rx.id,
        queueId: rx.queue_id || "N/A",
        submittedAt: rx.submitted_at,
        providerName: provider
          ? `Dr. ${provider.first_name} ${provider.last_name}`
          : "Unknown Provider",
        patientName: patient
          ? `${(patient as { first_name: string; last_name: string }).first_name} ${(patient as { first_name: string; last_name: string }).last_name}`
          : "Unknown Patient",
        medication: rx.medication,
        strength: rx.dosage,
        quantity: rx.quantity,
        refills: rx.refills,
        sig: rx.sig,
        status: rx.status || "submitted",
        trackingNumber: rx.tracking_number,
        pharmacyName: (pharmacy as { name?: string })?.name,
        pharmacyColor: (pharmacy as { primary_color?: string })?.primary_color,
      };
    });

    return NextResponse.json({ prescriptions: formatted });
  } catch (error) {
    console.error("Error in admin prescriptions API:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
