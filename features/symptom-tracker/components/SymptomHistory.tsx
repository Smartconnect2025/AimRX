"use client";

import jsPDF from "jspdf";
import { toast } from "sonner";
import { usePatient } from "../hooks";
import autoTable from "jspdf-autotable";
import { format, subDays } from "date-fns";
import { getSeverityColor } from "../utils";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Symptom, SymptomLog } from "../types";
import { Button } from "@/components/ui/button";
import { EditSymptomForm } from "./EditSymptomForm";
import { symptomService } from "../services/symptomService";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  Download,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { createClient } from "@/core/supabase/client";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";

type FilterPeriod = "all" | "7days" | "30days" | "custom";

export default function SymptomHistory() {
  const router = useRouter();
  const { patientId } = usePatient();
  const [logs, setLogs] = useState<SymptomLog[]>([]);
  const [allSymptoms, setAllSymptoms] = useState<Symptom[]>([]);
  const [expandedLogs, setExpandedLogs] = useState<string[]>([]);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("7days");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(
    subDays(new Date(), 7),
  );
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(
    new Date(),
  );
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<SymptomLog | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    if (!patientId) return;

    const fetchData = async () => {
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      const today = new Date();

      switch (filterPeriod) {
        case "7days":
          startDate = subDays(today, 7);
          break;
        case "30days":
          startDate = subDays(today, 30);
          break;
        case "custom":
          startDate = customStartDate;
          endDate = customEndDate;
          break;
      }

      const offset = (currentPage - 1) * pageSize;

      const symptoms = await symptomService.getRecentSymptoms({
        limit: pageSize,
        offset,
        patientId,
        startDate,
        endDate,
      });
      setLogs(symptoms);

      const symptomsData = await symptomService.getAllSymptoms();
      setAllSymptoms(symptomsData);

      const supabase = createClient();
      let countQuery = supabase
        .from("symptom_logs")
        .select("*", { count: "exact", head: true })
        .eq("patient_id", patientId);

      if (startDate)
        countQuery = countQuery.gte("created_at", startDate.toISOString());
      if (endDate)
        countQuery = countQuery.lte("created_at", endDate.toISOString());

      const { count } = await countQuery;
      setTotalLogs(count || 0);
    };

    fetchData();
  }, [patientId, filterPeriod, customStartDate, customEndDate, currentPage]);

  const toggleExpand = (logId: string) => {
    setExpandedLogs((prev) =>
      prev.includes(logId)
        ? prev.filter((id) => id !== logId)
        : [...prev, logId],
    );
  };

  const handleDeleteLog = async (logId: string) => {
    const success = await symptomService.deleteSymptom(logId, patientId);
    if (success) {
      setLogs((prev) => prev.filter((log) => log.id !== logId));
      toast.success("Symptom deleted successfully.");
    } else {
      toast.error("Failed to delete symptom. Please try again.");
    }
  };

  const handleEditLog = (log: SymptomLog) => {
    setEditingLog({ ...log, description: log.description || "" });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async (updatedLog: SymptomLog) => {
    const success = await symptomService.editSymptom(
      updatedLog.id,
      {
        severity: updatedLog.severity,
        description: updatedLog.description,
      },
      patientId,
    );
    if (success) {
      toast.success("Symptom updated successfully!");
      setLogs((prev) =>
        prev.map((log) => (log.id === updatedLog.id ? updatedLog : log)),
      );
    }
    setIsEditDialogOpen(false);
    setEditingLog(null);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Symptom Log Report", 14, 22);

    let dateRangeText = "";
    switch (filterPeriod) {
      case "all":
        dateRangeText = "All Time";
        break;
      case "7days":
        dateRangeText = "Last 7 Days";
        break;
      case "30days":
        dateRangeText = "Last 30 Days";
        break;
      case "custom":
        dateRangeText = `${format(customStartDate!, "MMM d, yyyy")} - ${format(
          customEndDate!,
          "MMM d, yyyy",
        )}`;
        break;
    }

    doc.setFontSize(11);
    doc.text(`Date Range: ${dateRangeText}`, 14, 30);
    doc.text(
      `Generated on: ${format(new Date(), "MMM d, yyyy h:mm a")}`,
      14,
      38,
    );

    const tableData = logs.map((log) => [
      format(new Date(log.created_at), "MMM d, yyyy h:mm a"),
      log.symptom?.name || "Unknown",
      `${log.severity}/10`,
      log.description || "No notes",
    ]);

    autoTable(doc, {
      head: [["Date/Time", "Symptom", "Severity", "Notes"]],
      body: tableData,
      startY: 45,
      styles: { fontSize: 10 },
    });

    doc.save(`symptom-log-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  return (
    <div className="min-h-screen bg-secondary flex justify-center">
      <div className="container px-4 py-4 sm:py-8 flex justify-center max-w-5xl">
        <div className="w-full">
          <div className="flex items-center mb-6">
            <Button
              className="hover:bg-transparent cursor-pointer"
              variant="ghost"
              size="sm"
              onClick={() => router.push("/symptom-tracker")}
            >
              <ChevronLeft className="h-4 w-4 mr-1 " />
              Back
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground ml-4">
              All Logged Symptoms
            </h1>
          </div>

          <Card className="bg-white rounded-lg shadow-sm border border-border mx-auto">
            <CardHeader className="pb-0">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <h2 className="text-xl font-semibold">Symptom History</h2>

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Select
                    value={filterPeriod}
                    onValueChange={(v) => setFilterPeriod(v as FilterPeriod)}
                  >
                    <SelectTrigger className="w-full sm:w-[180px] rounded-lg cursor-pointer">
                      <SelectValue placeholder="Select time period" />
                    </SelectTrigger>
                    <SelectContent className="border border-border rounded-lg">
                      <SelectItem value="all">All Symptoms</SelectItem>
                      <SelectItem value="7days">Last 7 days</SelectItem>
                      <SelectItem value="30days">Last 30 days</SelectItem>
                      <SelectItem value="custom">Custom range</SelectItem>
                    </SelectContent>
                  </Select>

                  {filterPeriod === "custom" && (
                    <Popover
                      open={datePickerOpen}
                      onOpenChange={setDatePickerOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full sm:w-auto bg-white border border-border hover:bg-secondary rounded-lg"
                        >
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          {customStartDate && customEndDate
                            ? `${format(customStartDate, "MMM d")} - ${format(
                                customEndDate,
                                "MMM d",
                              )}`
                            : "Select dates"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0 border border-border"
                        align="start"
                      >
                        <CalendarComponent
                          mode="range"
                          selected={{
                            from: customStartDate,
                            to: customEndDate,
                          }}
                          onSelect={(range) => {
                            if (range?.from) setCustomStartDate(range.from);
                            if (range?.to) {
                              setCustomEndDate(range.to);
                              setDatePickerOpen(false);
                            }
                          }}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  )}

                  <Button
                    onClick={exportToPDF}
                    variant="secondary"
                    className="rounded-lg"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              {logs.length === 0 ? (
                <div className="h-[200px] bg-secondary/50 rounded-lg flex items-center justify-center text-muted-foreground">
                  No symptoms found for the selected time period
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {logs.map((log) => {
                      const isExpanded = expandedLogs.includes(log.id);
                      return (
                        <Collapsible
                          key={log.id}
                          open={isExpanded}
                          onOpenChange={() => toggleExpand(log.id)}
                          className="rounded-lg border border-border p-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">
                                {log.symptom?.emoji || "📝"}
                              </span>
                              <div>
                                <h3 className="font-medium text-xl">
                                  {log.symptom?.name || "Unknown"}
                                </h3>

                                <p className="text-sm text-muted-foreground">
                                  {format(
                                    log.created_at,
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
                              <Dialog
                                open={
                                  isEditDialogOpen && editingLog?.id === log.id
                                }
                                onOpenChange={(open) =>
                                  !open && setEditingLog(null)
                                }
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditLog(log)}
                                    className="h-8 border border-border hover:bg-secondary rounded-lg"
                                  >
                                    <Edit2 className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px] p-0 border-none">
                                  <DialogTitle className="hidden"></DialogTitle>
                                  {editingLog && (
                                    <EditSymptomForm
                                      log={editingLog}
                                      onClose={() => setIsEditDialogOpen(false)}
                                      onSave={handleSaveEdit}
                                      allSymptoms={allSymptoms}
                                    />
                                  )}
                                </DialogContent>
                              </Dialog>

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
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-white border border-border hover:bg-secondary rounded-lg">
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteLog(log.id)}
                                      className="bg-destructive text-white hover:bg-destructive/90 rounded-lg"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                  </div>
                  {totalLogs > pageSize && (
                    <Pagination className="mt-6">
                      <PaginationContent className="flex items-center space-x-1">
                        <PaginationItem>
                          <Button
                            variant="outline"
                            size="sm"
                            aria-disabled={currentPage === 1}
                            onClick={() =>
                              currentPage !== 1 &&
                              setCurrentPage((p) => Math.max(1, p - 1))
                            }
                            className={`px-3 py-2 text-gray-700 border-border hover:bg-secondary cursor-pointer 
                              ${currentPage === 1 ? "opacity-50" : ""}`}
                          >
                            Previous
                          </Button>
                        </PaginationItem>

                        {Array.from({
                          length: Math.ceil(totalLogs / pageSize),
                        }).map((_, i) => (
                          <PaginationItem key={i}>
                            <Button
                              variant={
                                currentPage === i + 1 ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => setCurrentPage(i + 1)}
                              className={`px-3 py-2 cursor-pointer ${
                                currentPage === i + 1
                                  ? "bg-primary text-white hover:bg-primary/90"
                                  : "text-gray-700 border-border hover:bg-secondary"
                              }`}
                            >
                              {i + 1}
                            </Button>
                          </PaginationItem>
                        ))}

                        <PaginationItem>
                          <Button
                            variant="outline"
                            size="sm"
                            aria-disabled={
                              currentPage === Math.ceil(totalLogs / pageSize)
                            }
                            onClick={() => {
                              if (
                                currentPage !== Math.ceil(totalLogs / pageSize)
                              ) {
                                setCurrentPage((p) =>
                                  Math.min(
                                    Math.ceil(totalLogs / pageSize),
                                    p + 1,
                                  ),
                                );
                              }
                            }}
                            className={`px-3 py-2 text-gray-700 border-border hover:bg-secondary cursor-pointer 
                              ${currentPage === Math.ceil(totalLogs / pageSize) ? "opacity-50" : ""}`}
                          >
                            Next
                          </Button>
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
