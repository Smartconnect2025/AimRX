/**
 * Pharmacy Order Reports API
 *
 * Provides order statistics grouped by pharmacy and provider
 * with filtering by date range
 */

import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@core/auth";
import { createServerClient } from "@core/supabase/server";

export async function GET(request: NextRequest) {
  try {
    // Check if the current user is an admin
    const { user, userRole } = await getUser();

    if (!user || userRole !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const pharmacyId = searchParams.get("pharmacyId");

    const supabase = await createServerClient();

    console.log("Starting pharmacy reports query...");
    console.log("Query filters:", { startDate, endDate, pharmacyId });

    // Build query for prescriptions with provider and patient info
    // This fetches from the incoming prescriptions queue
    let query = supabase
      .from("prescriptions")
      .select("*");

    // Apply filters
    if (startDate) {
      console.log("Applying start date filter:", startDate);
      query = query.gte("submitted_at", startDate);
    }
    if (endDate) {
      console.log("Applying end date filter:", endDate);
      query = query.lte("submitted_at", endDate);
    }
    if (pharmacyId) {
      console.log("Applying pharmacy filter:", pharmacyId);
      query = query.eq("pharmacy_id", pharmacyId);
    }

    query = query.order("submitted_at", { ascending: false });

    console.log("Executing query...");
    const { data: prescriptions, error } = await query;
    console.log("Query executed");

    if (error) {
      console.error("Error fetching prescriptions:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: "Failed to fetch prescriptions", details: error.message },
        { status: 500 },
      );
    }

    console.log(`Found ${prescriptions?.length || 0} prescriptions`);

    // Log first prescription for debugging
    if (prescriptions && prescriptions.length > 0) {
      console.log("Sample prescription data:", JSON.stringify(prescriptions[0], null, 2));
    }

    // Return empty report if no prescriptions found
    if (!prescriptions || prescriptions.length === 0) {
      console.log("No prescriptions found, returning empty report");
      return NextResponse.json({
        success: true,
        report: [],
        totalPrescriptions: 0,
      });
    }

    // Fetch related data separately to avoid complex join issues
    const prescriberIds = [...new Set(prescriptions.map(p => p.prescriber_id).filter(Boolean))];
    const patientIds = [...new Set(prescriptions.map(p => p.patient_id).filter(Boolean))];
    const pharmacyIds = [...new Set(prescriptions.map(p => p.pharmacy_id).filter(Boolean))];
    const medicationIds = [...new Set(prescriptions.map(p => p.medication_id).filter(Boolean))];

    console.log("Fetching related data...", { prescriberIds: prescriberIds.length, patientIds: patientIds.length, pharmacyIds: pharmacyIds.length, medicationIds: medicationIds.length });

    // Fetch providers (using user_id to match prescriber_id)
    const { data: providers } = await supabase
      .from("providers")
      .select("id, user_id, first_name, last_name, email")
      .in("user_id", prescriberIds);

    // Fetch patients
    const { data: patients } = await supabase
      .from("patients")
      .select("id, first_name, last_name, email")
      .in("id", patientIds);

    // Fetch pharmacies
    const { data: pharmacies } = await supabase
      .from("pharmacies")
      .select("id, name")
      .in("id", pharmacyIds);

    // Fetch medications
    const { data: medications } = await supabase
      .from("pharmacy_medications")
      .select("id, name, strength, dosage_form, price_cents")
      .in("id", medicationIds);

    // Create lookup maps for quick access
    // Note: Map providers by user_id since prescriber_id is a user_id
    const providerMap = new Map(providers?.map(p => [p.user_id, p]) || []);
    const patientMap = new Map(patients?.map(p => [p.id, p]) || []);
    const pharmacyMap = new Map(pharmacies?.map(p => [p.id, p]) || []);
    const medicationMap = new Map(medications?.map(m => [m.id, m]) || []);

    console.log("Related data fetched successfully");

    // Group prescriptions by pharmacy and provider
    const reportData: Record<string, {
      pharmacy: { id: string; name: string };
      providers: Record<string, {
        provider: { id: string; name: string; email: string };
        orders: Array<{
          id: string;
          queue_id: string;
          date: string;
          patient: string;
          medication: string;
          quantity: number;
          refills: number;
          sig: string;
          price: number;
          status: string;
        }>;
        totalOrders: number;
        totalAmount: number;
      }>;
      totalOrders: number;
      totalAmount: number;
    }> = {};

    prescriptions?.forEach((prescription) => {
      try {
        const pharmacyId = prescription.pharmacy_id || "unspecified";
        const pharmacy = pharmacyMap.get(pharmacyId);
        const pharmacyName = pharmacy?.name || "Not specified";

        // prescriber_id is a user_id, so look up provider by user_id
        const prescriberId = prescription.prescriber_id || "unspecified";
        const provider = providerMap.get(prescriberId);
        const providerId = provider?.id || "unspecified"; // Get actual provider.id for grouping
        const providerName = provider
          ? `${provider.first_name || ""} ${provider.last_name || ""}`.trim() || "Unknown Provider"
          : "Unknown Provider";
        const providerEmail = provider?.email || "";

        // Initialize pharmacy if not exists
        if (!reportData[pharmacyId]) {
          reportData[pharmacyId] = {
            pharmacy: { id: pharmacyId, name: pharmacyName },
            providers: {},
            totalOrders: 0,
            totalAmount: 0,
          };
        }

        // Initialize provider if not exists (group by provider.id)
        if (!reportData[pharmacyId].providers[providerId]) {
          reportData[pharmacyId].providers[providerId] = {
            provider: { id: providerId, name: providerName, email: providerEmail },
            orders: [],
            totalOrders: 0,
            totalAmount: 0,
          };
        }

        // Calculate total price including provider fee
        const medicationPriceCents = prescription.total_paid_cents || 0;
        const providerFeeCents = prescription.profit_cents || 0;
        const totalPriceCents = medicationPriceCents + providerFeeCents;
        const totalPriceInDollars = totalPriceCents / 100;

        // If no total_paid_cents, fall back to patient_price
        const finalPrice = prescription.total_paid_cents
          ? totalPriceInDollars
          : (prescription.patient_price ? parseFloat(prescription.patient_price) : 0);

        const patient = patientMap.get(prescription.patient_id);
        const medication = medicationMap.get(prescription.medication_id);

        // Build medication display name with strength and form
        let medicationDisplay = "Unknown Medication";
        if (medication) {
          medicationDisplay = medication.name;
          if (medication.strength) {
            medicationDisplay += ` ${medication.strength}`;
          }
          if (medication.dosage_form) {
            medicationDisplay += ` ${medication.dosage_form}`;
          }
        } else if (prescription.medication) {
          // Fall back to legacy medication field if medication_id lookup fails
          medicationDisplay = prescription.medication;
        }

        // Add order to provider
        reportData[pharmacyId].providers[providerId].orders.push({
          id: prescription.id,
          queue_id: prescription.queue_id || "",
          date: prescription.submitted_at,
          patient: patient
            ? `${patient.first_name || ""} ${patient.last_name || ""}`.trim() || "Unknown Patient"
            : "Unknown Patient",
          medication: medicationDisplay,
          quantity: prescription.quantity || 0,
          refills: prescription.refills || 0,
          sig: prescription.sig || "",
          price: finalPrice,
          status: prescription.status,
        });

        // Update totals
        reportData[pharmacyId].providers[providerId].totalOrders++;
        reportData[pharmacyId].providers[providerId].totalAmount += finalPrice;
        reportData[pharmacyId].totalOrders++;
        reportData[pharmacyId].totalAmount += finalPrice;
      } catch (prescriptionError) {
        console.error("Error processing prescription:", prescription.id, prescriptionError);
        // Continue with next prescription
      }
    });

    // Convert to array format
    const report = Object.values(reportData).map((pharmacy) => ({
      ...pharmacy,
      providers: Object.values(pharmacy.providers),
    }));

    return NextResponse.json({
      success: true,
      report,
      totalPrescriptions: prescriptions?.length || 0,
    });
  } catch (error) {
    console.error("Error generating pharmacy reports:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
