import React from "react";
import { BarChart3, Flame, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricsCard } from "./dashboard/MetricsCard";
import { JournalCard } from "./dashboard/JournalCard";
import { MoodTimeline } from "./dashboard/MoodTimeline";
import { MoodEmoji } from "./mood/MoodEmoji";
import { useDashboardData } from "../hooks/useDashboardData";
import { useProfile } from "@/features/profile";

interface JournalMoodDashboardProps {
  onJournalClick?: () => void;
  onMoodTrackerClick?: () => void;
}

export const JournalMoodDashboard: React.FC<JournalMoodDashboardProps> = ({
  onJournalClick,
  onMoodTrackerClick,
}) => {
  const { metrics, journalStatus, recentMoodEntries, isLoading } =
    useDashboardData();
  const { profile } = useProfile();

  const handleJournalClick = () => {
    if (onJournalClick) {
      onJournalClick();
    } else {
      console.log("Navigate to journal page");
    }
  };

  const handleMoodTrackerClick = () => {
    if (onMoodTrackerClick) {
      onMoodTrackerClick();
    } else {
      console.log("Navigate to mood tracker page");
    }
  };

  // Get user's first name or fallback to a generic greeting
  const userName = profile?.firstName || "there";

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 animate-pulse">
        <div className="flex-grow px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto w-full">
          <div className="space-y-8">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Main Content Area */}
      <main className="flex-grow px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto w-full">
        {/* Personalized Greeting Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Welcome, {userName}!
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Here&apos;s an overview of your dashboard.
          </p>
        </div>

        {/* Top Section: Metric Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
          {/* Average Mood Card */}
          <MetricsCard
            title="Average Mood"
            value={
              <div className="flex items-center justify-center sm:justify-start">
                <MoodEmoji
                  mood={metrics.averageMood}
                  size={8}
                  className="sm:h-10 sm:w-10"
                />
                <span className="hidden sm:inline ml-2 capitalize">
                  {metrics.averageMood}
                </span>
              </div>
            }
            icon={BarChart3}
            footer="Last 7 days"
            centerContent={true}
          />

          {/* Mood Streak Card */}
          <MetricsCard
            title="Mood Streak"
            value={
              <div className="flex items-center justify-center sm:justify-start">
                {metrics.moodStreak}
                <Flame className="ml-1 h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
              </div>
            }
            icon={Flame}
            footer="Days"
            centerContent={true}
          />

          {/* Days Journaled Card */}
          <MetricsCard
            title="Days Journaled"
            value={metrics.daysJournaled.toString()}
            icon={Calendar}
            footer="This month"
            centerContent={true}
          />
        </div>

        {/* Journal Card - Full Width */}
        <div className="mb-8">
          <Card className="border-gray-100 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">Journal</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleJournalClick}
                className="text-[#66cdcc] hover:text-[#66cdcc]/80"
              >
                Edit
              </Button>
            </CardHeader>
            <CardContent>
              <JournalCard status={journalStatus} />
            </CardContent>
          </Card>
        </div>

        {/* Mood Entries Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Mood Entries</h3>
            <Button
              onClick={handleMoodTrackerClick}
              className="bg-[#4BCBC7] hover:bg-[#3BABA7] text-white"
            >
              Track Mood
            </Button>
          </div>

          {/* Timeline for mood entries */}
          <MoodTimeline moodEntries={recentMoodEntries} />
        </div>
      </main>
    </div>
  );
};
