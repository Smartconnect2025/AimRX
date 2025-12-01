"use client";

import { toast } from "sonner";
import { useState } from "react";
import { usePatient } from "../hooks";
import { CheckCircle } from "lucide-react";
import { Symptom, SymptomLog } from "../types";
import { Button } from "@/components/ui/button";
import { SeveritySlider } from "./SeveritySlider";
import { Textarea } from "@/components/ui/textarea";
import { symptomService } from "../services/symptomService";

interface SymptomLoggingPanelProps {
  symptom: Symptom;
  onClose: () => void;
  onSubmit: (symptomId: string, severity: number, notes?: string) => void;
  onLogged?: (newSymptom: SymptomLog) => void;
}

export const SymptomLoggingPanel = ({
  symptom,
  onClose,
  onSubmit: _onSubmit,
  onLogged,
}: SymptomLoggingPanelProps) => {
  const [severity, setSeverity] = useState(5);
  const [notes, setNotes] = useState("");

  const { patientId } = usePatient();

  const handleSubmit = async () => {
    if (!patientId) return;
    const newSymptom = await symptomService.logSymptom({
      symptom_id: symptom?.id,
      severity,
      description: notes || undefined,
      patient_id: patientId,
    });

    if (newSymptom) {
      toast.success("Symptom logged successfully!");
      onLogged?.(newSymptom);
      onClose();
    } else {
      toast.error("Failed to log symptom.");
    }
  };

  return (
    <div className="bg-white rounded-lg border border-border shadow-sm">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="space-y-2">
          <h3 className="text-xl sm:text-2xl font-semibold flex items-center gap-3 text-foreground">
            <span className="text-2xl">{symptom.emoji}</span>
            {symptom.name}
          </h3>
        </div>

        <div className="space-y-4 sm:space-y-5">
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground block">
              Severity Level
            </label>
            <SeveritySlider
              value={severity}
              onChange={(value) => setSeverity(value[0])}
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground block">
              Notes
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Started this morning, Worse after lunch..."
              maxLength={300}
              rows={3}
              className="resize-none border-border focus:border-primary focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground">
              {notes.length}/300 characters
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={handleSubmit}
              size="lg"
              variant="default"
              className="flex-1 order-2 sm:order-1 py-2 sm:py-0 rounded-lg"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              <span>Log Symptom</span>
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="border-border text-foreground hover:bg-secondary order-1 sm:order-2 rounded-lg"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
