"use client";

import React, { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrackerModal } from "@/features/shared";
import { SymptomSearch } from "./SymptomSearch";
import { Symptom } from "../types";

interface SymptomSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSymptom: (symptom: Symptom) => void;
  allSymptoms: Symptom[];
}

export const SymptomSelectionModal: React.FC<SymptomSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectSymptom,
  allSymptoms,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSymptoms = useMemo(() => {
    if (!searchQuery) return [];
    const query = searchQuery.toLowerCase();
    return allSymptoms.filter((symptom) =>
      symptom.name.toLowerCase().includes(query),
    );
  }, [searchQuery, allSymptoms]);

  const handleAddCustomSymptom = () => {
    if (!searchQuery.trim()) return;
    const customSymptom: Symptom = {
      id: `custom-${crypto.randomUUID()}`,
      name: searchQuery.trim(),
      emoji: "📝",
      is_common: false,
    };
    onSelectSymptom(customSymptom);
    setSearchQuery("");
  };

  const handleSelectSymptom = (symptom: Symptom) => {
    onSelectSymptom(symptom);
    setSearchQuery("");
  };

  const handleClose = () => {
    setSearchQuery("");
    onClose();
  };

  const renderSymptomButton = (symptom: Symptom) => (
    <Button
      key={symptom.id}
      variant="outline"
      className="h-auto py-4 px-3 flex flex-col items-center justify-center gap-2 bg-white rounded-lg hover:bg-secondary transition-colors border-border min-h-[44px] min-w-[44px]"
      onClick={() => handleSelectSymptom(symptom)}
    >
      <span className="text-xl sm:text-2xl">{symptom.emoji}</span>
      <span className="text-sm font-medium text-center leading-tight text-foreground line-clamp-2">
        {symptom.name}
      </span>
    </Button>
  );

  return (
    <TrackerModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Select Symptom"
      description="Choose a symptom to track or search for a custom one"
      size="large"
    >
      <div className="space-y-6">
        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SymptomSearch value={searchQuery} onChange={setSearchQuery} />
          </div>
          {searchQuery && filteredSymptoms.length === 0 && (
            <Button
              onClick={handleAddCustomSymptom}
              variant="default"
              className="whitespace-nowrap"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Custom
            </Button>
          )}
        </div>

        {/* Symptoms Grid */}
        <div className="relative">
          <div
            className={`grid grid-cols-3 gap-3 sm:gap-4 transition-opacity duration-300 ease-in-out ${
              searchQuery
                ? "opacity-0 absolute inset-0 pointer-events-none"
                : "opacity-100"
            }`}
          >
            {allSymptoms.filter((s) => s.is_common).map(renderSymptomButton)}
          </div>
          <div
            className={`grid grid-cols-3 gap-3 sm:gap-4 transition-opacity duration-300 ease-in-out ${
              searchQuery
                ? "opacity-100"
                : "opacity-0 absolute inset-0 pointer-events-none"
            }`}
          >
            {filteredSymptoms.map(renderSymptomButton)}
          </div>
          {searchQuery && filteredSymptoms.length === 0 && (
            <div className="text-center py-8 bg-muted/30 rounded-lg border border-border">
              <p className="text-foreground">No matching symptoms found.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Click &quot;Add Custom&quot; to log your symptom.
              </p>
            </div>
          )}
        </div>
      </div>
    </TrackerModal>
  );
};
