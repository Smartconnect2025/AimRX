import {
  BodyCompositionData,
  CardiovascularData,
  ConnectedDevice,
  HealthData,
  HealthDataService,
  JunctionUser,
  MetabolicData,
  PhysicalActivityData,
  SleepHealthData,
  TimeRange,
} from "@/features/vitals/types/health";

class MockHealthDataService implements HealthDataService {
  private connectedUser: JunctionUser = {
    userId: "user_123",
    junctionUserId: "junction_456",
    isConnected: true,
  };

  private connectedDevices: ConnectedDevice[] = [
    {
      deviceId: "oura_ring_001",
      deviceName: "Oura Ring Gen3",
      deviceType: "other",
      lastSync: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    },
    {
      deviceId: "withings_scale_001",
      deviceName: "Withings Body+",
      deviceType: "scale",
      lastSync: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    },
    {
      deviceId: "dexcom_g6_001",
      deviceName: "Dexcom G6",
      deviceType: "glucose_monitor",
      lastSync: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
    },
  ];

  private generateDateArray(days: number): string[] {
    const dates: string[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split("T")[0]);
    }

    return dates;
  }

  private randomInRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  private generateSleepData(dates: string[]): SleepHealthData[] {
    return dates.map((date) => ({
      date,
      totalSleepHours: this.randomInRange(6, 9),
      sleepEfficiency: this.randomInRange(75, 95),
      sleepScore: this.randomInRange(70, 95),
      sleepStages: (() => {
        const rem = Math.floor(this.randomInRange(15, 25));
        const deep = Math.floor(this.randomInRange(15, 25));
        const awake = Math.floor(this.randomInRange(5, 15));
        const light = 100 - rem - deep - awake;
        return { rem, deep, light, awake };
      })(),
    }));
  }

  private generateActivityData(dates: string[]): PhysicalActivityData[] {
    return dates.map((date) => ({
      date,
      steps: Math.floor(this.randomInRange(5000, 12000)),
      activeCalories: Math.floor(this.randomInRange(200, 600)),
      activeMinutes: Math.floor(this.randomInRange(20, 90)),
      hasWorkout: Math.random() < 0.3,
    }));
  }

  private generateBodyCompositionData(dates: string[]): BodyCompositionData[] {
    return dates
      .map((date, index) => {
        // Only generate data for every 2-3 days to simulate realistic usage
        if (index % 3 !== 0) return null;

        // Generate integer percentages that add up to 100%
        const musclePercent = Math.floor(this.randomInRange(35, 45));
        const bodyFatPercent = Math.floor(this.randomInRange(18, 25));
        const bonePercent = Math.floor(this.randomInRange(3, 5));
        const waterPercent = 100 - musclePercent - bodyFatPercent - bonePercent;

        return {
          date,
          weight: this.randomInRange(150, 155),
          bodyFatPercent: bodyFatPercent,
          musclePercent: musclePercent,
          bonePercent: bonePercent,
          waterPercent: waterPercent,
        };
      })
      .filter(Boolean) as BodyCompositionData[];
  }

  private generateCardiovascularData(dates: string[]): CardiovascularData[] {
    return dates.map((date) => ({
      date,
      systolicBP: Math.floor(this.randomInRange(110, 140)),
      diastolicBP: Math.floor(this.randomInRange(70, 90)),
      restingHeartRate: Math.floor(this.randomInRange(60, 80)),
      hrv: this.randomInRange(30, 70),
      bloodOxygen: this.randomInRange(95, 100),
    }));
  }

  private generateMetabolicData(dates: string[]): MetabolicData[] {
    return dates.map((date) => ({
      date,
      glucoseAverage: this.randomInRange(85, 115),
    }));
  }

  public getHealthData(timeRange: TimeRange, _userId?: string): HealthData {
    const dates = this.generateDateArray(timeRange);

    return {
      user: this.connectedUser,
      devices: this.connectedDevices,
      sleep: this.generateSleepData(dates),
      activity: this.generateActivityData(dates),
      bodyComposition: this.generateBodyCompositionData(dates),
      cardiovascular: this.generateCardiovascularData(dates),
      metabolic: this.generateMetabolicData(dates),
    };
  }

  // Method to simulate disconnected state for testing
  public setConnected(connected: boolean): void {
    this.connectedUser.isConnected = connected;
  }

  // Method to get empty state data
  public getEmptyStateData(): HealthData {
    return {
      user: { ...this.connectedUser, isConnected: false },
      devices: [],
      sleep: [],
      activity: [],
      bodyComposition: [],
      cardiovascular: [],
      metabolic: [],
    };
  }
}

// Export singleton instance
export const mockHealthDataService = new MockHealthDataService();

// Export class for testing
export { MockHealthDataService };
