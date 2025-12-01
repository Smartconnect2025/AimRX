import { HealthData, TimeRange } from "../../types/health";
import { VitalsTab } from "./TabNavigation";

// Sleep Charts
import { SleepEfficiencyChart } from "../charts/sleep/SleepEfficiencyChart";
import { SleepScoreChart } from "../charts/sleep/SleepScoreChart";
import { SleepStagesChart } from "../charts/sleep/SleepStagesChart";
import { TotalSleepChart } from "../charts/sleep/TotalSleepChart";

// Activity Charts
import { ActiveCaloriesChart } from "../charts/activity/ActiveCaloriesChart";
import { ActiveMinutesChart } from "../charts/activity/ActiveMinutesChart";
import { DailyStepsChart } from "../charts/activity/DailyStepsChart";

// Body Charts
import { BodyCompositionChart } from "../charts/body/BodyCompositionChart";
import { WeightChart } from "../charts/body/WeightChart";

// Cardio Charts
import { BloodOxygenChart } from "../charts/cardio/BloodOxygenChart";
import { BloodPressureChart } from "../charts/cardio/BloodPressureChart";
import { HRVChart } from "../charts/cardio/HRVChart";
import { RestingHeartRateChart } from "../charts/cardio/RestingHeartRateChart";

// Metabolic Charts
import { useMemo } from "react";
import { GlucoseChart } from "../charts/metabolic/GlucoseChart";

interface TabContentProps {
  activeTab: VitalsTab;
  timeRange: TimeRange;
  healthData: HealthData;
}

export const TabContent = ({
  activeTab,
  timeRange: _timeRange,
  healthData: unsortedHealthData,
}: TabContentProps) => {
  // Sort the health data by date so it shows up correctly in the charts
  const healthData = useMemo(
    () => ({
      sleep: unsortedHealthData.sleep.toSorted(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
      activity: unsortedHealthData.activity.toSorted(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
      bodyComposition: unsortedHealthData.bodyComposition.toSorted(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
      cardiovascular: unsortedHealthData.cardiovascular.toSorted(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
      metabolic: unsortedHealthData.metabolic.toSorted(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
    }),
    [unsortedHealthData],
  );

  const renderNoData = () => (
    <div className="bg-card rounded-2xl p-8 text-center">
      <p className="text-muted-foreground">
        No data available for this time period
      </p>
    </div>
  );

  const renderSleepHealth = () => {
    if (healthData.sleep.length === 0) return renderNoData();

    return (
      <div className="grid grid-cols-1 gap-6">
        <TotalSleepChart data={healthData.sleep} />
        <SleepEfficiencyChart data={healthData.sleep} />
        <SleepScoreChart data={healthData.sleep} />
        <SleepStagesChart data={healthData.sleep} />
      </div>
    );
  };

  const renderActivity = () => {
    if (healthData.activity.length === 0) return renderNoData();

    return (
      <div className="grid grid-cols-1 gap-6">
        <DailyStepsChart data={healthData.activity} />
        <ActiveCaloriesChart data={healthData.activity} />
        <ActiveMinutesChart data={healthData.activity} />
      </div>
    );
  };

  const renderBodyComposition = () => {
    if (healthData.bodyComposition.length === 0) return renderNoData();

    return (
      <div className="grid grid-cols-1 gap-6">
        <WeightChart data={healthData.bodyComposition} />
        <BodyCompositionChart data={healthData.bodyComposition} />
      </div>
    );
  };

  const renderCardiovascular = () => {
    if (healthData.cardiovascular.length === 0) return renderNoData();

    return (
      <div className="grid grid-cols-1 gap-6">
        <BloodPressureChart data={healthData.cardiovascular} />
        <RestingHeartRateChart data={healthData.cardiovascular} />
        <HRVChart data={healthData.cardiovascular} />
        <BloodOxygenChart data={healthData.cardiovascular} />
      </div>
    );
  };

  const renderMetabolic = () => {
    if (healthData.metabolic.length === 0) return renderNoData();

    return (
      <div className="grid grid-cols-1">
        <GlucoseChart data={healthData.metabolic} />
      </div>
    );
  };

  switch (activeTab) {
    case "sleep":
      return renderSleepHealth();
    case "activity":
      return renderActivity();
    case "body-composition":
      return renderBodyComposition();
    case "cardiovascular":
      return renderCardiovascular();
    case "metabolic":
      return renderMetabolic();
    default:
      return renderNoData();
  }
};
