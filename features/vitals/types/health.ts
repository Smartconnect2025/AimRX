export interface JunctionUser {
  userId: string;
  junctionUserId: string;
  isConnected: boolean;
}

export interface ConnectedDevice {
  deviceId: string;
  deviceName: string;
  deviceType:
    | "watch"
    | "scale"
    | "glucose_monitor"
    | "blood_pressure"
    | "other";
  lastSync: string;
}

export interface SleepStages {
  rem: number; // percentage
  deep: number; // percentage
  light: number; // percentage
  awake: number; // percentage
}

export interface SleepHealthData {
  date: string;
  totalSleepHours: number;
  sleepEfficiency: number | null; // percentage
  sleepScore: number;
  sleepStages: SleepStages;
}

export interface PhysicalActivityData {
  date: string;
  steps: number;
  activeCalories: number;
  activeMinutes: number;
  hasWorkout: boolean;
}

export interface BodyCompositionData {
  date: string;
  weight: number; // lbs
  bodyFatPercent: number;
  musclePercent: number;
  bonePercent: number;
  waterPercent: number;
}

export interface CardiovascularData {
  date: string;
  systolicBP: number;
  diastolicBP: number;
  restingHeartRate: number;
  hrv: number;
  bloodOxygen: number; // percentage
}

export interface MetabolicData {
  date: string;
  glucoseAverage: number; // mg/dL
}

export interface HealthData {
  user: JunctionUser;
  devices: ConnectedDevice[];
  sleep: SleepHealthData[];
  activity: PhysicalActivityData[];
  bodyComposition: BodyCompositionData[];
  cardiovascular: CardiovascularData[];
  metabolic: MetabolicData[];
}

export type TimeRange = 7 | 30 | 90;

export interface HealthDataService {
  getHealthData(timeRange: TimeRange): Promise<HealthData> | HealthData;
}

export type VitalsTooltipProps = {
  active?: boolean;
  payload?: { name: string; value: number | string; color: string }[];
  label?: string;
};
