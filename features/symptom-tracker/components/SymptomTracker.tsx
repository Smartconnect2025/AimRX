"use client";

import { Plus } from "lucide-react";
import { usePatient } from "../hooks";
import { Toaster, toast } from "sonner";
import { BaseTrackerLayout } from "@/features/shared";
import { Symptom, SymptomLog } from "../types";
import { Button } from "@/components/ui/button";
import { SymptomTrends } from "./SymptomTrends";
import { RecentSymptoms } from "./RecentSymptoms";
import { SymptomLoggingModal } from "./SymptomLoggingModal";
import { SymptomSelectionModal } from "./SymptomSelectionModal";
import { useState, useEffect } from "react";
import { symptomService } from "../services/symptomService";
import { useRouter } from "next/navigation";

const SymptomTracker = () => {
  const router = useRouter();
  const { patientId } = usePatient();
  const [selectedSymptom, setSelectedSymptom] = useState<Symptom | null>(null);
  const [allSymptoms, setAllSymptoms] = useState<Symptom[]>([]);
  const [logs, setLogs] = useState<SymptomLog[]>([]);
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [isLoggingModalOpen, setIsLoggingModalOpen] = useState(false);

  useEffect(() => {
    symptomService.getAllSymptoms().then(setAllSymptoms);
  }, []);

  useEffect(() => {
    if (!patientId) return;

    const loadLogs = async () => {
      const fetchedLogs = await symptomService.getLogs(patientId);
      setLogs(fetchedLogs);
    };

    loadLogs();
    const unsubscribe = symptomService.subscribeToLogs(patientId, loadLogs);
    return () => unsubscribe();
  }, [patientId]);

  const handleSymptomLogged = (newSymptom: SymptomLog) => {
    setLogs((prev) => [newSymptom, ...prev]);
  };

  const handleEditLog = async (log: SymptomLog) => {
    const success = await symptomService.editSymptom(
      log.id,
      { severity: log.severity, description: log.description },
      patientId,
    );

    if (success) {
      setLogs((prev) =>
        prev.map((item) => (item.id === log.id ? { ...item, ...log } : item)),
      );
      toast.success("Symptom updated successfully.");
    } else {
      toast.error("Failed to update symptom.");
    }
  };

  const handleDeleteLog = async (logId: string) => {
    const success = await symptomService.deleteSymptom(logId, patientId);
    if (success) {
      setLogs((prev) => prev.filter((log) => log.id !== logId));
      toast.success("Symptom deleted successfully.");
    } else {
      toast.error("Failed to delete symptom.");
    }
  };

  const handleSymptomSelect = (symptom: Symptom) => {
    setSelectedSymptom(symptom);
    setIsSelectionModalOpen(false);
    setIsLoggingModalOpen(true);
  };

  const handleSelectionModalClose = () => {
    setIsSelectionModalOpen(false);
  };

  const handleLoggingModalClose = () => {
    setIsLoggingModalOpen(false);
    setSelectedSymptom(null);
  };

  const headerActions = (
    <Button
      variant="default"
      size="sm"
      onClick={() => setIsSelectionModalOpen(true)}
      className="flex items-center gap-2 border-border"
    >
      <Plus className="h-4 w-4" />
      Log Symptom
    </Button>
  );

  return (
    <>
      <BaseTrackerLayout
        title="Symptom Tracker"
        onBack={() => router.back()}
        headerActions={headerActions}
      >
        <div className="space-y-6">
          {/* Chart Row */}
          <div className="bg-white rounded-lg border border-border">
            <SymptomTrends logs={logs} />
          </div>

          {/* Recent Symptoms Row */}
          <RecentSymptoms
            logs={logs}
            isLoading={false}
            onEdit={handleEditLog}
            onDelete={handleDeleteLog}
            allSymptoms={allSymptoms}
          />
        </div>
      </BaseTrackerLayout>

      {/* Symptom Selection Modal */}
      <SymptomSelectionModal
        isOpen={isSelectionModalOpen}
        onClose={handleSelectionModalClose}
        onSelectSymptom={handleSymptomSelect}
        allSymptoms={allSymptoms}
      />

      {/* Symptom Logging Modal */}
      <SymptomLoggingModal
        isOpen={isLoggingModalOpen}
        onClose={handleLoggingModalClose}
        symptom={selectedSymptom}
        onLogged={handleSymptomLogged}
      />

      <Toaster />
    </>
  );
};

export default SymptomTracker;
