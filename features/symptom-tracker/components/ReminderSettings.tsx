"use client";

import { toast } from "sonner";
import { usePatient } from "../hooks";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Bell, Loader2 } from "lucide-react";
import { reminderService } from "../services/reminderService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Frequency, Reminder } from "../types";

export function ReminderSettings() {
  const { patientId } = usePatient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const [newReminder, setNewReminder] = useState<
    Omit<Reminder, "id" | "patient_id" | "created_at" | "updated_at">
  >({
    frequency: "daily",
    time_of_day: ["12:00"],
    enabled: true,
  });

  useEffect(() => {
    const fetchReminders = async () => {
      if (!patientId) return;
      setLoading(true);
      try {
        const data = await reminderService.getReminders(patientId);
        setReminders(data);
      } catch {
        toast.error("Failed to load reminders.");
      } finally {
        setLoading(false);
      }
    };

    fetchReminders();
  }, [patientId]);

  const handleAddReminder = async () => {
    if (!patientId) return;

    try {
      const result = await reminderService.createReminder({
        patient_id: patientId,
        frequency: newReminder.frequency,
        time_of_day: newReminder.time_of_day,
        enabled: true,
      });

      if (result) {
        setReminders([...reminders, result]);

        toast.success("Reminder added successfully.");

        setOpen(false);
        resetNewReminder();
      }
    } catch (error) {
      console.error("Error creating reminder:", error);
      toast.error("Failed to create reminder.");
    }
  };

  const handleDeleteReminder = async (id: number) => {
    if (!patientId) return;

    try {
      const success = await reminderService.deleteReminder(id, patientId);
      if (success) {
        setReminders(reminders.filter((reminder) => reminder.id !== id));
        toast.success("Reminder deleted successfully.");
      }
    } catch (error) {
      console.error("Error deleting reminder:", error);
      toast.error("Failed to delete reminder.");
    }
  };

  const handleToggleReminder = async (id: number) => {
    if (!patientId) return;

    const reminder = reminders.find((r) => r.id === id);
    if (!reminder) return;

    try {
      const success = await reminderService.toggleReminder(
        id,
        !reminder.enabled,
        patientId,
      );
      if (success) {
        const updatedReminders = reminders.map((r) =>
          r.id === id ? { ...r, enabled: !r.enabled } : r,
        );
        setReminders(updatedReminders);

        toast.success(
          !reminder.enabled
            ? "Reminder enabled successfully."
            : "Reminder disabled successfully.",
        );
      }
    } catch (error) {
      console.error("Error toggling reminder:", error);
      toast.error("Failed to update reminder.");
    }
  };

  const resetNewReminder = () => {
    setNewReminder({
      frequency: "daily",
      time_of_day: ["12:00"],
      enabled: true,
    });
  };

  const handleFrequencyChange = (value: Frequency) => {
    // Create default time fields based on frequency
    let defaultTimes: string[] = [];

    switch (value) {
      case "daily":
        defaultTimes = ["12:00"];
        break;
      case "twice-daily":
        defaultTimes = ["09:00", "18:00"];
        break;
      case "weekly":
        defaultTimes = ["12:00"];
        break;
      default:
        defaultTimes = ["12:00"];
    }

    setNewReminder({
      ...newReminder,
      frequency: value,
      time_of_day: defaultTimes,
    });
  };

  const addTimeField = () => {
    if (
      newReminder.frequency === "daily" &&
      newReminder.time_of_day.length >= 1
    )
      return;
    if (
      newReminder.frequency === "twice-daily" &&
      newReminder.time_of_day.length >= 2
    )
      return;
    if (
      newReminder.frequency === "weekly" &&
      newReminder.time_of_day.length >= 1
    )
      return;

    setNewReminder({
      ...newReminder,
      time_of_day: [...newReminder.time_of_day, "12:00"],
    });
  };

  const removeTimeField = (index: number) => {
    const updatedTimes = [...newReminder.time_of_day];
    updatedTimes.splice(index, 1);
    setNewReminder({
      ...newReminder,
      time_of_day: updatedTimes,
    });
  };

  const updateTimeField = (index: number, value: string) => {
    const updatedTimes = [...newReminder.time_of_day];
    updatedTimes[index] = value;
    setNewReminder({
      ...newReminder,
      time_of_day: updatedTimes,
    });
  };

  const frequencyLabel = (frequency: Frequency): string => {
    switch (frequency) {
      case "daily":
        return "Daily";
      case "twice-daily":
        return "Twice Daily";
      case "weekly":
        return "Weekly";
      default:
        return frequency;
    }
  };

  const formatReminderDescription = (reminder: Reminder): string => {
    return reminder.time_of_day.join(", ");
  };

  if (!patientId) {
    return (
      <div className="text-center p-6 bg-white rounded-lg border border-border">
        <p className="text-muted-foreground">
          Please log in to manage reminders
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground">Reminders</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="bg-white hover:bg-secondary font-medium text-sm py-2 px-4 rounded-lg whitespace-nowrap gap-2 h-10 border border-border"
            >
              <Bell className="mr-2 h-4 w-4" />
              Set Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-white border border-border">
            <DialogHeader>
              <DialogTitle>Set Symptom Logging Reminder</DialogTitle>
              <DialogDescription>
                Configure when you&apos;d like to be reminded to log your
                symptoms.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="frequency" className="text-right">
                  Frequency
                </Label>
                <Select
                  value={newReminder.frequency}
                  onValueChange={(value: Frequency) =>
                    handleFrequencyChange(value)
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-border">
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="twice-daily">Twice Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newReminder.time_of_day.map((time, index) => (
                <div
                  className="grid grid-cols-4 items-center gap-4"
                  key={index}
                >
                  <Label htmlFor={`time-${index}`} className="text-right">
                    Time
                  </Label>
                  <div className="col-span-3 flex gap-2">
                    <Input
                      id={`time-${index}`}
                      type="time"
                      value={time}
                      onChange={(e) => updateTimeField(index, e.target.value)}
                      className="flex-1 w-[20%]"
                    />
                    {newReminder.time_of_day.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeTimeField(index)}
                        className="bg-white hover:bg-secondary border border-border rounded-lg"
                      >
                        <span className="sr-only">Remove time</span>✕
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {((newReminder.frequency === "twice-daily" &&
                newReminder.time_of_day.length < 2) ||
                (newReminder.frequency !== "twice-daily" &&
                  newReminder.time_of_day.length < 1)) && (
                <Button
                  type="button"
                  variant="outline"
                  className="col-span-4 ml-auto w-auto"
                  onClick={addTimeField}
                >
                  Add Time
                </Button>
              )}
            </div>
            <DialogFooter>
              <Button
                className="border border-border"
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleAddReminder}>
                Save Reminder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center items-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : reminders.length > 0 ? (
        <div className="space-y-3">
          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              className="flex items-center justify-between p-3 bg-white rounded-lg border border-border shadow-xs"
            >
              <div>
                <h3 className="font-medium">
                  {frequencyLabel(reminder.frequency)} Reminder
                </h3>
                <p className="text-sm text-muted-foreground">
                  {formatReminderDescription(reminder)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleToggleReminder(reminder.id)}
                  className={
                    reminder.enabled
                      ? "bg-primary text-accent-foreground hover:bg-primary/80 rounded-lg"
                      : "bg-white text-foreground hover:bg-secondary border border-border rounded-lg"
                  }
                >
                  {reminder.enabled ? "Enabled" : "Disabled"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteReminder(reminder.id)}
                  className="bg-white hover:bg-secondary border border-border rounded-lg"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-6 bg-white rounded-lg border border-border">
          <p className="text-muted-foreground">No reminders set</p>
          <p className="text-sm text-muted-foreground mt-1">
            Click &quot;Set Reminder&quot; to create your first reminder
          </p>
        </div>
      )}
    </div>
  );
}
