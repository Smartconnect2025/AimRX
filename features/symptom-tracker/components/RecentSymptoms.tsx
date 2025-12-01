"use client";

import { useState } from "react";
import { format } from "date-fns";
import { getSeverityColor } from "../utils";
import { useRouter } from "next/navigation";
import { Symptom, SymptomLog } from "../types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EditSymptomForm } from "./EditSymptomForm";
import { Edit2, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

interface RecentSymptomsProps {
  logs?: SymptomLog[];
  isLoading?: boolean;
  onEdit?: (log: SymptomLog) => void;
  onDelete?: (logId: string) => void;
  allSymptoms: Symptom[];
}

const isWithin24Hours = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return diff < 24 * 60 * 60 * 1000;
};

export const RecentSymptoms = ({
  logs = [],
  isLoading = false,
  onEdit,
  onDelete,
  allSymptoms,
}: RecentSymptomsProps) => {
  const [expandedLogs, setExpandedLogs] = useState<string[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editLog, setEditLog] = useState<SymptomLog | null>(null);

  const openEditModal = (log: SymptomLog) => {
    setEditLog(log);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditLog(null);
  };

  const toggleExpand = (logId: string) => {
    setExpandedLogs((prev) =>
      prev.includes(logId)
        ? prev.filter((id) => id !== logId)
        : [...prev, logId],
    );
  };

  const router = useRouter();
  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg border border-border shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Symptoms</h2>
          <Button variant="link" disabled>
            View All
          </Button>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg border border-border shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Symptoms</h2>
          <Button
            variant="link"
            onClick={() => router.push("/symptom-tracker/history")}
          >
            View All
          </Button>
        </div>
        <div className="h-[200px] bg-secondary/50 rounded-lg flex items-center justify-center text-muted-foreground">
          No symptoms logged yet
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg border border-border shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Recent Symptoms</h2>
        <Button
          variant="link"
          onClick={() => router.push("/symptom-tracker/history")}
        >
          View All
        </Button>
      </div>
      <div className="space-y-3">
        {logs.slice(0, 5).map((log) => {
          const isExpanded = expandedLogs.includes(log.id);
          const isRecent = isWithin24Hours(new Date(log.created_at));
          return (
            <Collapsible
              key={log.id}
              open={isExpanded}
              onOpenChange={() => toggleExpand(log.id)}
              className={`rounded-lg border p-3 ${
                isRecent ? "border-primary" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="text-xl"
                    role="img"
                    aria-label={log.symptom?.name || "Symptom emoji"}
                  >
                    {log.symptom?.emoji || "📝"}
                  </span>
                  <div>
                    <h3 className="font-medium text-xl">
                      {log.symptom?.name || "Unknown Symptom"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {format(
                        new Date(log.created_at),
                        "MMM d, yyyy 'at' h:mm a",
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      getSeverityColor(log.severity).value
                    } ${getSeverityColor(log.severity).bg}`}
                  >
                    {log.severity}/10
                  </span>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-secondary"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </div>
              <CollapsibleContent className="pt-3">
                {log.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {log.description}
                  </p>
                )}
                <div className="flex justify-end gap-2">
                  {onEdit && (
                    <Dialog
                      open={editModalOpen && editLog?.id === log.id}
                      onOpenChange={(open) => {
                        if (!open) closeEditModal();
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(log)}
                          className="h-8 border border-border hover:bg-secondary rounded-lg"
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px] p-0 border-none">
                        <DialogTitle className="hidden"></DialogTitle>
                        {editLog && (
                          <EditSymptomForm
                            log={editLog}
                            onClose={closeEditModal}
                            onSave={(updatedLog) => {
                              onEdit?.(updatedLog);
                              closeEditModal();
                            }}
                            allSymptoms={allSymptoms}
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                  )}
                  {onDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-destructive border border-border hover:bg-secondary hover:text-destructive rounded-lg"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white border border-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete symptom log?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete this symptom log.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border border-border hover:bg-secondary rounded-lg">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(log.id)}
                            className="bg-destructive text-white hover:bg-destructive/90 rounded-lg"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
};
