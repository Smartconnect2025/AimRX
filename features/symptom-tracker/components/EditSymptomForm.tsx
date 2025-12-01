"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { Symptom, SymptomLog } from "../types";
import { Button } from "@/components/ui/button";
import { SeveritySlider } from "./SeveritySlider";
import { Textarea } from "@/components/ui/textarea";

interface EditSymptomFormProps {
  log: SymptomLog;
  onClose: () => void;
  onSave: (updatedLog: SymptomLog) => void;
  allSymptoms: Symptom[];
}

export const EditSymptomForm = ({
  log,
  onClose,
  onSave,
  allSymptoms,
}: EditSymptomFormProps) => {
  const [severity, setSeverity] = useState(log.severity);
  const [description, setDescription] = useState(log.description || "");

  const symptom = allSymptoms.find((s) => s.id === log.symptom_id);

  const handleSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const updatedLog: SymptomLog = {
      ...log,
      severity,
      description: description.trim() || undefined,
    };

    onSave(updatedLog);
    onClose();
  };

  if (!symptom) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground">
          Symptom details not found.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-border shadow-sm">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="space-y-2">
          <h3 className="text-xl sm:text-2xl font-semibold flex items-center gap-3 text-foreground">
            <span className="text-2xl">{symptom.emoji}</span>
            Edit {symptom.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            You can update the severity and description for this symptom.
          </p>
        </div>

        <div className="space-y-4 sm:space-y-5">
          {/* Severity Slider */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground block">
              Severity Level
            </label>
            <SeveritySlider
              value={severity}
              onChange={(value) => setSeverity(value[0])}
            />
          </div>

          {/* Description Field */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground block">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any relevant notes about this symptom..."
              maxLength={300}
              rows={3}
              className="resize-none border-border focus:border-primary focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/300 characters
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={handleSubmit}
              size="lg"
              variant="default"
              className="flex-1 order-2 sm:order-1 rounded-lg py-2 sm:py-0"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              <span>Save Changes</span>
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
