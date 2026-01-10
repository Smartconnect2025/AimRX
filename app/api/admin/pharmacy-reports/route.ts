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

    // Build query for prescriptions with provider and patient info
    let query = supabase
      .from("prescriptions")
      .select(`
        id,
        queue_id,
        created_at,
        status,
        quantity,
        refills,
        sig,
        total_price_cents,
        pharmacy_id,
        medication_id,
        provider_id,
        patient_id,
        provider:providers(id, first_name, last_name, email),
        patient:patients(id, first_name, last_name, email),
        pharmacy:pharmacies(id, name),
        medication:pharmacy_medications(id, name, strength, dosage_form)
      `)
      .order("created_at", { ascending: false });

    // Apply date range filter
    if (startDate) {
      query = query.gte("created_at", startDate);
    }
    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    // Apply pharmacy filter
    if (pharmacyId) {
      query = query.eq("pharmacy_id", pharmacyId);
    }

    const { data: prescriptions, error } = await query;

    if (error) {
      console.error("Error fetching prescriptions:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: "Failed to fetch prescriptions", details: error.message },
        { status: 500 },
      );
    }

    console.log(`Found ${prescriptions?.length || 0} prescriptions`);

    // Return empty report if no prescriptions found
    if (!prescriptions || prescriptions.length === 0) {
      return NextResponse.json({
        success: true,
        report: [],
        totalPrescriptions: 0,
      });
    }

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
        const pharmacy = Array.isArray(prescription.pharmacy) ? prescription.pharmacy[0] : prescription.pharmacy;
        const pharmacyName = pharmacy?.name || "Not specified";
        const providerId = prescription.provider_id || "unspecified";
        const provider = Array.isArray(prescription.provider) ? prescription.provider[0] : prescription.provider;
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

        // Initialize provider if not exists
        if (!reportData[pharmacyId].providers[providerId]) {
          reportData[pharmacyId].providers[providerId] = {
            provider: { id: providerId, name: providerName, email: providerEmail },
            orders: [],
            totalOrders: 0,
            totalAmount: 0,
          };
        }

        const priceInDollars = (prescription.total_price_cents || 0) / 100;

        const patient = Array.isArray(prescription.patient) ? prescription.patient[0] : prescription.patient;
        const medication = Array.isArray(prescription.medication) ? prescription.medication[0] : prescription.medication;

        // Add order to provider
        reportData[pharmacyId].providers[providerId].orders.push({
          id: prescription.id,
          queue_id: prescription.queue_id || "",
          date: prescription.created_at,
          patient: patient
            ? `${patient.first_name || ""} ${patient.last_name || ""}`.trim() || "Unknown Patient"
            : "Unknown Patient",
          medication: medication?.name || "Unknown Medication",
          quantity: prescription.quantity || 0,
          refills: prescription.refills || 0,
          sig: prescription.sig || "",
          price: priceInDollars,
          status: prescription.status,
        });

        // Update totals
        reportData[pharmacyId].providers[providerId].totalOrders++;
        reportData[pharmacyId].providers[providerId].totalAmount += priceInDollars;
        reportData[pharmacyId].totalOrders++;
        reportData[pharmacyId].totalAmount += priceInDollars;
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
