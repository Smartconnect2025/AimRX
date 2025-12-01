import { createClient } from "@core/supabase/client";
import { MoodEntry, MoodFormData, Mood } from "../types";

export class MoodService {
  private supabase = createClient();

  async createMoodEntry(
    userId: string,
    data: MoodFormData,
  ): Promise<MoodEntry> {
    const entry = {
      user_id: userId,
      mood: data.mood,
      tags: data.tags,
      created_at: new Date().toISOString(),
    };

    const { data: result, error } = await this.supabase
      .from("mood_entries")
      .insert(entry)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create mood entry: ${error.message}`);
    }

    return this.transformMoodEntry(result);
  }

  async getMoodEntries(userId: string, limit?: number): Promise<MoodEntry[]> {
    let query = this.supabase
      .from("mood_entries")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch mood entries: ${error.message}`);
    }

    return data?.map(this.transformMoodEntry) || [];
  }

  async updateMoodEntry(
    entryId: string,
    userId: string,
    data: Partial<MoodFormData>,
  ): Promise<MoodEntry> {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
    };

    const { data: result, error } = await this.supabase
      .from("mood_entries")
      .update(updateData)
      .eq("id", entryId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update mood entry: ${error.message}`);
    }

    return this.transformMoodEntry(result);
  }

  async deleteMoodEntry(entryId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("mood_entries")
      .delete()
      .eq("id", entryId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to delete mood entry: ${error.message}`);
    }
  }

  async getMoodMetrics(userId: string, days: number = 7) {
    const validMoods: Mood[] = [
      "amazing",
      "good",
      "neutral",
      "anxious",
      "angry",
    ];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.supabase
      .from("mood_entries")
      .select("mood, created_at")
      .eq("user_id", userId)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch mood metrics: ${error.message}`);
    }

    // Calculate metrics
    const entries = data || [];
    const moodValues: Record<Mood, number> = {
      amazing: 5,
      good: 4,
      neutral: 3,
      anxious: 2,
      angry: 1,
    };

    let totalValue = 0;
    let streak = 0;
    const distribution: Record<Mood, number> = {
      amazing: 0,
      good: 0,
      neutral: 0,
      anxious: 0,
      angry: 0,
    };

    entries.forEach((entry, index) => {
      const mood = entry.mood as Mood;
      if (validMoods.includes(mood)) {
        totalValue += moodValues[mood];
        distribution[mood]++;
      }

      // Calculate streak (consecutive days with entries)
      if (index === 0) streak = 1;
      else {
        const currentDate = new Date(entry.created_at);
        const previousDate = new Date(entries[index - 1].created_at);
        const dayDiff =
          Math.abs(currentDate.getTime() - previousDate.getTime()) /
          (1000 * 60 * 60 * 24);
        if (dayDiff <= 1) streak++;
        else streak = 1;
      }
    });

    const averageValue = entries.length > 0 ? totalValue / entries.length : 3;
    const averageMood = this.getClosestMood(averageValue);

    return {
      averageMood,
      moodStreak: streak,
      totalEntries: entries.length,
      moodDistribution: distribution,
    };
  }

  private getClosestMood(value: number): Mood {
    if (value >= 4.5) return "amazing";
    if (value >= 3.5) return "good";
    if (value >= 2.5) return "neutral";
    if (value >= 1.5) return "anxious";
    return "angry";
  }

  private transformMoodEntry(data: {
    id: string;
    user_id: string;
    mood: string;
    tags: string[];
    created_at: string;
  }): MoodEntry {
    // Validate that the mood from DB is a valid Mood type
    const validMoods: Mood[] = [
      "amazing",
      "good",
      "neutral",
      "anxious",
      "angry",
    ];
    if (!validMoods.includes(data.mood as Mood)) {
      throw new Error(`Invalid mood value: ${data.mood}`);
    }

    return {
      id: data.id,
      user_id: data.user_id,
      mood: data.mood as Mood, // Safe to cast after validation
      tags: Array.isArray(data.tags) ? data.tags : [],
      created_at: data.created_at,
    };
  }
}

export const moodService = new MoodService();
