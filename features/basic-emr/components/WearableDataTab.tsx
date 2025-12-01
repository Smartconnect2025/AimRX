"use client";

import { useState, useEffect, useCallback } from "react";
import { HealthData } from "@/features/vitals/types/health";

// Import existing vitals charts
import { TotalSleepChart } from "@/features/vitals/components/charts/sleep/TotalSleepChart";
import { SleepEfficiencyChart } from "@/features/vitals/components/charts/sleep/SleepEfficiencyChart";
import { SleepScoreChart } from "@/features/vitals/components/charts/sleep/SleepScoreChart";
import { SleepStagesChart } from "@/features/vitals/components/charts/sleep/SleepStagesChart";
import { DailyStepsChart } from "@/features/vitals/components/charts/activity/DailyStepsChart";
import { ActiveCaloriesChart } from "@/features/vitals/components/charts/activity/ActiveCaloriesChart";
import { ActiveMinutesChart } from "@/features/vitals/components/charts/activity/ActiveMinutesChart";
import { WeightChart } from "@/features/vitals/components/charts/body/WeightChart";
import { BodyCompositionChart } from "@/features/vitals/components/charts/body/BodyCompositionChart";
import { BloodPressureChart } from "@/features/vitals/components/charts/cardio/BloodPressureChart";
import { RestingHeartRateChart } from "@/features/vitals/components/charts/cardio/RestingHeartRateChart";
import { HRVChart } from "@/features/vitals/components/charts/cardio/HRVChart";
import { BloodOxygenChart } from "@/features/vitals/components/charts/cardio/BloodOxygenChart";
import { GlucoseChart } from "@/features/vitals/components/charts/metabolic/GlucoseChart";

interface WearableDataTabProps {
  patientId: string;
}

interface SectionHeaderProps {
  title: string;
  description?: string;
}

const SectionHeader = ({ title, description }: SectionHeaderProps) => (
  <div className="mb-6">
    <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
    {description && <p className="text-sm text-gray-600">{description}</p>}
  </div>
);

const LoadingState = () => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-gray-600">Loading wearable data...</p>
    </div>
  </div>
);

const ErrorState = ({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) => {
  const isTrialLimitError =
    error.includes("trial period") || error.includes("7 days");

  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center max-w-md">
        <p className="text-red-600 mb-2">Error loading wearable data</p>
        <p className="text-gray-600 text-sm mb-4">{error}</p>

        {isTrialLimitError && (
          <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Trial Account Limitation:</strong> Junction trial accounts
              are limited to 7 days of historical data. Data will be limited to
              the past week.
            </p>
          </div>
        )}

        <button
          onClick={onRetry}
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    </div>
  );
};

const NoDataState = ({ deviceCount }: { deviceCount: number }) => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center max-w-md">
      {deviceCount === 0 ? (
        <>
          <p className="text-gray-600 mb-2">No wearable devices connected</p>
          <p className="text-sm text-gray-500 mb-4">
            This patient needs to connect wearable devices to start tracking
            health data
          </p>
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>To connect devices:</strong> Patient should log into their
              portal and connect Fitbit, Apple Health, or other supported
              devices via Junction.
            </p>
          </div>
        </>
      ) : (
        <>
          <p className="text-gray-600 mb-2">No recent wearable data</p>
          <p className="text-sm text-gray-500 mb-4">
            Connected devices haven&apos;t synced data in the selected time
            range
          </p>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Junction trial accounts are limited to 7
              days of data. Data may take time to sync from connected devices.
            </p>
          </div>
        </>
      )}
    </div>
  </div>
);

export function WearableDataTab({ patientId }: WearableDataTabProps) {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange] = useState<7 | 30 | 90>(7); // Default to 7 days for trial accounts

  const fetchHealthData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/vitals/junction/health?timeRange=${timeRange}&patientId=${patientId}`,
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to fetch wearable data");
      }

      setHealthData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Failed to fetch wearable data:", err);
    } finally {
      setLoading(false);
    }
  }, [timeRange, patientId]);

  useEffect(() => {
    fetchHealthData();
  }, [fetchHealthData]);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={fetchHealthData} />;
  }

  if (!healthData) {
    return <NoDataState deviceCount={0} />;
  }

  const hasData = {
    sleep: healthData.sleep.length > 0,
    activity: healthData.activity.length > 0,
    body: healthData.bodyComposition.length > 0,
    cardio: healthData.cardiovascular.length > 0,
    metabolic: healthData.metabolic.length > 0,
  };

  const hasAnyData = Object.values(hasData).some(Boolean);

  if (!hasAnyData) {
    return <NoDataState deviceCount={healthData.devices.length} />;
  }

  return (
    <div className="space-y-8">
      {/* Sleep Data Section */}
      {hasData.sleep && (
        <section>
          <SectionHeader
            title="Sleep Metrics"
            description="Sleep duration, efficiency, and quality metrics from wearable devices"
          />
          <div className="grid grid-cols-1 gap-6">
            <TotalSleepChart data={healthData.sleep} />
            <SleepEfficiencyChart data={healthData.sleep} />
            <SleepScoreChart data={healthData.sleep} />
            <SleepStagesChart data={healthData.sleep} />
          </div>
        </section>
      )}

      {/* Activity Data Section */}
      {hasData.activity && (
        <section>
          <SectionHeader
            title="Physical Activity"
            description="Daily steps, calories burned, and active minutes"
          />
          <div className="grid grid-cols-1 gap-6">
            <DailyStepsChart data={healthData.activity} />
            <ActiveCaloriesChart data={healthData.activity} />
            <ActiveMinutesChart data={healthData.activity} />
          </div>
        </section>
      )}

      {/* Body Composition Section */}
      {hasData.body && (
        <section>
          <SectionHeader
            title="Body Composition"
            description="Weight and body composition measurements"
          />
          <div className="grid grid-cols-1 gap-6">
            <WeightChart data={healthData.bodyComposition} />
            <BodyCompositionChart data={healthData.bodyComposition} />
          </div>
        </section>
      )}

      {/* Cardiovascular Section */}
      {hasData.cardio && (
        <section>
          <SectionHeader
            title="Cardiovascular Health"
            description="Heart rate, blood pressure, and cardiovascular metrics"
          />
          <div className="grid grid-cols-1 gap-6">
            <BloodPressureChart data={healthData.cardiovascular} />
            <RestingHeartRateChart data={healthData.cardiovascular} />
            <HRVChart data={healthData.cardiovascular} />
            <BloodOxygenChart data={healthData.cardiovascular} />
          </div>
        </section>
      )}

      {/* Metabolic Section */}
      {hasData.metabolic && (
        <section>
          <SectionHeader
            title="Metabolic Health"
            description="Blood glucose and metabolic indicators"
          />
          <div className="grid grid-cols-1 gap-6">
            <GlucoseChart data={healthData.metabolic} />
          </div>
        </section>
      )}
    </div>
  );
}
