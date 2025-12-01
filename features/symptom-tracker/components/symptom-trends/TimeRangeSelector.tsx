import { Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimeRangeSelectorProps } from "./types";

const timeRangeOptions = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 3 Months" },
];

export const TimeRangeSelector = ({
  timeRange,
  onTimeRangeChange,
}: TimeRangeSelectorProps) => {
  return (
    <div className="flex items-center gap-2">
      <Select value={timeRange} onValueChange={onTimeRangeChange}>
        <SelectTrigger className="w-[160px] rounded-lg">
          <Calendar className="mr-2 h-4 w-4" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border border-border rounded-lg">
          {timeRangeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
