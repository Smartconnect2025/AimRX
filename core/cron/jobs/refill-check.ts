/* eslint-disable no-console */
import { createCronClient } from "../supabase";
import { logCronRun } from "../logger";
import { envConfig } from "@core/config";

/**
 * Checks prescriptions eligible for refill.
 * A prescription is eligible when:
 *   - next_refill_date <= now
 *   - total_refills_to_date < refills (total authorized)
 *   - prescription_type = 'prescription' (original, not already a refill)
 */
export async function checkRefills() {
  console.log("[refill-check] Starting refill check...");
  const run = await logCronRun("refill-check");

  try {
    const supabase = createCronClient();

    const now = new Date().toISOString();
    console.log("[refill-check] Querying prescriptions with next_refill_date <=", now);

    const { data, error } = await supabase
      .from("prescriptions")
      .select("*")
      .lte("next_refill_date", now)
      .eq("prescription_type", "prescription")
      .not("next_refill_date", "is", null);

    if (error) {
      console.error("[refill-check] Query error:", error.message);
      await run.error(error.message);
      return;
    }

    console.log("[refill-check] Found", data?.length ?? 0, "prescriptions with past next_refill_date");

    // Filter eligible: total_refills_to_date < refills
    const eligible = (data ?? []).filter(
      (rx) => (rx.total_refills_to_date ?? 0) < (rx.refills ?? 0),
    );

    console.log("[refill-check] Eligible for refill:", eligible.length, "of", data?.length ?? 0);

    for (const rx of eligible) {
      console.log(`[refill-check] Processing rx ${rx.id} — ${rx.medication} (refill ${(rx.total_refills_to_date || 0) + 1}/${rx.refills})`);

      // Update original prescription counters
      const newRefillDate = new Date(
        new Date(rx.next_refill_date).getTime() +
          (rx.refill_frequency_days ?? 0) * 86400000,
      ).toISOString();

      await supabase
        .from("prescriptions")
        .update({
          total_refills_to_date: (rx.total_refills_to_date || 0) + 1,
          next_refill_date: newRefillDate,
        })
        .eq("id", rx.id);

      console.log(`[refill-check] Updated original rx ${rx.id} — next_refill_date: ${newRefillDate}`);

      // Create refill prescription clone
      const { data: refill, error: insertError } = await supabase
        .from("prescriptions")
        .insert({
          prescription_type: "refill",
          parent_prescription_id: rx.id,
          medication: rx.medication,
          dosage: rx.dosage,
          dosage_amount: rx.dosage_amount,
          dosage_unit: rx.dosage_unit,
          vial_size: rx.vial_size,
          form: rx.form,
          quantity: rx.quantity,
          refills: rx.refills,
          sig: rx.sig,
          dispense_as_written: rx.dispense_as_written,
          pharmacy_notes: rx.pharmacy_notes,
          patient_price: rx.patient_price,
          pharmacy_id: rx.pharmacy_id,
          medication_id: rx.medication_id,
          profit_cents: rx.profit_cents,
          consultation_reason: rx.consultation_reason,
          shipping_fee_cents: rx.shipping_fee_cents,
          total_paid_cents: rx.total_paid_cents,
          has_custom_address: rx.has_custom_address,
          custom_address: rx.custom_address,
          queue_id: null,
          status: "pending_payment",
          payment_status: "pending",
          backend_id: rx.backend_id,
          pdf_storage_path: null,
          pdf_document_id: null,
          prescriber_id: rx.prescriber_id,
          patient_id: rx.patient_id,
          encounter_id: rx.encounter_id,
          appointment_id: rx.appointment_id,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error(`[refill-check] Failed to create refill for rx ${rx.id}:`, insertError.message);
        continue;
      }

      console.log(`[refill-check] Created refill prescription ${refill?.id} for original ${rx.id}`);

      // Create payment transaction and send payment link to patient (fire-and-forget to avoid deadlock with same-server fetch)
      if (refill) {
        const appUrl = envConfig.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        console.log(`[refill-check] Firing generate-link for refill ${refill.id}...`);

        fetch(`${appUrl}/api/payments/generate-link`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-api-key": process.env.INTERNAL_API_KEY || "",
          },
          body: JSON.stringify({
            prescriptionId: refill.id,
            consultationFeeCents: rx.profit_cents || 0,
            medicationCostCents: Math.round(
              parseFloat(rx.patient_price || "0") * 100,
            ),
            shippingFeeCents: rx.shipping_fee_cents || 0,
            sendEmail: true,
          }),
        })
          .then(async (res) => {
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
              console.log(`[refill-check] Payment link generated for refill ${refill.id}:`, data.paymentUrl);
            } else {
              console.error(`[refill-check] generate-link failed for refill ${refill.id}:`, data.error);
            }
          })
          .catch((err) => {
            console.error(`[refill-check] generate-link fetch error for refill ${refill.id}:`, err.message);
          });
      }
    }

    console.log(`[refill-check] Done. Processed ${eligible.length} refills.`);
    await run.success(eligible.length);
  } catch (err) {
    console.error("[refill-check] Fatal error:", err instanceof Error ? err.message : String(err));
    await run.error(err instanceof Error ? err.message : String(err));
  }
}
