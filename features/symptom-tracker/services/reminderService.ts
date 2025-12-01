import { Reminder, ReminderInput } from "../types";
import { createClient } from "@/core/supabase/client";

export const reminderService = {
  async createReminder(input: ReminderInput) {
    if (!input.patient_id) return null;
    const supabase = createClient();

    const { data, error } = await supabase
      .from("reminders")
      .insert([input])
      .select()
      .single();

    if (error || !data) {
      console.error("Error creating reminder:", error);
      return null;
    }

    return data as Reminder;
  },

  async getReminders(patientId: string): Promise<Reminder[]> {
    if (!patientId) return [];
    const supabase = createClient();

    const { data, error } = await supabase
      .from("reminders")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reminders:", error);
      return [];
    }

    return data as Reminder[];
  },

  async updateReminder(
    reminderId: number,
    updates: Partial<Omit<ReminderInput, "patient_id">>,
    patientId: string,
  ): Promise<boolean> {
    if (!patientId) return false;
    const supabase = createClient();

    const { error } = await supabase
      .from("reminders")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reminderId)
      .eq("patient_id", patientId);

    if (error) {
      console.error("Error updating reminder:", error);
      return false;
    }

    return true;
  },

  async deleteReminder(
    reminderId: number,
    patientId: string,
  ): Promise<boolean> {
    if (!patientId) return false;
    const supabase = createClient();

    const { error } = await supabase
      .from("reminders")
      .delete()
      .eq("id", reminderId)
      .eq("patient_id", patientId);

    if (error) {
      console.error("Error deleting reminder:", error);
      return false;
    }

    return true;
  },

  async toggleReminder(
    reminderId: number,
    enabled: boolean,
    patientId: string,
  ): Promise<boolean> {
    return this.updateReminder(reminderId, { enabled }, patientId);
  },
};
