import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LabLocationDetails, mockLabLocations } from "./LabLocationDetails";

interface LocationDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationName: string;
}

export const LocationDetailsDialog = ({
  open,
  onOpenChange,
  locationName,
}: LocationDetailsDialogProps) => {
  const location = mockLabLocations.find((loc) => loc.name === locationName);

  if (!location) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Location Details</DialogTitle>
        </DialogHeader>
        <LabLocationDetails location={location} />
      </DialogContent>
    </Dialog>
  );
};
