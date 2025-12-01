"use client";

import { useUser } from "@/core/auth";
import { useEffect, useState } from "react";
import { createClient } from "@/core/supabase/client";

export function usePatient() {
  const { user, isLoading: userLoading } = useUser();
  const [patientId, setPatientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatientId = async () => {
      if (!user || !user.id || !user.email) {
        setPatientId(null);
        return;
      }
      setLoading(true);
      setError(null);
      const supabase = createClient();
      try {
        const { data: existingPatient, error: findError } = await supabase
          .from("patients")
          .select("id")
          .or(`user_id.eq.${user.id},email.eq.${user.email}`)
          .eq("is_active", true)
          .single();
        if (existingPatient && !findError) {
          setPatientId(existingPatient.id);
        } else {
          setPatientId(null);
        }
      } catch {
        setError("Failed to fetch patient ID");
        setPatientId(null);
      } finally {
        setLoading(false);
      }
    };
    if (!userLoading) {
      fetchPatientId();
    }
  }, [user, userLoading]);

  return { patientId, loading: loading || userLoading, error };
}
