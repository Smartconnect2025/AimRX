"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, BarChart3, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BaseTrackerLayout } from "@/features/shared";
import { MoodChart } from "./MoodChart";
import { MoodLog } from "./MoodLog";
import { MoodEntryModal } from "./MoodEntryModal";
import { useMoodEntries } from "../hooks/useMoodEntries";

export const MoodTracker: React.FC = () => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { entries, metrics, isLoading, deleteEntry, refreshEntries } =
    useMoodEntries();

  const handleBack = () => {
    router.back();
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleModalSuccess = () => {
    refreshEntries();
  };

  const handleDeleteEntry = async (entryId: string) => {
    await deleteEntry(entryId);
  };

  const headerActions = (
    <Button
      onClick={handleOpenModal}
      className="bg-primary hover:bg-primary/90"
    >
      <Plus className="h-4 w-4 mr-2" />
      Log Mood
    </Button>
  );

  if (isLoading) {
    return (
      <BaseTrackerLayout
        title="Mood Tracker"
        onBack={handleBack}
        headerActions={headerActions}
      >
        <div className="space-y-6">
          {/* Metrics skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-16 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Chart skeleton */}
          <Card className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-64 bg-muted rounded"></div>
            </CardContent>
          </Card>
        </div>
      </BaseTrackerLayout>
    );
  }

  return (
    <>
      <BaseTrackerLayout
        title="Mood Tracker"
        onBack={handleBack}
        headerActions={headerActions}
      >
        <div className="space-y-6">
          {/* Metrics Cards */}
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Average Mood
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold capitalize">
                    {metrics.averageMood}
                  </div>
                  <p className="text-xs text-muted-foreground">Last 7 days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Mood Streak
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.moodStreak}</div>
                  <p className="text-xs text-muted-foreground">
                    {metrics.moodStreak === 1 ? "day" : "days"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Entries
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metrics.totalEntries}
                  </div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Mood Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Mood Trends</CardTitle>
              <p className="text-sm text-muted-foreground">
                Your mood patterns over the last 14 days
              </p>
            </CardHeader>
            <CardContent>
              <MoodChart entries={entries} />
            </CardContent>
          </Card>

          {/* Mood Log */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Entries</CardTitle>
              <p className="text-sm text-muted-foreground">
                Your mood history and notes
              </p>
            </CardHeader>
            <CardContent>
              <MoodLog
                entries={entries.slice(0, 10)}
                onDeleteEntry={handleDeleteEntry}
              />
            </CardContent>
          </Card>
        </div>
      </BaseTrackerLayout>

      {/* Entry Modal */}
      <MoodEntryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
      />
    </>
  );
};
