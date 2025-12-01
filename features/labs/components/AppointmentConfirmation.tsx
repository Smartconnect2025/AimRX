import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  Calendar,
  Clock,
  Clock3,
  Coffee,
  MapPin,
  Shield,
  Utensils,
} from "lucide-react";
import { useState } from "react";
import { LabAppointment, LabPanel } from "../types/lab";
import { LocationDetailsDialog } from "./LocationDetailsDialog";

interface AppointmentConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: LabAppointment | null;
  panel: LabPanel | null;
}

interface PreparationInstruction {
  icon: React.ReactNode;
  title: string;
  description: string;
  important?: boolean;
}

export const AppointmentConfirmation = ({
  open,
  onOpenChange,
  appointment,
  panel,
}: AppointmentConfirmationProps) => {
  const [locationDetailsOpen, setLocationDetailsOpen] = useState(false);

  if (!appointment || !panel) return null;

  const appointmentTime = appointment.scheduledDate.toLocaleTimeString(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    },
  );

  // const canReschedule = () => {
  //   const appointmentDateTime = new Date(appointment.scheduledDate);
  //   // appointmentDateTime is already set from scheduledDate which includes time

  //   const now = new Date();
  //   const hoursDifference = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  //   return hoursDifference > 24;
  // };

  const getPreparationInstructions = (
    panel: LabPanel,
  ): PreparationInstruction[] => {
    const baseInstructions: PreparationInstruction[] = [
      {
        icon: <Shield className="h-4 w-4" />,
        title: "Bring Required Documents",
        description:
          "Valid photo ID and insurance card are required for check-in.",
      },
      {
        icon: <Clock3 className="h-4 w-4" />,
        title: "Arrive Early",
        description:
          "Please arrive 15 minutes before your appointment time for check-in.",
      },
    ];

    // Add lab-specific instructions based on panel type and requirements
    const specificInstructions: PreparationInstruction[] = [];

    if (panel.fastingRequired) {
      specificInstructions.push({
        icon: <Utensils className="h-4 w-4" />,
        title: "Fasting Required",
        description:
          "Do not eat or drink anything except water for 12 hours before your appointment. This includes gum, mints, and coffee.",
        important: true,
      });
    }

    // Add instructions based on panel name/type
    if (
      panel.name.toLowerCase().includes("metabolic") ||
      panel.name.toLowerCase().includes("glucose")
    ) {
      specificInstructions.push({
        icon: <Coffee className="h-4 w-4" />,
        title: "No Caffeine",
        description:
          "Avoid caffeine 24 hours before your test as it may affect glucose levels.",
      });
    }

    if (
      panel.name.toLowerCase().includes("lipid") ||
      panel.name.toLowerCase().includes("cholesterol")
    ) {
      specificInstructions.push({
        icon: <Utensils className="h-4 w-4" />,
        title: "Dietary Restrictions",
        description:
          "Avoid high-fat meals 24 hours before your test. Stick to lean proteins and vegetables.",
      });
    }

    if (
      panel.name.toLowerCase().includes("hormone") ||
      panel.name.toLowerCase().includes("thyroid")
    ) {
      specificInstructions.push({
        icon: <Clock3 className="h-4 w-4" />,
        title: "Timing Matters",
        description:
          "Best results are obtained when blood is drawn in the morning between 7-10 AM.",
      });
    }

    // Add medication instructions for certain panels
    if (
      panel.name.toLowerCase().includes("vitamin") ||
      panel.name.toLowerCase().includes("b12")
    ) {
      specificInstructions.push({
        icon: <Shield className="h-4 w-4" />,
        title: "Medication Timing",
        description:
          "If you take vitamin supplements, avoid taking them on the morning of your test.",
      });
    }

    return [...specificInstructions, ...baseInstructions];
  };

  const preparationInstructions = getPreparationInstructions(panel);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="h-[85vh] w-[800px] max-w-[95vw]">
          <DialogHeader>
            <div>
              <DialogTitle>Appointment Confirmed</DialogTitle>
              <DialogDescription>
                Your lab appointment has been successfully scheduled
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 px-3 gap-6 overflow-y-auto">
            {/* Appointment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Appointment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-y-4">
                <div className="flex flex-col gap-2">
                  <h4 className="font-medium">Lab Panel</h4>
                  <p className="text-lg">{appointment.panelName}</p>
                  {panel.biomarkers.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {panel.biomarkers.slice(0, 3).map((biomarker: string) => (
                        <Badge
                          key={biomarker}
                          variant="secondary"
                          className="text-xs"
                        >
                          {biomarker}
                        </Badge>
                      ))}
                      <Badge variant="secondary" className="text-xs">
                        +{panel.biomarkers.length - 3} more
                      </Badge>
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">Date</span>
                  </div>
                  <p>
                    {appointment.scheduledDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">Time</span>
                  </div>
                  <p>{appointmentTime}</p>
                  <p className="text-xs text-muted-foreground">
                    Estimated duration: {panel.estimatedTime}
                  </p>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">Location</span>
                  </div>
                  <p>{appointment.location}</p>
                  <p className="text-sm text-muted-foreground">
                    {appointment.address}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Preparation Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Preparation Instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {preparationInstructions.map((instruction, index) => (
                  <Alert
                    key={index}
                    className={
                      instruction.important
                        ? "border-amber-400 bg-amber-50"
                        : ""
                    }
                  >
                    <AlertTitle className="flex items-center gap-3">
                      {instruction.icon}
                      <h4 className="font-medium">{instruction.title}</h4>
                    </AlertTitle>
                    <AlertDescription>
                      {instruction.description}
                    </AlertDescription>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Location Details Dialog */}
      <LocationDetailsDialog
        open={locationDetailsOpen}
        onOpenChange={setLocationDetailsOpen}
        locationName={appointment.location}
      />
    </>
  );
};
