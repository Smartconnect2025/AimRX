import { createClient } from "@/core/supabase/client";
import { Symptom, SymptomLog, SymptomLogInput } from "../types";

export const symptomService = {
  async logSymptom(input: SymptomLogInput) {
    if (!input.patient_id) return null;
    const supabase = createClient();

    const { data, error } = await supabase
      .from("symptom_logs")
      .insert([
        {
          symptom_id: input.symptom_id,
          severity: input.severity,
          description: input.description,
          patient_id: input.patient_id,
        },
      ])
      .select(
        `
        id,
        symptom_id,
        severity,
        description,
        created_at,
        patient_id,
        symptoms (
          id,
          name,
          emoji,
          is_common
        )
      `,
      )
      .single();

    if (error || !data) return null;

    const symptomData: Symptom = Array.isArray(data.symptoms)
      ? data.symptoms[0]
      : data.symptoms;

    return {
      id: data.id,
      symptom_id: data.symptom_id,
      severity: data.severity,
      description: data.description,
      created_at: data.created_at,
      patient_id: data.patient_id,
      symptom: symptomData,
    } as SymptomLog;
  },

  async getLogs(patientId: string | null): Promise<SymptomLog[]> {
    if (!patientId) return [];
    const supabase = createClient();

    const { data, error } = await supabase
      .from("symptom_logs")
      .select(
        `
        id,
        symptom_id,
        severity,
        description,
        created_at,
        patient_id,
        symptoms (
          id,
          name,
          emoji,
          is_common
        )
      `,
      )
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((log) => ({
      ...log,
      symptom: Array.isArray(log.symptoms)
        ? log.symptoms[0]
        : log.symptoms || undefined,
    }));
  },

  subscribeToLogs(patientId: string, callback: () => void): () => void {
    const supabase = createClient();

    const subscription = supabase
      .channel(`symptom_logs_${patientId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "symptom_logs",
          filter: `patient_id=eq.${patientId}`,
        },
        callback,
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  },

  async editSymptom(
    logId: string,
    updates: Partial<{ severity: number; description: string }>,
    patientId: string | null,
  ): Promise<boolean> {
    if (!patientId) return false;
    const supabase = createClient();

    const { error } = await supabase
      .from("symptom_logs")
      .update(updates)
      .eq("id", logId);

    return !error;
  },

  async deleteSymptom(
    logId: string,
    patientId: string | null,
  ): Promise<boolean> {
    if (!patientId) return false;
    const supabase = createClient();

    const { error } = await supabase
      .from("symptom_logs")
      .delete()
      .eq("id", logId);

    return !error;
  },

  async getAllSymptoms() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("symptoms")
      .select("*")
      .order("name", { ascending: true });

    return error ? [] : data;
  },

  async getRecentSymptoms({
    limit = 5,
    offset = 0,
    patientId,
    startDate,
    endDate,
  }: {
    limit?: number;
    offset?: number;
    patientId: string | null;
    startDate?: Date;
    endDate?: Date;
  }) {
    if (!patientId) return [];
    const supabase = createClient();

    let query = supabase
      .from("symptom_logs")
      .select(
        `
        id,
        symptom_id,
        severity,
        description,
        created_at,
        patient_id,
        symptoms (
          id,
          name,
          emoji,
          is_common
        )
      `,
      )
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (startDate) query = query.gte("created_at", startDate.toISOString());
    if (endDate) query = query.lte("created_at", endDate.toISOString());

    const { data, error } = await query;

    if (error) return [];

    return (data || []).map((log) => ({
      id: log.id,
      symptom_id: log.symptom_id,
      severity: log.severity,
      description: log.description,
      created_at: log.created_at,
      patient_id: log.patient_id,
      symptom: Array.isArray(log.symptoms)
        ? log.symptoms[0]
        : log.symptoms || undefined,
    }));
  },
};
