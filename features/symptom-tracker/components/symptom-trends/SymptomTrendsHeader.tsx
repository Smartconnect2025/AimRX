import { SymptomTrendsHeaderProps } from "./types";

export const SymptomTrendsHeader = ({ title }: SymptomTrendsHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-medium">{title}</h3>
    </div>
  );
};
