import "dotenv/config";
import {
  BodyCompositionData,
  CardiovascularData,
  ConnectedDevice,
  HealthData,
  HealthDataService,
  MetabolicData,
  PhysicalActivityData,
  SleepHealthData,
  TimeRange,
} from "@/features/vitals/types/health";
import { envConfig } from "@core/config/envConfig";

interface JunctionUserData {
  user_id: string;
  client_user_id: string;
}

interface JunctionProvidersResponse {
  providers: {
    name: string;
    slug: string;
    logo: string;
    status: string;
    created_on: string;
    resource_availability: {
      [key: string]: {
        status: "available" | "unavailable";
        scope_requirements: {
          user_granted: {
            required: string[];
            optional: string[];
          };
          user_denied: {
            required: string[];
            optional: string[];
          };
        };
      };
    };
    error_details: string | null;
  }[];
}

interface JunctionSleepResponse {
  sleep: {
    // Required fields
    id: string;
    awake: number;
    bedtime_start: string;
    bedtime_stop: string;
    calendar_date: string;
    date: string;
    duration: number;
    deep: number;
    light: number;
    rem: number;
    total: number;
    user_id: string;
    created_at: string;
    updated_at: string;

    // Nullable fields
    average_hrv: number | null;
    efficiency: number | null;
    hr_average: number | null;
    hr_lowest: number | null;
    latency: number | null;
    respiratory_rate: number | null;
    skin_temperature: number | null;
    source: {
      provider: string;
      type: string;
    } | null;
    temperature_delta: number | null;
    timezone_offset: number | null;
  }[];
}

interface JunctionActivityResponse {
  activity: {
    // Required fields
    calendar_date: string;
    user_id: string;
    source: {
      logo: string;
      name: string;
      slug: string;
    };
    created_at: string;
    updated_at: string;

    // Nullable fields
    calories_active: number | null;
    calories_total: number | null;
    daily_movement: number | null;
    date: string | null;
    floors_climbed: number | null;
    heart_rate: {
      avg_bpm: number;
      avg_walking_bpm: number;
      max_bpm: number;
      min_bpm: number;
      resting_bpm: number;
    } | null;
    high: number | null;
    low: number | null;
    medium: number | null;
    steps: number | null;
    time_zone: string | null;
    timezone_offset: number | null;
  }[];
}

interface JunctionBodyResponse {
  body: {
    // Required fields
    id: string;
    calendar_date: string;
    date: string;
    source: {
      provider: string;
      logo: string | null;
      name: string | null;
      slug: string | null;
    };
    user_id: string;
    created_at: string;
    updated_at: string;

    // Nullable fields
    body_mass_index: number | null;
    bone_mass_percentage: number | null;
    fat: number | null;
    height: number | null;
    lean_body_mass_kilogram: number | null;
    muscle_mass_percentage: number | null;
    visceral_fat_index: number | null;
    waist_circumference_centimeter: number | null;
    water_percentage: number | null;
    weight: number | null;
  }[];
}

interface JunctionBloodPressureResponse {
  groups: {
    [provider: string]: {
      data: {
        diastolic: number;
        systolic: number;
        timestamp: string;
        unit: string;
      }[];
      source: {
        provider: string;
        type: string;
      };
    }[];
  };
}

interface JunctionHeartRateVariabilityResponse {
  groups: {
    [provider: string]: {
      data: {
        timestamp: string;
        unit: string;
        value: number;
      }[];
      source: {
        provider: string;
        type: string;
      };
    }[];
  };
}

interface JunctionGlucoseResponse {
  groups: {
    [provider: string]: {
      data: {
        timestamp: string;
        type: string;
        unit: string;
        value: number;
      }[];
      source: {
        provider: string;
        type: string;
      };
    }[];
  };
}

export class JunctionHealthDataService implements HealthDataService {
  private static baseUrl = envConfig.NEXT_PUBLIC_JUNCTION_API_URL;
  private static apiKey = envConfig.JUNCTION_API_KEY;
  private supabaseUserId: string;
  private junctionUserId: string;

  constructor(supabaseUserId: string, junctionUserId: string) {
    this.supabaseUserId = supabaseUserId;
    this.junctionUserId = junctionUserId;
  }

  static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${JunctionHealthDataService.baseUrl}${endpoint}`;
    const requestData: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "x-vital-api-key": JunctionHealthDataService.apiKey,
        ...options.headers,
      },
    };
    const response = await fetch(url, requestData);

    if (!response.ok) {
      console.error(
        `Request Error: ${options["method"] ?? "GET"} ${url} ${options.body ? `with body: ${options.body}` : ""}`,
      );

      // Try to get the error details from the response
      let errorDetails = `${response.status} ${response.statusText}`;
      try {
        const errorBody = await response.json();
        console.error("Junction API Error Response:", errorBody);
        if (errorBody.detail) {
          errorDetails += `: ${errorBody.detail}`;
        } else if (errorBody.message) {
          errorDetails += `: ${errorBody.message}`;
        }
      } catch (parseError) {
        console.error("Could not parse error response:", parseError);
      }

      throw new Error(`Junction API error: ${errorDetails}`);
    }
    const result = await response.json();
    return result;
  }

  private async makeJunctionRequest<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    return JunctionHealthDataService.makeRequest<T>(endpoint, options);
  }

  static async getJunctionUserId(supabaseUserId: string): Promise<string> {
    // First try to retrieve an existing Junction user
    const userResponse =
      await JunctionHealthDataService.makeRequest<JunctionUserData>(
        `/v2/user/resolve/${supabaseUserId}`,
      ).catch((_error) => {
        console.error(
          `Failed to resolve existing Junction user for Supabase ID ${supabaseUserId}:`,
          _error,
        );
        return null;
      });

    // Return it if they exist
    if (userResponse) {
      return userResponse.user_id;
    }

    // Create a new Junction user if they don't exist
    try {
      const createUserResponse =
        await JunctionHealthDataService.makeRequest<JunctionUserData>(
          "/v2/user/",
          {
            method: "POST",
            body: JSON.stringify({ client_user_id: supabaseUserId }),
          },
        );

      return createUserResponse.user_id;
    } catch (error) {
      console.error(
        `Failed to create Junction user for Supabase ID ${supabaseUserId}:`,
        error,
      );
      throw new Error(
        `Unable to create or access Junction user: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private async getConnectedDevices(): Promise<ConnectedDevice[]> {
    try {
      const response =
        await this.makeJunctionRequest<JunctionProvidersResponse>(
          `/v2/user/providers/${this.junctionUserId}`,
        );

      return response.providers.map((provider) => ({
        deviceId: provider.slug || "unknown",
        deviceName: provider.name || "Unknown Device",
        deviceType: this.mapDeviceType(provider.slug || "other"),
        lastSync: new Date().toISOString(),
      }));
    } catch (error) {
      console.error(
        `Failed to fetch connected devices for user ${this.supabaseUserId}:`,
        error,
      );
      return [];
    }
  }

  private mapDeviceType(providerSlug: string): ConnectedDevice["deviceType"] {
    const typeMap: Record<string, ConnectedDevice["deviceType"]> = {
      fitbit: "watch",
      oura: "other",
      apple_health: "watch",
      garmin: "watch",
      whoop: "watch",
      polar: "watch",
      withings: "scale",
      dexcom: "glucose_monitor",
      freestyle_libre: "glucose_monitor",
      omron: "blood_pressure",
    };

    return typeMap[providerSlug] || "other";
  }

  private async getSleepData(timeRange: TimeRange): Promise<SleepHealthData[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - timeRange);

    try {
      const response = await this.makeJunctionRequest<JunctionSleepResponse>(
        `/v2/summary/sleep/${this.junctionUserId}?start_date=${startDate.toISOString().split("T")[0]}&end_date=${endDate.toISOString().split("T")[0]}`,
      );

      return response.sleep.map((item) => {
        // TODO: TRS - For some reason, totalSleep does not equal item.total, unsure why
        const totalSleep = item.rem + item.deep + item.light + item.awake;
        return {
          date: item.calendar_date,
          totalSleepHours: item.total / 3600, // Convert seconds to hours
          sleepEfficiency: item.efficiency,
          sleepScore: 0, // Junction doesn't provide a score field, so we'll use 0 as default
          sleepStages: {
            rem: item.rem / totalSleep,
            deep: item.deep / totalSleep,
            light: item.light / totalSleep,
            awake: item.awake / totalSleep,
          },
        };
      });
    } catch (error) {
      console.error(
        `Failed to fetch sleep data for user ${this.supabaseUserId} (${timeRange}-day range):`,
        error,
      );
      return [];
    }
  }

  private async getActivityData(
    timeRange: TimeRange,
  ): Promise<PhysicalActivityData[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - timeRange);

    try {
      const response = await this.makeJunctionRequest<JunctionActivityResponse>(
        `/v2/summary/activity/${this.junctionUserId}?start_date=${startDate.toISOString().split("T")[0]}&end_date=${endDate.toISOString().split("T")[0]}`,
      );

      return response.activity.map((item) => ({
        date: item.calendar_date,
        steps: item.steps ?? 0,
        activeCalories: item.calories_active ?? 0,
        activeMinutes: (item.low ?? 0) + (item.medium ?? 0) + (item.high ?? 0),
        hasWorkout: false, // Junction doesn't provide workout data in activity summary
      }));
    } catch (error) {
      console.error(
        `Failed to fetch activity data for user ${this.supabaseUserId} (${timeRange}-day range):`,
        error,
      );
      return [];
    }
  }

  private async getRestingHeartRateFromActivity(
    timeRange: TimeRange,
  ): Promise<{ date: string; restingHeartRate: number }[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - timeRange);

    try {
      const response = await this.makeJunctionRequest<JunctionActivityResponse>(
        `/v2/summary/activity/${this.junctionUserId}?start_date=${startDate.toISOString().split("T")[0]}&end_date=${endDate.toISOString().split("T")[0]}`,
      );

      return response.activity.map((item) => ({
        date: item.calendar_date,
        restingHeartRate:
          item.heart_rate?.resting_bpm ??
          item.heart_rate?.min_bpm ??
          item.heart_rate?.avg_bpm ??
          item.heart_rate?.avg_walking_bpm ??
          item.heart_rate?.max_bpm ??
          0,
      }));
    } catch (error) {
      console.error(
        `Failed to fetch resting heart rate from activity data for user ${this.supabaseUserId} (${timeRange}-day range):`,
        error,
      );
      return [];
    }
  }

  private async getBodyCompositionData(
    timeRange: TimeRange,
  ): Promise<BodyCompositionData[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - timeRange);

    try {
      const response = await this.makeJunctionRequest<JunctionBodyResponse>(
        `/v2/summary/body/${this.junctionUserId}?start_date=${startDate.toISOString().split("T")[0]}&end_date=${endDate.toISOString().split("T")[0]}`,
      );

      return response.body.map((item) => ({
        date: item.calendar_date,
        weight: (item.weight ?? 0) * 2.20462, // Convert kg to lbs (Junction weight is in kg)
        // TODO: TRS - what do we do if these don't add up to 100%?
        bodyFatPercent: item.fat || 0, // Junction uses 'fat' field instead of a _percentage field
        musclePercent: item.muscle_mass_percentage || 0,
        bonePercent: item.bone_mass_percentage || 0,
        waterPercent: item.water_percentage || 0,
      }));
    } catch (error) {
      console.error(
        `Failed to fetch body composition data for user ${this.supabaseUserId} (${timeRange}-day range):`,
        error,
      );
      return [];
    }
  }

  private async getBloodPressureData(
    timeRange: TimeRange,
  ): Promise<{ date: string; systolicBP: number; diastolicBP: number }[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - timeRange);

    try {
      const response =
        await this.makeJunctionRequest<JunctionBloodPressureResponse>(
          `/v2/timeseries/${this.junctionUserId}/blood_pressure/grouped?start_date=${startDate.toISOString().split("T")[0]}&end_date=${endDate.toISOString().split("T")[0]}`,
        );

      const bloodPressureData: {
        date: string;
        systolicBP: number;
        diastolicBP: number;
      }[] = [];

      // Process data from all providers
      Object.values(response.groups).forEach((providerGroups) => {
        providerGroups.forEach((group) => {
          group.data.forEach((reading) => {
            const date = new Date(reading.timestamp)
              .toISOString()
              .split("T")[0];
            bloodPressureData.push({
              date,
              systolicBP: reading.systolic,
              diastolicBP: reading.diastolic,
            });
          });
        });
      });

      return bloodPressureData;
    } catch (error) {
      console.error(
        `Failed to fetch blood pressure data for user ${this.supabaseUserId} (${timeRange}-day range):`,
        error,
      );
      return [];
    }
  }

  private async getHeartRateVariabilityData(
    timeRange: TimeRange,
  ): Promise<{ date: string; hrv: number }[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - timeRange);

    try {
      const response =
        await this.makeJunctionRequest<JunctionHeartRateVariabilityResponse>(
          `/v2/timeseries/${this.junctionUserId}/hrv/grouped?start_date=${startDate.toISOString().split("T")[0]}&end_date=${endDate.toISOString().split("T")[0]}`,
        );

      const hrvData: { date: string; hrv: number }[] = [];

      // Process data from all providers
      Object.values(response.groups).forEach((providerGroups) => {
        providerGroups.forEach((group) => {
          group.data.forEach((reading) => {
            const date = new Date(reading.timestamp)
              .toISOString()
              .split("T")[0];
            hrvData.push({
              date,
              hrv: reading.value,
            });
          });
        });
      });

      return hrvData;
    } catch (error) {
      console.error(
        `Failed to fetch heart rate variability data for user ${this.supabaseUserId} (${timeRange}-day range):`,
        error,
      );
      return [];
    }
  }

  private async getCardiovascularData(
    timeRange: TimeRange,
  ): Promise<CardiovascularData[]> {
    try {
      // Fetch all cardiovascular data types in parallel
      const [bloodPressureData, heartRateData, hrvData] = await Promise.all([
        this.getBloodPressureData(timeRange),
        this.getRestingHeartRateFromActivity(timeRange),
        this.getHeartRateVariabilityData(timeRange),
      ]);

      // Combine data by date
      const cardiovascularMap = new Map<string, Partial<CardiovascularData>>();

      // Add blood pressure data
      bloodPressureData.forEach((bp) => {
        if (!cardiovascularMap.has(bp.date)) {
          cardiovascularMap.set(bp.date, { date: bp.date });
        }
        const existing = cardiovascularMap.get(bp.date)!;
        existing.systolicBP = bp.systolicBP;
        existing.diastolicBP = bp.diastolicBP;
      });

      // Add heart rate data
      heartRateData.forEach((hr) => {
        if (!cardiovascularMap.has(hr.date)) {
          cardiovascularMap.set(hr.date, { date: hr.date });
        }
        const existing = cardiovascularMap.get(hr.date)!;
        existing.restingHeartRate = hr.restingHeartRate;
      });

      // Add HRV data
      hrvData.forEach((hrv) => {
        if (!cardiovascularMap.has(hrv.date)) {
          cardiovascularMap.set(hrv.date, { date: hrv.date });
        }
        const existing = cardiovascularMap.get(hrv.date)!;
        existing.hrv = hrv.hrv;
      });

      // Convert to CardiovascularData array with defaults for missing values
      return Array.from(cardiovascularMap.values()).map((data) => ({
        date: data.date!,
        systolicBP: data.systolicBP || 0,
        diastolicBP: data.diastolicBP || 0,
        restingHeartRate: data.restingHeartRate || 0,
        hrv: data.hrv || 0,
        bloodOxygen: 0, // Not available from Junction API timeseries endpoints
      }));
    } catch (error) {
      console.error(
        `Failed to fetch cardiovascular data for user ${this.supabaseUserId} (${timeRange}-day range):`,
        error,
      );
      return [];
    }
  }

  private async getGlucoseData(
    timeRange: TimeRange,
  ): Promise<{ date: string; glucoseAverage: number }[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - timeRange);

    try {
      const response = await this.makeJunctionRequest<JunctionGlucoseResponse>(
        `/v2/timeseries/${this.junctionUserId}/glucose/grouped?start_date=${startDate.toISOString().split("T")[0]}&end_date=${endDate.toISOString().split("T")[0]}`,
      );

      const glucoseData: { date: string; glucoseAverage: number }[] = [];

      // Process data from all providers
      Object.values(response.groups).forEach((providerGroups) => {
        providerGroups.forEach((group) => {
          group.data.forEach((reading) => {
            const date = new Date(reading.timestamp)
              .toISOString()
              .split("T")[0];
            // Convert mmol/L to mg/dL if needed (Junction typically uses mmol/L, but our interface expects mg/dL)
            const glucoseValue =
              reading.unit === "mmol/L"
                ? reading.value * 18.01559
                : reading.value;
            glucoseData.push({
              date,
              glucoseAverage: glucoseValue,
            });
          });
        });
      });

      return glucoseData;
    } catch (error) {
      console.error(
        `Failed to fetch glucose data for user ${this.supabaseUserId} (${timeRange}-day range):`,
        error,
      );
      return [];
    }
  }

  private async getMetabolicData(
    timeRange: TimeRange,
  ): Promise<MetabolicData[]> {
    try {
      // Fetch glucose data
      const glucoseData = await this.getGlucoseData(timeRange);

      // Group glucose readings by date and calculate daily averages
      const glucoseByDate = new Map<string, number[]>();

      glucoseData.forEach((reading) => {
        if (!glucoseByDate.has(reading.date)) {
          glucoseByDate.set(reading.date, []);
        }
        glucoseByDate.get(reading.date)!.push(reading.glucoseAverage);
      });

      // Calculate daily averages and return as MetabolicData
      return Array.from(glucoseByDate.entries()).map(([date, readings]) => ({
        date,
        glucoseAverage:
          readings.reduce((sum, value) => sum + value, 0) / readings.length,
      }));
    } catch (error) {
      console.error(
        `Failed to fetch metabolic data for user ${this.supabaseUserId} (${timeRange}-day range):`,
        error,
      );
      return [];
    }
  }

  public async getHealthData(timeRange: TimeRange): Promise<HealthData> {
    try {
      // TODO: TRS - there isn't really a good reason to group the various
      // data types like this, since that's more of a presentation concern. They should probably all just be
      // individual fields, but I didn't want to mess with the existing interfaces from Loveable too much
      const [
        devices,
        sleep,
        activity,
        bodyComposition,
        cardiovascular,
        metabolic,
      ] = await Promise.all([
        this.getConnectedDevices(),
        this.getSleepData(timeRange),
        this.getActivityData(timeRange),
        this.getBodyCompositionData(timeRange),
        this.getCardiovascularData(timeRange),
        this.getMetabolicData(timeRange),
      ]);

      return {
        user: {
          userId: this.supabaseUserId,
          junctionUserId: this.junctionUserId,
          isConnected: true,
        },
        devices,
        sleep,
        activity,
        bodyComposition,
        cardiovascular,
        metabolic,
      };
    } catch (error) {
      console.error(
        `Failed to fetch health data for user ${this.supabaseUserId} (${timeRange}-day range):`,
        error,
      );
      throw new Error(
        `Health data fetch failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  public async generateLinkToken(): Promise<string> {
    try {
      // Use the Junction user ID, not the Supabase user ID
      const response = await this.makeJunctionRequest<{ link_token: string }>(
        "/v2/link/token",
        {
          method: "POST",
          body: JSON.stringify({
            user_id: this.junctionUserId,
          }),
        },
      );

      return response.link_token;
    } catch (error) {
      console.error(
        `Failed to generate link token for Junction user ${this.junctionUserId} (Supabase user ${this.supabaseUserId}):`,
        error,
      );
      throw new Error(
        `Link token generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  public async disconnectDevice(providerId: string): Promise<void> {
    try {
      await this.makeJunctionRequest(
        `/v2/user/${this.junctionUserId}/${providerId}`,
        {
          method: "DELETE",
        },
      );
    } catch (error) {
      console.error(
        `Failed to disconnect device ${providerId} for user ${this.supabaseUserId}:`,
        error,
      );
      throw new Error(
        `Device disconnection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}
