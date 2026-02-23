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
  const run = await logCronRun("refill-check");

  try {
    const supabase = createCronClient();

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("prescriptions")
      .select("*")
      .lte("next_refill_date", now)
      .eq("prescription_type", "prescription")
      .not("next_refill_date", "is", null);

    if (error) {
      await run.error(error.message);
      return;
    }

    // Filter eligible: total_refills_to_date < refills
    const eligible = (data ?? []).filter(
      (rx) => (rx.total_refills_to_date ?? 0) < (rx.refills ?? 0),
    );

    // TODO: Process eligible refills
    for (const rx of eligible) {
      await supabase
        .from("prescriptions")
        .update({
          total_refills_to_date: (rx.total_refills_to_date || 0) + 1,
          next_refill_date: new Date(
            new Date(rx.next_refill_date).getTime() +
              (rx.refill_frequency_days ?? 0) * 86400000,
          ).toISOString(),
        })
        .eq("id", rx.id);
      // Create new prescription with prescription_type = 'refill' and parent_prescription_id = the original prescription id
      const { data: refill } = await supabase
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

      // Create payment transaction and send payment link to patient
      if (refill) {
        const appUrl = envConfig.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        await fetch(`${appUrl}/api/payments/generate-link`, {
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
        });
      }
    }
    await run.success(eligible.length);
  } catch (err) {
    await run.error(err instanceof Error ? err.message : String(err));
  }
}
