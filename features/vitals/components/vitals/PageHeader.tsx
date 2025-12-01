import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import { TimeRange } from "../../types/health";
import { TimeRangeSelector } from "./TimeRangeSelector";
interface PageHeaderProps {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  onManageDevices: () => void;
}
export const PageHeader = ({
  timeRange,
  onTimeRangeChange,
  // onManageDevices
}: PageHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-8">
      <h1 className="text-3xl font-semibold text-foreground">Vitals</h1>

      <div className="flex items-center gap-2">
        <TimeRangeSelector value={timeRange} onChange={onTimeRangeChange} />
        <DialogTrigger asChild>
          <Button
            variant="default"
            className="font-semibold px-6 py-2 rounded-lg flex items-center gap-2"
          >
            Manage Devices
          </Button>
        </DialogTrigger>
      </div>
    </div>
  );
};
