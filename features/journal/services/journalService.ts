import { createClient } from "@core/supabase/client";
import { JournalEntry, JournalFormData } from "../types";

export class JournalService {
  private supabase = createClient();

  async createJournalEntry(
    userId: string,
    data: JournalFormData,
  ): Promise<JournalEntry> {
    const entry = {
      user_id: userId,
      content: data.content,
      did_exercise: data.did_exercise,
      caffeine_servings: data.caffeine_servings,
      date: new Date().toISOString().split("T")[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: result, error } = await this.supabase
      .from("journal_entries")
      .insert(entry)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create journal entry: ${error.message}`);
    }

    return this.transformJournalEntry(result);
  }

  async getJournalEntries(
    userId: string,
    limit?: number,
  ): Promise<JournalEntry[]> {
    let query = this.supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch journal entries: ${error.message}`);
    }

    return data?.map(this.transformJournalEntry) || [];
  }

  async updateJournalEntry(
    entryId: string,
    userId: string,
    data: Partial<JournalFormData>,
  ): Promise<JournalEntry> {
    const updateData = {
      ...data,
      did_exercise: data.did_exercise,
      caffeine_servings: data.caffeine_servings,
      updated_at: new Date().toISOString(),
    };

    const { data: result, error } = await this.supabase
      .from("journal_entries")
      .update(updateData)
      .eq("id", entryId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update journal entry: ${error.message}`);
    }

    return this.transformJournalEntry(result);
  }

  async deleteJournalEntry(entryId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("journal_entries")
      .delete()
      .eq("id", entryId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to delete journal entry: ${error.message}`);
    }
  }

  async getJournalMetrics(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.supabase
      .from("journal_entries")
      .select("did_exercise, caffeine_servings, date")
      .eq("user_id", userId)
      .gte("date", startDate.toISOString().split("T")[0])
      .order("date", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch journal metrics: ${error.message}`);
    }

    const entries = data || [];

    const totalEntries = entries.length;
    const exerciseDays = entries.filter((entry) => entry.did_exercise).length;
    const totalCaffeine = entries.reduce(
      (sum, entry) => sum + (entry.caffeine_servings || 0),
      0,
    );
    const averageCaffeine =
      totalEntries > 0
        ? Math.round((totalCaffeine / totalEntries) * 10) / 10
        : 0;

    // Calculate streak (consecutive days with entries)
    let streak = 0;
    const today = new Date().toISOString().split("T")[0];

    for (let i = 0; i < days; i++) {
      const checkDate = new Date();
      checkDate.setDate(checkDate.getDate() - i);
      const dateString = checkDate.toISOString().split("T")[0];

      const hasEntry = entries.some((entry) => entry.date === dateString);
      if (hasEntry) {
        streak++;
      } else if (dateString !== today) {
        // If it's not today and no entry, break streak
        break;
      }
    }

    return {
      totalEntries,
      exerciseDays,
      averageCaffeine,
      currentStreak: streak,
    };
  }

  private transformJournalEntry(data: {
    id: string;
    user_id: string;
    content: string;
    did_exercise: boolean;
    caffeine_servings: number;
    date: string;
    created_at: string;
    updated_at: string;
  }): JournalEntry {
    return {
      id: data.id,
      user_id: data.user_id,
      content: data.content,
      did_exercise: data.did_exercise,
      caffeine_servings: data.caffeine_servings,
      date: data.date,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }
}

export const journalService = new JournalService();
