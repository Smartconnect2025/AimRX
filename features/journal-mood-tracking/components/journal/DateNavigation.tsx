import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "../../utils";

interface DateNavigationProps {
  currentDate: Date;
  isToday: boolean;
  onPreviousDay: () => void;
  onNextDay: () => void;
}

export const DateNavigation: React.FC<DateNavigationProps> = ({
  currentDate,
  isToday,
  onPreviousDay,
  onNextDay,
}) => {
  return (
    <div className="flex items-center justify-start space-x-2 mb-2">
      <Button variant="ghost" size="icon" onClick={onPreviousDay} className="h-6 w-6 p-0">
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous day</span>
      </Button>
      <div className="font-medium text-sm">{formatDate(currentDate)}</div>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onNextDay} 
        disabled={isToday} 
        className="h-6 w-6 p-0"
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next day</span>
      </Button>
    </div>
  );
}; 