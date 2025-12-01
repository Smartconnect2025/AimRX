import React from "react";
import { Circle, CheckCircle } from "lucide-react";

interface JournalStatus {
  hasJournaledToday: boolean;
}

interface JournalCardProps {
  status: JournalStatus;
}

export const JournalCard: React.FC<JournalCardProps> = ({ 
  status 
}) => {
  return (
    <div className="flex items-center space-x-3">
      {status.hasJournaledToday ? (
        <CheckCircle className="h-5 w-5 text-green-500" />
      ) : (
        <Circle className="h-5 w-5 text-gray-900" />
      )}
      <div>
        <p className="text-sm font-medium">Your Journal</p>
        <p className="text-xs text-gray-500">
          {status.hasJournaledToday ? "Completed for today" : "Not written yet"}
        </p>
      </div>
    </div>
  );
}; 