"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@core/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Activity,
  AlertCircle,
  ExternalLink,
  Copy,
  Search,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HealthCheck {
  name: string;
  category: "database" | "external" | "internal";
  status: "operational" | "degraded" | "error" | "unknown";
  responseTime: number | null;
  endpoint: string;
}

interface SystemLogData {
  id: string;
  created_at: string;
  action: string;
  user_name: string;
  user_email: string;
  details: string;
  queue_id: string | null;
  status: string;
}

interface PrescriptionData {
  id: string;
  queue_id: string;
  submitted_at: string;
  medication: string;
  dosage: string;
  status: string;
  patient: {
    first_name: string;
    last_name: string;
  } | null;
}

interface Issue {
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  action: string;
  api?: string;
  affectedCount?: number;
}

export default function APILogsPage() {
  const supabase = createClient();

  // Data states
  const [healthData, setHealthData] = useState<{
    success: boolean;
    overallStatus: string;
    summary?: { total: number; operational: number; degraded: number; error: number };
    healthChecks?: HealthCheck[];
  } | null>(null);
  const [systemLogs, setSystemLogs] = useState<SystemLogData[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionData[]>([]);
  const [stats, setStats] = useState({ today: 0, thisWeek: 0, allTime: 0 });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Accordion states
  const [issuesExpanded, setIssuesExpanded] = useState(true);
  const [apiStatusExpanded, setApiStatusExpanded] = useState(false);
  const [recentActivityExpanded, setRecentActivityExpanded] = useState(false);
  const [prescriptionsExpanded, setPrescriptionsExpanded] = useState(false);

  // Filter states
  const [logsSearch, setLogsSearch] = useState("");
  const [logsStatusFilter, setLogsStatusFilter] = useState("all");

  // Load all data
  const loadAllData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Load health data
      const healthResponse = await fetch("/api/admin/api-health");
      const healthJson = await healthResponse.json();
      if (healthJson.success) {
        setHealthData(healthJson);
      }

      // Load system logs (last 50)
      const { data: logsData } = await supabase
        .from("system_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (logsData) {
        setSystemLogs(logsData);
      }

      // Load prescriptions (last 20)
      const { data: rxData } = await supabase
        .from("prescriptions")
        .select(
          `
          id,
          queue_id,
          submitted_at,
          medication,
          dosage,
          status,
          patient:patients(first_name, last_name)
        `
        )
        .order("submitted_at", { ascending: false })
        .limit(20);

      if (rxData) {
        setPrescriptions(rxData as PrescriptionData[]);
      }

      // Calculate stats
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const { data: allRx } = await supabase
        .from("prescriptions")
        .select("submitted_at");

      if (allRx) {
        const todayCount = allRx.filter(
          (rx) => new Date(rx.submitted_at) >= today
        ).length;
        const weekCount = allRx.filter(
          (rx) => new Date(rx.submitted_at) >= weekAgo
        ).length;
        setStats({
          today: todayCount,
          thisWeek: weekCount,
          allTime: allRx.length,
        });
      }

      setLastRefresh(new Date());
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load system data");
    } finally {
      setIsRefreshing(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadAllData, 30000);
    return () => clearInterval(interval);
  }, [loadAllData]);

  // Identify issues from health data
  const identifyIssues = (): Issue[] => {
    const issues: Issue[] = [];

    if (!healthData?.healthChecks) return issues;

    // Check for critical errors
    const errorApis = healthData.healthChecks.filter((api) => api.status === "error");
    errorApis.forEach((api) => {
      issues.push({
        severity: "critical",
        title: `${api.name} is down`,
        description: `The ${api.name} API is not responding. This may prevent prescription submissions or status updates.`,
        action: api.category === "external"
          ? "Contact the service provider to verify their system status."
          : "Check your network connection and API credentials in settings.",
        api: api.name,
      });
    });

    // Check for degraded performance
    const degradedApis = healthData.healthChecks.filter((api) => api.status === "degraded");
    degradedApis.forEach((api) => {
      issues.push({
        severity: "warning",
        title: `${api.name} is slow`,
        description: `Response time: ${api.responseTime}ms. This may cause delays in prescription processing.`,
        action: "Monitor the situation. If it persists, contact support.",
        api: api.name,
      });
    });

    // Check for recent failures in logs
    const recentErrors = systemLogs.filter(
      (log) =>
        log.status === "error" &&
        new Date(log.created_at) > new Date(Date.now() - 60 * 60 * 1000)
    );

    if (recentErrors.length > 5) {
      issues.push({
        severity: "warning",
        title: `${recentErrors.length} errors in the last hour`,
        description: "Multiple operations have failed recently. This may indicate a systemic issue.",
        action: "Review the System Activity Logs below to identify patterns.",
        affectedCount: recentErrors.length,
      });
    }

    // Check for stuck prescriptions
    const stuckCount = prescriptions.filter(
      (rx) =>
        rx.status === "submitted" &&
        new Date(rx.submitted_at) < new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length;

    if (stuckCount > 0) {
      issues.push({
        severity: "warning",
        title: `${stuckCount} prescription(s) stuck in "submitted" status`,
        description: "These prescriptions have not progressed beyond submission for over 24 hours.",
        action: "Check the DigitalRX system or contact the pharmacy to verify they received the prescriptions.",
        affectedCount: stuckCount,
      });
    }

    // All systems operational
    if (issues.length === 0) {
      issues.push({
        severity: "info",
        title: "All systems operational",
        description: "All APIs are responding normally and no issues detected.",
        action: "No action needed. Continue monitoring.",
      });
    }

    return issues;
  };

  const issues = identifyIssues();

  // Filter logs
  const filteredLogs = systemLogs.filter((log) => {
    const matchesSearch =
      logsSearch === "" ||
      log.action.toLowerCase().includes(logsSearch.toLowerCase()) ||
      log.user_name?.toLowerCase().includes(logsSearch.toLowerCase()) ||
      log.details?.toLowerCase().includes(logsSearch.toLowerCase());

    const matchesStatus =
      logsStatusFilter === "all" || log.status === logsStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">System Health & Monitoring</h1>
          <div className="flex items-center gap-3">
            {lastRefresh && (
              <span className="text-sm text-gray-500">
                Last updated: {formatTimeAgo(lastRefresh.toISOString())}
              </span>
            )}
            <Button onClick={loadAllData} disabled={isRefreshing} size="sm">
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh All
            </Button>
          </div>
        </div>
        <p className="text-gray-600">
          Monitor system health, identify issues, and track prescription activity
        </p>
      </div>

      {/* Quick Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* System Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">System Status</span>
            {healthData?.overallStatus === "operational" ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : healthData?.overallStatus === "degraded" ? (
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
          </div>
          <div className="text-2xl font-bold capitalize">
            {healthData?.overallStatus || "Loading..."}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {healthData?.summary?.operational || 0}/{healthData?.summary?.total || 0}{" "}
            APIs online
          </div>
        </div>

        {/* Today's Prescriptions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Today</span>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold">{stats.today}</div>
          <div className="text-xs text-gray-500 mt-1">Prescriptions submitted</div>
        </div>

        {/* This Week */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">This Week</span>
            <Activity className="h-5 w-5 text-purple-600" />
          </div>
          <div className="text-2xl font-bold">{stats.thisWeek}</div>
          <div className="text-xs text-gray-500 mt-1">Prescriptions submitted</div>
        </div>

        {/* Active Issues */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Active Issues</span>
            <AlertCircle className="h-5 w-5 text-orange-600" />
          </div>
          <div className="text-2xl font-bold">
            {issues.filter((i) => i.severity !== "info").length}
          </div>
          <div className="text-xs text-gray-500 mt-1">Requiring attention</div>
        </div>
      </div>

      {/* Issues & Recommendations Section */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div
          onClick={() => setIssuesExpanded(!issuesExpanded)}
          className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            {issuesExpanded ? (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-500" />
            )}
            <h2 className="text-lg font-semibold">Issues & Recommendations</h2>
            <Badge variant="outline">
              {issues.filter((i) => i.severity !== "info").length} active
            </Badge>
          </div>
        </div>

        {issuesExpanded && (
          <div className="px-6 py-4 border-t border-gray-200 space-y-3">
            {issues.map((issue, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-l-4 ${
                  issue.severity === "critical"
                    ? "bg-red-50 border-red-500"
                    : issue.severity === "warning"
                      ? "bg-yellow-50 border-yellow-500"
                      : "bg-green-50 border-green-500"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {issue.severity === "critical" ? (
                      <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    ) : issue.severity === "warning" ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    )}
                    <div>
                      <h3 className="font-semibold text-sm">{issue.title}</h3>
                      {issue.api && (
                        <span className="text-xs text-gray-600">
                          Affected API: {issue.api}
                        </span>
                      )}
                    </div>
                  </div>
                  {issue.affectedCount && (
                    <Badge variant="outline">{issue.affectedCount} affected</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-700 mb-2">{issue.description}</p>
                <div className="bg-white rounded p-3 border border-gray-200">
                  <p className="text-xs font-medium text-gray-600 mb-1">
                    Recommended Action:
                  </p>
                  <p className="text-sm text-gray-900">{issue.action}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API Status Details */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div
          onClick={() => setApiStatusExpanded(!apiStatusExpanded)}
          className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            {apiStatusExpanded ? (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-500" />
            )}
            <h2 className="text-lg font-semibold">API Status Details</h2>
            <span className="text-sm text-gray-500">
              {healthData?.summary?.operational || 0}/{healthData?.summary?.total || 0}{" "}
              operational
            </span>
          </div>
        </div>

        {apiStatusExpanded && healthData?.healthChecks && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="space-y-3">
              {/* Group by category */}
              {(["database", "external", "internal"] as const).map((category) => {
                const apis = healthData.healthChecks!.filter(
                  (api) => api.category === category
                );
                if (apis.length === 0) return null;

                return (
                  <div key={category}>
                    <h3 className="text-sm font-medium text-gray-700 mb-2 capitalize">
                      {category} APIs
                    </h3>
                    <div className="space-y-2">
                      {apis.map((api, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-lg border border-gray-200 bg-gray-50"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              {api.status === "operational" ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : api.status === "degraded" ? (
                                <Clock className="h-4 w-4 text-yellow-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                              <span className="font-medium text-sm">{api.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {api.responseTime && (
                                <span
                                  className={`text-xs font-mono px-2 py-1 rounded ${
                                    api.responseTime < 500
                                      ? "bg-green-100 text-green-800"
                                      : api.responseTime < 1000
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {api.responseTime}ms
                                </span>
                              )}
                              <Badge
                                variant="outline"
                                className={
                                  api.status === "operational"
                                    ? "border-green-500 text-green-700"
                                    : api.status === "degraded"
                                      ? "border-yellow-500 text-yellow-700"
                                      : "border-red-500 text-red-700"
                                }
                              >
                                {api.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <ExternalLink className="h-3 w-3" />
                            <span className="font-mono truncate">{api.endpoint}</span>
                            <button
                              onClick={() => copyToClipboard(api.endpoint)}
                              className="ml-auto p-1 hover:bg-gray-200 rounded"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div
          onClick={() => setRecentActivityExpanded(!recentActivityExpanded)}
          className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            {recentActivityExpanded ? (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-500" />
            )}
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <span className="text-sm text-gray-500">
              Last {filteredLogs.length} events
            </span>
          </div>
        </div>

        {recentActivityExpanded && (
          <div className="px-6 py-4 border-t border-gray-200">
            {/* Filters */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by action, user, or details..."
                    value={logsSearch}
                    onChange={(e) => setLogsSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={logsStatusFilter} onValueChange={setLogsStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Logs Table */}
            <div className="space-y-2">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No activity logs found
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                            log.status === "success"
                              ? "bg-green-500"
                              : log.status === "error"
                                ? "bg-red-500"
                                : "bg-yellow-500"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {log.action}
                            </span>
                            <span className="text-xs text-gray-500">by {log.user_name}</span>
                          </div>
                          <p className="text-sm text-gray-600 truncate">{log.details}</p>
                          {log.queue_id && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">Queue ID:</span>
                              <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                                {log.queue_id}
                              </code>
                              <button
                                onClick={() => copyToClipboard(log.queue_id!)}
                                className="p-1 hover:bg-gray-200 rounded"
                              >
                                <Copy className="h-3 w-3 text-gray-400" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 ml-4 flex-shrink-0">
                        {formatTimeAgo(log.created_at)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Recent Prescriptions */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div
          onClick={() => setPrescriptionsExpanded(!prescriptionsExpanded)}
          className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            {prescriptionsExpanded ? (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-500" />
            )}
            <h2 className="text-lg font-semibold">Recent Prescriptions</h2>
            <span className="text-sm text-gray-500">Last {prescriptions.length}</span>
          </div>
        </div>

        {prescriptionsExpanded && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="space-y-2">
              {prescriptions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No prescriptions found
                </div>
              ) : (
                prescriptions.map((rx) => (
                  <div
                    key={rx.id}
                    className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-medium text-sm">
                            {rx.medication} {rx.dosage}
                          </span>
                          <Badge
                            variant="outline"
                            className={
                              rx.status === "delivered"
                                ? "border-green-500 text-green-700"
                                : rx.status === "shipped"
                                  ? "border-blue-500 text-blue-700"
                                  : rx.status === "processing" || rx.status === "approved"
                                    ? "border-purple-500 text-purple-700"
                                    : "border-gray-500 text-gray-700"
                            }
                          >
                            {rx.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-600">
                          Patient: {rx.patient?.first_name} {rx.patient?.last_name} •
                          Queue ID: {rx.queue_id}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 ml-4">
                        {formatTimeAgo(rx.submitted_at)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
