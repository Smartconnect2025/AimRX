"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TrackerModal } from "@/features/shared";
import { SeveritySlider } from "./SeveritySlider";
import { Symptom, SymptomLog } from "../types";
import { symptomService } from "../services/symptomService";
import { usePatient } from "../hooks";

interface SymptomLoggingModalProps {
  isOpen: boolean;
  onClose: () => void;
  symptom: Symptom | null;
  onLogged?: (newSymptom: SymptomLog) => void;
}

export const SymptomLoggingModal: React.FC<SymptomLoggingModalProps> = ({
  isOpen,
  onClose,
  symptom,
  onLogged,
}) => {
  const [severity, setSeverity] = useState(5);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { patientId } = usePatient();

  const handleSave = async () => {
    if (!symptom || !patientId) return;

    setIsSubmitting(true);
    try {
      const newSymptom = await symptomService.logSymptom({
        symptom_id: symptom.id,
        severity,
        description: notes.trim() || undefined,
        patient_id: patientId,
      });

      if (newSymptom) {
        toast.success("Symptom logged successfully!");
        onLogged?.(newSymptom);
        handleClose();
      } else {
        toast.error("Failed to log symptom.");
      }
    } catch {
      toast.error("Failed to log symptom.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setSeverity(5);
    setNotes("");
    onClose();
  };

  const footerActions = (
    <>
      <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button
        onClick={handleSave}
        disabled={isSubmitting}
        className="bg-primary hover:bg-primary/90"
      >
        <CheckCircle className="h-4 w-4 mr-2" />
        {isSubmitting ? "Saving..." : "Log Symptom"}
      </Button>
    </>
  );

  if (!symptom) return null;

  return (
    <TrackerModal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Log ${symptom.name}`}
      description="Record the severity and any additional notes about this symptom"
      size="large"
      footerActions={footerActions}
    >
      <div className="space-y-6">
        {/* Symptom Display */}
        <div className="text-center p-4 bg-muted/30 rounded-lg">
          <div className="text-4xl mb-2">{symptom.emoji}</div>
          <h3 className="text-lg font-semibold">{symptom.name}</h3>
        </div>

        {/* Severity Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Severity Level</Label>
          <SeveritySlider
            value={severity}
            onChange={(value) => setSeverity(value[0])}
          />
        </div>

        {/* Notes Field */}
        <div className="space-y-3">
          <Label htmlFor="symptom-notes">Additional Notes (Optional)</Label>
          <Textarea
            id="symptom-notes"
            placeholder="Started this morning, Worse after lunch..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={300}
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            {notes.length}/300 characters
          </p>
        </div>
      </div>
    </TrackerModal>
  );
};
