import { createClient } from "@core/supabase/client";
import type { ProviderSetting } from "@/core/database/schema";

/**
 * Service for managing appointment settings
 */
export class SettingsService {
  private supabase = createClient();

  /**
   * Get app setting by key
   */
  async getAppSetting(key: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from("app_settings")
        .select("value")
        .eq("key", key)
        .single();

      if (error || !data) {
        console.warn(`App setting not found: ${key}`);
        return null;
      }

      return data.value;
    } catch (error) {
      console.error(`Error fetching app setting ${key}:`, error);
      return null;
    }
  }

  /**
   * Get provider settings for a specific provider
   */
  async getProviderSettings(
    providerId: string,
  ): Promise<ProviderSetting | null> {
    try {
      const { data, error } = await this.supabase
        .from("provider_settings")
        .select("*")
        .eq("provider_id", providerId)
        .single();

      if (error || !data) {
        console.warn(`Provider settings not found for provider: ${providerId}`);
        return null;
      }

      return data as ProviderSetting;
    } catch (error) {
      console.error(
        `Error fetching provider settings for ${providerId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Get default appointment duration for patients based on service type
   */
  async getDefaultPatientDuration(
    serviceType: "telehealth" | "in_person",
  ): Promise<number> {
    const key =
      serviceType === "telehealth"
        ? "default_patient_telehealth_duration"
        : "default_patient_inperson_duration";

    const value = await this.getAppSetting(key);
    return value ? parseInt(value, 10) : serviceType === "telehealth" ? 30 : 45;
  }

  /**
   * Get available service types for patients
   */
  async getPatientServiceTypes(): Promise<string[]> {
    const value = await this.getAppSetting("patient_service_types");
    try {
      return value ? JSON.parse(value) : ["telehealth", "in_person"];
    } catch {
      return ["telehealth", "in_person"];
    }
  }

  /**
   * Check if patients can change appointment duration
   */
  async canPatientChangeDuration(): Promise<boolean> {
    const value = await this.getAppSetting("patient_can_change_duration");
    return value === "true";
  }

  /**
   * Get default duration for a provider and service type
   */
  async getProviderDefaultDuration(
    providerId: string,
    serviceType: "telehealth" | "in_person",
  ): Promise<number> {
    const providerSettings = await this.getProviderSettings(providerId);

    if (!providerSettings) {
      // Fallback to patient defaults
      return this.getDefaultPatientDuration(serviceType);
    }

    return serviceType === "telehealth"
      ? providerSettings.default_telehealth_duration
      : providerSettings.default_inperson_duration;
  }

  /**
   * Get allowed durations for a provider
   */
  async getProviderAllowedDurations(providerId: string): Promise<number[]> {
    const providerSettings = await this.getProviderSettings(providerId);

    if (!providerSettings) {
      return [15, 30, 45, 60, 90]; // Default allowed durations
    }

    try {
      return Array.isArray(providerSettings.allowed_durations)
        ? (providerSettings.allowed_durations as number[])
        : [15, 30, 45, 60, 90];
    } catch {
      return [15, 30, 45, 60, 90];
    }
  }

  /**
   * Check if a provider allows patients to change duration
   */
  async doesProviderAllowPatientDurationChange(
    providerId: string,
  ): Promise<boolean> {
    const providerSettings = await this.getProviderSettings(providerId);

    if (!providerSettings) {
      return await this.canPatientChangeDuration();
    }

    return providerSettings.allow_patient_duration_change;
  }
}

// Export singleton instance
export const settingsService = new SettingsService();
