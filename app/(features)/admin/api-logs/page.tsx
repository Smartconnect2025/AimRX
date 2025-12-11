"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@core/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ChevronDown, ChevronRight, Copy, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  prescriber: {
    email: string;
  } | null;
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

interface HealthCheck {
  name: string;
  category: "database" | "external" | "internal";
  status: "operational" | "degraded" | "error" | "unknown";
  responseTime: number | null;
  endpoint: string;
}

export default function APILogsPage() {
  const supabase = createClient();

  // Accordion states
  const [apiDetailsExpanded, setApiDetailsExpanded] = useState(false);
  const [systemLogsExpanded, setSystemLogsExpanded] = useState(false);
  const [recentPrescriptionsExpanded, setRecentPrescriptionsExpanded] = useState(false);

  // API Details tab state
  const [activeApiTab, setActiveApiTab] = useState<"database" | "external" | "internal">("database");

  // Data states
  const [healthData, setHealthData] = useState<{
    success: boolean;
    overallStatus: string;
    summary?: { total: number; operational: number; degraded: number; error: number };
    healthChecks?: HealthCheck[];
  } | null>(null);
  const [prescriptions, setPrescriptions] = useState<PrescriptionData[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLogData[]>([]);
  const [stats, setStats] = useState({ today: 0, thisWeek: 0, allTime: 0 });
  const [isRefreshing, setIsRefreshing] = useState<Record<string, boolean>>({});

  // Filter states
  const [logsSearch, setLogsSearch] = useState("");
  const [logsStatusFilter, setLogsStatusFilter] = useState("all");
  const [logsActionFilter, setLogsActionFilter] = useState("all");
  const [prescriptionsSearch, setPrescriptionsSearch] = useState("");
  const [prescriptionsStatusFilter, setPrescriptionsStatusFilter] = useState("all");

  // Load health data
  const loadHealthData = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/api-health");
      const data = await response.json();
      if (data.success) {
        setHealthData(data);
      }
    } catch (error) {
      console.error("Error loading health data:", error);
    }
  }, []);

  // Load prescriptions
  const loadPrescriptions = useCallback(async () => {
    try {
      const { data: rxData, error } = await supabase
        .from("prescriptions")
        .select(`id, queue_id, submitted_at, medication, dosage, status, prescriber_id, patient:patients(first_name, last_name)`)
        .order("submitted_at", { ascending: false })
        .limit(10);

      if (!error && rxData) {
        const formattedData = rxData.map((rx) => ({
          ...rx,
          patient: Array.isArray(rx.patient) ? rx.patient[0] : rx.patient,
          prescriber: { email: rx.prescriber_id },
        }));
        setPrescriptions(formattedData as unknown as PrescriptionData[]);
      }
    } catch (error) {
      console.error("Error loading prescriptions:", error);
    }
  }, [supabase]);

  // Load system logs
  const loadSystemLogs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("system_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!error && data) {
        setSystemLogs(data as SystemLogData[]);
      }
    } catch (error) {
      console.error("Error loading system logs:", error);
    }
  }, [supabase]);

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const { count: allTimeCount } = await supabase
        .from("prescriptions")
        .select("*", { count: "exact", head: true });

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const { count: todayCount } = await supabase
        .from("prescriptions")
        .select("*", { count: "exact", head: true })
        .gte("submitted_at", today.toISOString());

      const { count: weekCount } = await supabase
        .from("prescriptions")
        .select("*", { count: "exact", head: true })
        .gte("submitted_at", weekAgo.toISOString());

      setStats({
        today: todayCount || 0,
        thisWeek: weekCount || 0,
        allTime: allTimeCount || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }, [supabase]);

  useEffect(() => {
    loadHealthData();
    loadPrescriptions();
    loadSystemLogs();
    loadStats();
  }, [loadHealthData, loadPrescriptions, loadSystemLogs, loadStats]);

  const handleRefreshSystemStatus = async () => {
    setIsRefreshing(prev => ({ ...prev, 'System Status': true }));
    await Promise.all([loadHealthData(), loadStats()]);
    toast.success('System Status refreshed');
    setIsRefreshing(prev => ({ ...prev, 'System Status': false }));
  };

  const handleRefresh = async (section: string, loader: () => Promise<void>) => {
    setIsRefreshing(prev => ({ ...prev, [section]: true }));
    await loader();
    toast.success(`${section} refreshed`);
    setIsRefreshing(prev => ({ ...prev, [section]: false }));
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "operational": return "bg-green-100 text-green-800 border-green-200";
      case "degraded": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "error": return "bg-red-100 text-red-800 border-red-200";
      case "success": return "bg-green-100 text-green-800 border-green-200";
      case "warning": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Relative time formatter
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // Truncate ID helper
  const truncateId = (id: string) => id.substring(0, 8);

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  // Action type icon
  const getActionIcon = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes("sync")) return "🔄";
    if (actionLower.includes("create") || actionLower.includes("update") || actionLower.includes("edit")) return "✏️";
    if (actionLower.includes("delete") || actionLower.includes("remove")) return "🗑️";
    if (actionLower.includes("user") || actionLower.includes("login") || actionLower.includes("logout")) return "👤";
    return "⚙️";
  };

  // Filter logs
  const filteredLogs = systemLogs.filter(log => {
    const matchesSearch = logsSearch === "" ||
      log.action.toLowerCase().includes(logsSearch.toLowerCase()) ||
      log.user_name?.toLowerCase().includes(logsSearch.toLowerCase()) ||
      log.user_email?.toLowerCase().includes(logsSearch.toLowerCase()) ||
      log.details?.toLowerCase().includes(logsSearch.toLowerCase());

    const matchesStatus = logsStatusFilter === "all" || log.status.toLowerCase() === logsStatusFilter;
    const matchesAction = logsActionFilter === "all" || log.action.toLowerCase().includes(logsActionFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesAction;
  });

  // Filter prescriptions
  const filteredPrescriptions = prescriptions.filter(rx => {
    const matchesSearch = prescriptionsSearch === "" ||
      rx.medication.toLowerCase().includes(prescriptionsSearch.toLowerCase()) ||
      rx.patient?.first_name?.toLowerCase().includes(prescriptionsSearch.toLowerCase()) ||
      rx.patient?.last_name?.toLowerCase().includes(prescriptionsSearch.toLowerCase()) ||
      rx.prescriber?.email?.toLowerCase().includes(prescriptionsSearch.toLowerCase());

    const matchesStatus = prescriptionsStatusFilter === "all" || rx.status.toLowerCase() === prescriptionsStatusFilter;

    return matchesSearch && matchesStatus;
  });

  // Count errors by category
  const getErrorCountByCategory = (category: string) => {
    if (!healthData?.healthChecks) return 0;
    return healthData.healthChecks.filter(
      (api: HealthCheck) => api.category === category && (api.status === "error" || api.status === "degraded")
    ).length;
  };

  const AccordionSection = ({
    title,
    isExpanded,
    onToggle,
    children,
    summary,
    onRefresh
  }: {
    title: string;
    isExpanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    summary?: string;
    onRefresh?: () => void;
  }) => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-500" />
          )}
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {summary && !isExpanded && (
            <span className="text-sm text-gray-500 ml-2">{summary}</span>
          )}
        </div>
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRefresh();
            }}
            disabled={isRefreshing[title]}
            className="ml-auto mr-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing[title] ? "animate-spin" : ""}`} />
          </Button>
        )}
      </button>
      {isExpanded && (
        <div className="px-6 py-4 border-t border-gray-200 animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">API & Logs</h1>
      </div>

      {/* System Status Summary - Always Visible */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">System Status Summary</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshSystemStatus}
            disabled={isRefreshing['System Status']}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing['System Status'] ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <div className="px-6 py-4">
          {healthData && (
            <div className="space-y-6">
              {/* API Status Pills */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">API Health</h3>
                <div className="flex gap-3 flex-wrap">
                  <div className="px-4 py-2 rounded-full bg-gray-100 text-sm font-medium">
                    Total APIs: {healthData.summary?.total || 0}
                  </div>
                  <div className="px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                    Operational: {healthData.summary?.operational || 0}
                  </div>
                  <div className="px-4 py-2 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium">
                    Degraded: {healthData.summary?.degraded || 0}
                  </div>
                  <div className="px-4 py-2 rounded-full bg-red-100 text-red-800 text-sm font-medium">
                    Errors: {healthData.summary?.error || 0}
                  </div>
                </div>
              </div>

              {/* Overall System Health */}
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Overall System Health</span>
                  <Badge className={getStatusColor(healthData.overallStatus)}>
                    {healthData.overallStatus?.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* Prescription Stats */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Prescription Statistics</h3>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center p-4 rounded-lg border border-gray-200">
                    <div className="text-3xl font-bold text-gray-900">{stats.today}</div>
                    <div className="text-sm text-gray-500 mt-1">Today</div>
                  </div>
                  <div className="text-center p-4 rounded-lg border border-gray-200">
                    <div className="text-3xl font-bold text-gray-900">{stats.thisWeek}</div>
                    <div className="text-sm text-gray-500 mt-1">This Week</div>
                  </div>
                  <div className="text-center p-4 rounded-lg border border-gray-200">
                    <div className="text-3xl font-bold text-gray-900">{stats.allTime}</div>
                    <div className="text-sm text-gray-500 mt-1">All Time</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* API Status Details */}
      <AccordionSection
        title="API Status Details"
        isExpanded={apiDetailsExpanded}
        onToggle={() => setApiDetailsExpanded(!apiDetailsExpanded)}
        summary={healthData ? `${healthData.summary?.operational || 0}/${healthData.summary?.total || 0} Operational` : ""}
        onRefresh={() => handleRefresh("API Details", loadHealthData)}
      >
        {healthData?.healthChecks && (
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
              {(["database", "external", "internal"] as const).map((category) => {
                const errorCount = getErrorCountByCategory(category);

                return (
                  <button
                    key={category}
                    onClick={() => setActiveApiTab(category)}
                    className={`px-4 py-2 text-sm font-medium transition-all duration-200 border-b-2 ${
                      activeApiTab === category
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                    }`}
                  >
                    <span className="capitalize">{category}</span>
                    {errorCount > 0 && (
                      <span className="ml-2 text-red-600">🔴{errorCount}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="space-y-2">
              {healthData.healthChecks
                .filter((api: HealthCheck) => api.category === activeApiTab)
                .map((api: HealthCheck, idx: number) => (
                  <div key={idx} className="p-4 rounded-lg border border-gray-200 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{api.name}</p>
                      <p className="text-xs text-gray-500 font-mono mt-1">{api.endpoint}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {api.responseTime && (
                        <span className="text-xs text-gray-500">{api.responseTime}ms</span>
                      )}
                      <Badge variant="outline" className={getStatusColor(api.status)}>
                        {api.status}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </AccordionSection>

      {/* System Activity Logs */}
      <AccordionSection
        title="System Activity Logs"
        isExpanded={systemLogsExpanded}
        onToggle={() => setSystemLogsExpanded(!systemLogsExpanded)}
        summary={`${filteredLogs.length} entries`}
        onRefresh={() => handleRefresh("System Logs", loadSystemLogs)}
      >
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search logs..."
                  value={logsSearch}
                  onChange={(e) => setLogsSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={logsStatusFilter} onValueChange={setLogsStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
              </SelectContent>
            </Select>
            <Select value={logsActionFilter} onValueChange={setLogsActionFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="sync">Sync</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-gray-200 rounded-lg min-h-[400px]">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 w-[120px]">Time</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 w-[110px]">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 w-[200px]">Action</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 w-[180px]">User</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Details</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 w-[110px]">ID</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500">
                      No logs match your filters
                    </td>
                  </tr>
                ) : (
                  filteredLogs.slice(0, 20).map((log, index) => (
                    <tr
                      key={log.id}
                      className={`group hover:bg-blue-50 transition-colors border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                    >
                      <td className="py-3 px-4 text-gray-900" title={new Date(log.created_at).toLocaleString()}>
                        {getRelativeTime(log.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className={getStatusColor(log.status)}>
                          {log.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-900 font-medium">
                        <span className="mr-2">{getActionIcon(log.action)}</span>
                        {log.action}
                      </td>
                      <td className="py-3 px-4 text-gray-600 truncate max-w-[180px]" title={log.user_email}>
                        {log.user_name || log.user_email}
                      </td>
                      <td className="py-3 px-4 text-gray-900 truncate max-w-[400px]" title={log.details}>
                        {log.details}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-gray-500">{truncateId(log.id)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => copyToClipboard(log.id, "Log ID")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </AccordionSection>

      {/* Recent Prescriptions */}
      <AccordionSection
        title="Recent Prescriptions"
        isExpanded={recentPrescriptionsExpanded}
        onToggle={() => setRecentPrescriptionsExpanded(!recentPrescriptionsExpanded)}
        summary={`${filteredPrescriptions.length} prescriptions`}
        onRefresh={() => handleRefresh("Recent Prescriptions", loadPrescriptions)}
      >
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search prescriptions..."
                  value={prescriptionsSearch}
                  onChange={(e) => setPrescriptionsSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={prescriptionsStatusFilter} onValueChange={setPrescriptionsStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="packed">Packed</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-gray-200 rounded-lg min-h-[400px]">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 w-[120px]">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 w-[110px]">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 w-[160px]">Patient</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 w-[180px]">Provider</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Medication</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 w-[110px]">Queue ID</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrescriptions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500">
                      No prescriptions match your filters
                    </td>
                  </tr>
                ) : (
                  filteredPrescriptions.map((rx, index) => (
                    <tr
                      key={rx.id}
                      className={`group hover:bg-blue-50 transition-colors border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                    >
                      <td className="py-3 px-4 text-gray-900" title={new Date(rx.submitted_at).toLocaleString()}>
                        {getRelativeTime(rx.submitted_at)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className={getStatusColor(rx.status)}>
                          {rx.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-900 truncate max-w-[160px]">
                        {rx.patient ? `${rx.patient.first_name} ${rx.patient.last_name}` : "Unknown"}
                      </td>
                      <td className="py-3 px-4 text-gray-600 truncate max-w-[180px]" title={rx.prescriber?.email}>
                        {rx.prescriber?.email || "Unknown"}
                      </td>
                      <td className="py-3 px-4 text-gray-900">
                        <span className="font-medium">{rx.medication}</span>
                        <span className="text-gray-500 ml-2">{rx.dosage}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-gray-500">
                            {rx.queue_id ? truncateId(rx.queue_id) : "N/A"}
                          </span>
                          {rx.queue_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => copyToClipboard(rx.queue_id, "Queue ID")}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </AccordionSection>
    </div>
  );
}
