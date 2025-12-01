"use client";

import { JunctionOrdersResponse } from "@/app/api/labs/junction/orders/route";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, subDays, subMonths, subYears } from "date-fns";
import { AlertCircle, Download, Eye, FileText, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { CBCChart } from "./components/charts/CBCChart";
import { HbA1cChart } from "./components/charts/HbA1cChart";
import { LipidPanelChart } from "./components/charts/LipidPanelChart";
import { MetabolicPanelChart } from "./components/charts/MetabolicPanelChart";
import { ThyroidChart } from "./components/charts/ThyroidChart";
import Navigation from "./components/Navigation";
import RecentResultsSection from "./components/RecentResultsSection";
import {
  JunctionLabData,
  JunctionResultsResponse,
  JunctionLabResultWithOrderInfo,
  JunctionLabResult,
} from "./services/junctionLabData";
import { convertJunctionToLabResult } from "./utils/panelMapping";

const getStatusColor = (status: string) => {
  switch (status) {
    case "critical":
      return "text-red-600 bg-red-50";
    case "abnormal":
      return "text-red-600 bg-red-50";
    case "normal":
      return "text-green-600 bg-green-50";
    default:
      return "text-muted-foreground bg-muted";
  }
};

const getOrderStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-50 text-green-700 border-green-200";
    case "sample_with_lab":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "collecting_sample":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "received":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "cancelled":
    case "failed":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

const formatBiomarkerValue = (biomarker: JunctionLabResult): string => {
  const value = biomarker.value || biomarker.result || "N/A";
  const unit = biomarker.unit || "";
  return `${value} ${unit}`;
};

const LabsHistoryView = () => {
  const [selectedResult, setSelectedResult] = useState<
    (JunctionResultsResponse & { order_id: string }) | null
  >(null);
  const [selectedChartPanel, setSelectedChartPanel] = useState<string>(
    "basic_metabolic_panel",
  );
  const [showResultModal, setShowResultModal] = useState(false);
  const [timeRange, setTimeRange] = useState<string>("all");
  const [labData, setLabData] = useState<JunctionLabData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allOrders, setAllOrders] = useState<JunctionOrdersResponse["orders"]>(
    [],
  );

  // Fetch lab data from API
  const fetchLabData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // First, fetch order IDs from Junction API
      const ordersResponse = await fetch("/api/labs/junction/orders");

      if (!ordersResponse.ok) {
        if (ordersResponse.status === 401) {
          throw new Error("Please log in to view your lab results");
        } else {
          throw new Error(
            `Failed to fetch lab orders: ${ordersResponse.statusText}`,
          );
        }
      }

      const ordersData: JunctionOrdersResponse = await ordersResponse.json();
      setAllOrders(ordersData.orders);

      // Filter only completed orders for fetching results
      const completedOrders = ordersData.orders.filter(
        (order) => order.status === "completed",
      );
      const completedOrderIds = completedOrders.map((order) => order.id);

      // If no completed orders found, set empty lab data
      if (completedOrderIds.length === 0) {
        setLabData({
          user_id: "",
          lab_results: [],
        });
        return;
      }

      // Fetch lab results using only completed order IDs
      const orderIdsParam = completedOrderIds.join(",");
      const response = await fetch(
        `/api/labs/junction/results?order_ids=${orderIdsParam}`,
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Please log in to view your lab results");
        }
        throw new Error(`Failed to fetch lab results: ${response.statusText}`);
      }

      const data: JunctionLabData = await response.json();
      setLabData(data);
    } catch (err) {
      console.error("Error fetching lab data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load lab results",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLabData();
  }, []);

  // Filter lab results based on selected time range
  const computeCutoffDate = (timeRange: string): Date => {
    const now = new Date();
    switch (timeRange) {
      case "30d":
        return subDays(now, 30);
      case "3m":
        return subMonths(now, 3);
      case "6m":
        return subMonths(now, 6);
      case "1y":
        return subYears(now, 1);
      default:
        return new Date(0); // No cutoff for 'all'
    }
  };

  const cutoffDate = computeCutoffDate(timeRange);
  const filteredLabResults =
    labData?.lab_results.filter(
      (result) =>
        new Date(
          result.metadata.date_reported ||
            result.metadata.date_collected ||
            Date.now(),
        ) >= cutoffDate,
    ) ?? [];

  // Get most recent results for prominent display
  const mostRecentResult =
    filteredLabResults[0] ||
    (labData?.lab_results && labData.lab_results.length > 0
      ? labData.lab_results[0]
      : null);

  // Combine orders with their results (if available)
  const allOrdersWithResults = allOrders.map((order) => {
    const matchingResult = filteredLabResults.find(
      (result) => result.order_id === order.id,
    );
    return {
      order_id: order.id,
      status: order.status,
      created_at: order.created_at,
      updated_at: order.updated_at,
      order_date: order.created_at,
      lab_location: matchingResult?.metadata.laboratory || "Junction Health",
      hasResults: order.status === "completed" && !!matchingResult,
      result: matchingResult,
    };
  });

  // Get key metrics from most recent result
  // const getKeyMetrics = (result: LabResult) => {
  //   const metrics = (
  //     Object.values(result.panels).flatMap(panel =>
  //       Object.entries(panel.results).map(([key, biomarker]) => ({
  //         name: key.replace(/_/g, ' ').toUpperCase(),
  //         value: biomarker.value,
  //         unit: biomarker.unit,
  //         status: biomarker.status,
  //         reference_range: biomarker.reference_range
  //       }))
  //     )
  //   )

  //   Object.values(result.panels).forEach(panel => {
  //     Object.entries(panel.results).forEach(([key, biomarker]) => {
  //       if (['glucose', 'total_cholesterol', 'hemoglobin', 'creatinine'].includes(key)) {
  //         metrics.push({
  //           name: key.replace(/_/g, ' ').toUpperCase(),
  //           value: biomarker.value,
  //           unit: biomarker.unit,
  //           status: biomarker.status,
  //           reference_range: biomarker.reference_range
  //         });
  //       }
  //     });
  //   });
  //   return metrics.slice(0, 4); // Show top 4 key metrics
  // };

  const handleViewResult = (result: JunctionLabResultWithOrderInfo) => {
    // Convert single result to the expected format
    const convertedResult = {
      ...result,
      results: [result], // Wrap single result in array
    } as JunctionResultsResponse & { order_id: string };
    setSelectedResult(convertedResult);
    setShowResultModal(true);
  };

  const handleDownloadPDF = async (orderId: string) => {
    try {
      const response = await fetch(`/api/labs/junction/pdf/${orderId}`);

      if (!response.ok) {
        throw new Error(`Failed to download PDF: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lab-result-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      // You could show a toast notification here
    }
  };

  // const handleShareResult = (result: LabResult) => {
  //   setSelectedResult(result);
  //   setShowShareModal(true);
  // };

  // const handleBiomarkerInfo = (biomarker: any) => {
  //   setSelectedBiomarker(biomarker);
  //   setShowEducationalModal(true);
  // };

  // const handleResultSelection = (resultId: string) => {
  //   setSelectedResultId(resultId);
  // };

  // const getSelectedResultDetails = () => {
  //   if (!selectedResultId) return null;
  //   return organizedResults.find(result => result.result_id === selectedResultId);
  // };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
  };

  const formatSelectDate = (dateString?: string) => {
    if (!dateString) {
      return "–";
    }
    return format(new Date(dateString), "MMM d, yyyy");
  };

  // const handleExportChart = (format: 'png' | 'csv') => {
  //   console.log(`Exporting ${selectedChartPanel} chart as ${format}`);
  // };

  const handleChartPanelChange = (panelId: string) => {
    setSelectedChartPanel(panelId);
  };

  const renderSelectedChart = () => {
    // Convert Junction format to LabResult format for chart compatibility

    const chartData = filteredLabResults.map(convertJunctionToLabResult);
    switch (selectedChartPanel) {
      case "basic_metabolic_panel":
        return <MetabolicPanelChart data={chartData} />;
      case "lipid_panel":
        return <LipidPanelChart data={chartData} />;
      case "complete_blood_count":
        return <CBCChart data={chartData} />;
      case "thyroid_function":
        return <ThyroidChart data={chartData} />;
      case "hba1c":
        return <HbA1cChart data={chartData} />;
      default:
        return <MetabolicPanelChart data={chartData} />;
    }
  };

  const CHART_PANELS = [
    {
      id: "basic_metabolic_panel",
      name: "BMP",
      fullName: "Basic Metabolic Panel",
      description: "Glucose, Creatinine, ALT",
    },
    {
      id: "lipid_panel",
      name: "Lipid",
      fullName: "Lipid Panel",
      description: "Cholesterol, Triglycerides",
    },
    {
      id: "complete_blood_count",
      name: "CBC",
      fullName: "Complete Blood Count",
      description: "Blood cells, Hemoglobin",
    },
    {
      id: "thyroid_function",
      name: "Thyroid",
      fullName: "Thyroid Function",
      description: "TSH, T3, T4",
    },
    {
      id: "hba1c",
      name: "HbA1c",
      fullName: "HbA1c",
      description: "Diabetes Management",
    },
  ];

  const TIME_RANGES = [
    { value: "30d", label: "Last 30 Days" },
    { value: "3m", label: "Last 3 Months" },
    { value: "6m", label: "Last 6 Months" },
    { value: "1y", label: "Last Year" },
    { value: "all", label: "All Time" },
  ];

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="bg-muted min-h-[calc(100vh-80px)] p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-left">Labs</h1>
            </div>
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading lab results...</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="bg-muted min-h-[calc(100vh-80px)] p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-left">Labs</h1>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={fetchLabData} className="mt-4">
              Try Again
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Show empty state
  if (!labData || allOrders.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="bg-muted min-h-[calc(100vh-80px)] p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-left">Labs</h1>
            </div>
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">
                No lab results found.
              </p>
              <Button onClick={fetchLabData}>Refresh</Button>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="bg-muted min-h-[calc(100vh-80px)] p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Page Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-left">Labs</h1>
          </div>

          {/* Most Recent Results - Prominent Display */}
          {mostRecentResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">
                  Health Overview
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadPDF(mostRecentResult.order_id)}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export PDF
                </Button>
              </div>
              <RecentResultsSection
                title=""
                showViewButton={false}
                showSubtitle={false}
                variant="labs"
                labResults={filteredLabResults.map(convertJunctionToLabResult)}
              />
              {/* <div className="text-center p-4 bg-muted/20 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Recent results from {mostRecentResult.metadata.laboratory}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(
                    new Date(mostRecentResult.metadata.date_reported),
                    "MMM d, yyyy",
                  )}
                </p>
              </div> */}
            </div>
          )}

          {/* Lab Chart Tabs and Display */}
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-xl font-semibold">
                  Lab Trends & Analytics
                </h2>

                {/* Time Range Filter */}
                <div className="flex items-center gap-2">
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Select time range" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_RANGES.map((range) => (
                        <SelectItem key={range.value} value={range.value}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Tabs
                value={selectedChartPanel}
                onValueChange={handleChartPanelChange}
                className="w-full"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <TabsList className="flex w-full sm:w-auto gap-2 bg-transparent p-0 h-auto">
                    {CHART_PANELS.map((panel) => (
                      <TabsTrigger
                        key={panel.id}
                        value={panel.id}
                        className="rounded-full px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-200 bg-white border border-border text-black hover:bg-gray-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary"
                      >
                        {panel.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {/* Tab Content with Animation */}
                {CHART_PANELS.map((panel) => (
                  <TabsContent
                    key={panel.id}
                    value={panel.id}
                    className="mt-4 animate-in fade-in-0 slide-in-from-top-1 duration-300"
                  >
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold">
                        {panel.fullName}
                      </h3>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">
                          {panel.description}
                        </p>
                        {timeRange !== "all" && (
                          <Badge variant="outline" className="text-xs">
                            {
                              TIME_RANGES.find((r) => r.value === timeRange)
                                ?.label
                            }
                          </Badge>
                        )}
                      </div>
                    </div>
                    {renderSelectedChart()}
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>

          {/* Historical Lab Results Table */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Lab Orders</h2>

            <Card className="border-0 rounded-2xl">
              <CardContent className="pt-6">
                {/* Desktop/Tablet Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                          Order ID
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                          Order Date
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                          Lab Location
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {allOrdersWithResults.reverse().map((orderWithResult) => (
                        <tr
                          key={orderWithResult.order_id}
                          className="border-b last:border-b-0 hover:bg-muted/30"
                        >
                          <td className="py-3 px-4 font-medium">
                            {orderWithResult.order_id}
                          </td>
                          <td className="py-3 px-4">
                            {formatSelectDate(orderWithResult.order_date)}
                          </td>
                          <td className="py-3 px-4">
                            {orderWithResult.lab_location}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant="outline"
                              className={`capitalize ${getOrderStatusColor(orderWithResult.status)}`}
                            >
                              {orderWithResult.status.replace(/_/g, " ")}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  orderWithResult.result &&
                                  handleViewResult(orderWithResult.result)
                                }
                                disabled={!orderWithResult.hasResults}
                                className="flex items-center gap-1 h-7 px-2 text-xs"
                              >
                                <Eye className="h-3 w-3" />
                                View Details
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleDownloadPDF(orderWithResult.order_id)
                                }
                                disabled={!orderWithResult.hasResults}
                                className="flex items-center gap-1 h-7 px-2 text-xs"
                              >
                                <FileText className="h-3 w-3" />
                                PDF
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {allOrdersWithResults.reverse().map((orderWithResult) => (
                    <div
                      key={orderWithResult.order_id}
                      className="p-4 border rounded-lg space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">
                          #{orderWithResult.order_id}
                        </div>
                        <Badge
                          variant="outline"
                          className={`capitalize ${getOrderStatusColor(orderWithResult.status)}`}
                        >
                          {orderWithResult.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">
                          Date
                        </div>
                        <div className="text-sm">
                          {formatSelectDate(orderWithResult.order_date)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">
                          Lab Location
                        </div>
                        <div className="text-sm">
                          {orderWithResult.lab_location}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            orderWithResult.result &&
                            handleViewResult(orderWithResult.result)
                          }
                          disabled={!orderWithResult.hasResults}
                          className="flex-1 flex items-center justify-center gap-1 text-xs"
                        >
                          <Eye className="h-3 w-3" />
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDownloadPDF(orderWithResult.order_id)
                          }
                          disabled={!orderWithResult.hasResults}
                          className="flex items-center gap-1 text-xs"
                        >
                          <FileText className="h-3 w-3" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Result Details Modal */}
          <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
            <DialogContent className="w-[95vw] max-w-4xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col p-0">
              <DialogHeader className="px-4 py-4 border-b">
                <DialogTitle>Lab Result Details</DialogTitle>
                <DialogDescription>
                  Comprehensive view of your lab results
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {selectedResult && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Test Date</p>
                        <p className="text-muted-foreground">
                          {formatDate(
                            selectedResult.metadata?.date_reported ||
                              selectedResult.metadata?.date_collected ||
                              new Date().toISOString(),
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Lab Location</p>
                        <p className="text-muted-foreground">
                          {selectedResult.metadata?.laboratory || "Unknown Lab"}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Order ID</p>
                        <p className="text-muted-foreground">
                          {selectedResult.order_id}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Status</p>
                        <Badge variant="outline" className="capitalize">
                          {selectedResult.metadata?.status || "Unknown"}
                        </Badge>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-lg">Lab Results</h4>
                        <div className="space-y-2">
                          {selectedResult.results.map(
                            (biomarker: JunctionLabResult, index: number) => (
                              <div
                                key={index}
                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-0 rounded-2xl bg-muted/30 gap-3"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm sm:text-base truncate">
                                      {biomarker.name ||
                                        biomarker.biomarker?.name ||
                                        "Unknown Test"}
                                    </span>
                                  </div>
                                  <p className="text-xs sm:text-sm text-muted-foreground">
                                    Reference:{" "}
                                    {biomarker.min_range_value || "N/A"}-
                                    {biomarker.max_range_value || "N/A"}{" "}
                                    {biomarker.unit || ""}
                                  </p>
                                </div>
                                <div className="text-left sm:text-right flex-shrink-0">
                                  <p className="text-lg font-bold">
                                    {formatBiomarkerValue(biomarker)}
                                  </p>
                                  {biomarker.interpretation && (
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${getStatusColor(biomarker.interpretation)}`}
                                    >
                                      {biomarker.interpretation.toUpperCase()}
                                    </Badge>
                                  )}
                                  {/* Notes are not available in JunctionLabResult */}
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter className="px-4 py-4 border-t">
                <Button onClick={() => setShowResultModal(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Share Modal */}
          {/* Share functionality would be implemented here */}
          {/* <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share Lab Results</DialogTitle>
                <DialogDescription>
                  Share your lab results with healthcare providers
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Your lab results will be shared securely with the selected healthcare provider.
                  </AlertDescription>
                </Alert>
                <p className="text-sm text-muted-foreground">
                  Share functionality would integrate with healthcare provider systems or secure email.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowShareModal(false)}>Cancel</Button>
                <Button>Share Results</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog> */}

          {/* Educational Content Modal */}
          {/* <Dialog open={showEducationalModal} onOpenChange={setShowEducationalModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Understanding Your Lab Values</DialogTitle>
                <DialogDescription>
                  Learn about {selectedBiomarker?.name}
                </DialogDescription>
              </DialogHeader>
              {selectedBiomarker && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">What is {selectedBiomarker.name}?</h4>
                    <p className="text-sm text-muted-foreground">
                      {
                        "Educational content about this biomarker would be displayed here,"
                        + "explaining what it measures, why it's important, and what the values mean."
                      }
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Your Result</h4>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedBiomarker.status)}
                      <span className="font-bold">{selectedBiomarker.value} {selectedBiomarker.unit}</span>
                      <Badge variant="outline" className={`text-xs ${getStatusColor(selectedBiomarker.status)}`}>
                        {selectedBiomarker.status.replace(/_/g, ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Reference Range: {selectedBiomarker.reference_range}
                    </p>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button onClick={() => setShowEducationalModal(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog> */}
        </div>
      </main>
    </div>
  );
};

export default LabsHistoryView;
