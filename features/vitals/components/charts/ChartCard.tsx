import { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  children: ReactNode;
}

export const ChartCard = ({ title, children }: ChartCardProps) => {
  return (
    <div className="bg-card rounded-lg p-4 sm:p-6">
      <h3 className="text-sm text-muted-foreground mb-4">{title}</h3>
      {children}
    </div>
  );
};
