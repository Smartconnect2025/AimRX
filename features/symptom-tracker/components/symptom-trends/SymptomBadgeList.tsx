import { Badge } from "@/components/ui/badge";
import { SymptomBadgeListProps } from "./types";

const colorClasses = [
  "bg-red-500 text-white",
  "bg-green-500 text-white",
  "bg-blue-500 text-white",
];

export const SymptomBadgeList = ({
  topSymptoms,
  selectedSymptoms,
  logs,
  onToggleSymptom,
}: SymptomBadgeListProps) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Top Symptoms:</span>
      {topSymptoms.map((symptom, index) => {
        const isSelected = selectedSymptoms.has(symptom);
        const count = logs.filter(
          (log) => log.symptom?.name === symptom,
        ).length;

        return (
          <Badge
            key={symptom}
            variant="default"
            className={`text-xs sm:text-sm cursor-pointer transition-opacity ${
              colorClasses[index] || "bg-gray-400 text-white"
            } ${!isSelected ? "opacity-50" : ""} 
            ${
              colorClasses[index]?.split(" ")[0].replace("bg-", "hover:bg-") ||
              "hover:bg-gray-400"
            }`}
            onClick={() => onToggleSymptom(symptom)}
          >
            {symptom} ({count})
          </Badge>
        );
      })}
    </div>
  );
};
