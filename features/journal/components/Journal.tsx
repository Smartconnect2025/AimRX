"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, BookOpen, Activity, Coffee, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BaseTrackerLayout } from "@/features/shared";
import { JournalLog } from "./JournalLog";
import { JournalEntryModal } from "./JournalEntryModal";
import { useJournalEntries } from "../hooks/useJournalEntries";

export const Journal: React.FC = () => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { entries, metrics, isLoading, deleteEntry, refreshEntries } =
    useJournalEntries();

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
      Add Journal
    </Button>
  );

  if (isLoading) {
    return (
      <BaseTrackerLayout
        title="Journal"
        description="Record your thoughts, experiences, and daily reflections"
        onBack={handleBack}
        headerActions={headerActions}
      >
        <div className="space-y-6">
          {/* Metrics skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-16 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Entries skeleton */}
          <Card className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-muted rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </BaseTrackerLayout>
    );
  }

  return (
    <>
      <BaseTrackerLayout
        title="Journal"
        description="Record your thoughts, experiences, and daily reflections"
        onBack={handleBack}
        headerActions={headerActions}
      >
        <div className="space-y-6">
          {/* Metrics Cards */}
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Entries
                  </CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metrics.totalEntries}
                  </div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Exercise Days
                  </CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metrics.exerciseDays}
                  </div>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Avg Caffeine
                  </CardTitle>
                  <Coffee className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metrics.averageCaffeine}
                  </div>
                  <p className="text-xs text-muted-foreground">Servings/day</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Current Streak
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metrics.currentStreak}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {metrics.currentStreak === 1 ? "day" : "days"}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Journal Entries */}
          <Card>
            <CardHeader>
              <CardTitle>Journal Entries</CardTitle>
              <p className="text-sm text-muted-foreground">
                Your personal thoughts and daily reflections
              </p>
            </CardHeader>
            <CardContent>
              <JournalLog entries={entries} onDeleteEntry={handleDeleteEntry} />
            </CardContent>
          </Card>
        </div>
      </BaseTrackerLayout>

      {/* Entry Modal */}
      <JournalEntryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
      />
    </>
  );
};
