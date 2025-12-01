"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@core/auth";
import { BaseTrackerLayout, TrackerModal } from "@/features/shared";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { VitalsGoalCard } from "./VitalsGoalCard";
import { VitalsGoalForm } from "./VitalsGoalForm";
import { ManualVitalsModal } from "../../vitals/components/ManualVitalsModal";
import * as api from "../api";
import { VitalsGoal, VitalEntry, GoalFormData } from "../types";

export function VitalsGoalTracker() {
  const router = useRouter();
  const { user } = useUser();

  const [goals, setGoals] = useState<VitalsGoal[]>([]);
  const [vitalEntries, setVitalEntries] = useState<
    Record<string, VitalEntry[]>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
  const [isVitalModalOpen, setIsVitalModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load goals and vital entries
  useEffect(() => {
    if (!user?.id) return;

    const loadData = async () => {
      try {
        setIsLoading(true);

        // Load goals
        const goalsData = await api.getVitalsGoals(user.id);
        setGoals(goalsData);

        // Load vital entries for each goal type
        const entriesData: Record<string, VitalEntry[]> = {};
        const vitalTypes = [...new Set(goalsData.map((g) => g.vital_type))];

        await Promise.all(
          vitalTypes.map(async (vitalType) => {
            try {
              const entries = await api.getVitalEntries(vitalType, 90); // Load 90 days of data
              entriesData[vitalType] = entries;
            } catch (error) {
              console.error(`Failed to load ${vitalType} entries:`, error);
              entriesData[vitalType] = [];
            }
          }),
        );

        setVitalEntries(entriesData);
      } catch (error) {
        console.error("Failed to load goals:", error);
        toast.error("Failed to load goals");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  const handleCreateGoal = async (formData: GoalFormData) => {
    if (!user?.id) return;

    try {
      setIsSubmitting(true);

      const goalData = {
        ...formData,
        user_id: user.id,
      };

      await api.createVitalsGoal(goalData);

      // Reload goals
      const updatedGoals = await api.getVitalsGoals(user.id);
      setGoals(updatedGoals);

      setIsGoalFormOpen(false);
      toast.success("Goal created successfully!");
    } catch (error) {
      console.error("Failed to create goal:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create goal",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await api.deleteVitalsGoal(goalId);
      setGoals(goals.filter((g) => g.id !== goalId));
      toast.success("Goal deleted successfully!");
    } catch (error) {
      console.error("Failed to delete goal:", error);
      toast.error("Failed to delete goal");
    }
  };

  const handleVitalLogged = async () => {
    if (!user?.id) return;

    try {
      // Reload vital entries for all goal types
      const vitalTypes = [...new Set(goals.map((g) => g.vital_type))];
      const entriesData: Record<string, VitalEntry[]> = {};

      await Promise.all(
        vitalTypes.map(async (vitalType) => {
          try {
            const entries = await api.getVitalEntries(vitalType, 90);
            entriesData[vitalType] = entries;
          } catch (error) {
            console.error(`Failed to reload ${vitalType} entries:`, error);
            entriesData[vitalType] = vitalEntries[vitalType] || [];
          }
        }),
      );

      setVitalEntries(entriesData);
    } catch (error) {
      console.error("Failed to reload vital entries:", error);
    }
  };

  const headerActions = (
    <Button
      onClick={() => setIsGoalFormOpen(true)}
      className="flex items-center gap-2"
    >
      <Plus className="h-4 w-4" />
      New Goal
    </Button>
  );

  if (!user?.id) {
    return null;
  }

  return (
    <>
      <BaseTrackerLayout
        title="Goals Tracker"
        onBack={() => router.back()}
        headerActions={headerActions}
      >
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your goals...</p>
            </div>
          ) : goals.length === 0 ? (
            <div className="text-center py-12">
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">No goals yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your health goals to start tracking your progress with
                  vitals data.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {goals.map((goal) => (
                <VitalsGoalCard
                  key={goal.id}
                  goal={goal}
                  vitalEntries={vitalEntries[goal.vital_type] || []}
                  onLogVital={() => setIsVitalModalOpen(true)}
                  onDeleteGoal={handleDeleteGoal}
                />
              ))}
            </div>
          )}
        </div>
      </BaseTrackerLayout>

      {/* Goal Creation Modal */}
      <TrackerModal
        isOpen={isGoalFormOpen}
        onClose={() => setIsGoalFormOpen(false)}
        title="Create New Goal"
        description="Set up a new health goal based on your vitals data"
        size="large"
      >
        <VitalsGoalForm
          onSubmit={handleCreateGoal}
          onCancel={() => setIsGoalFormOpen(false)}
          isSubmitting={isSubmitting}
        />
      </TrackerModal>

      {/* Manual Vitals Logging Modal */}
      <ManualVitalsModal
        isOpen={isVitalModalOpen}
        onClose={() => setIsVitalModalOpen(false)}
        onVitalLogged={handleVitalLogged}
      />
    </>
  );
}
