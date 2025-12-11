"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@core/auth";
import { createClient } from "@core/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

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
  const { user } = useUser();
  const supabase = createClient();

  // Accordion states (expanded by default for System Status)
  const [systemStatusExpanded, setSystemStatusExpanded] = useState(true);
  const [apiDetailsExpanded, setApiDetailsExpanded] = useState(false);
  const [systemLogsExpanded, setSystemLogsExpanded] = useState(false);
  const [quickStatsExpanded, setQuickStatsExpanded] = useState(false);
  const [recentPrescriptionsExpanded, setRecentPrescriptionsExpanded] = useState(false);

  // Data states
  const [healthData, setHealthData] = useState<any>(null);
  const [prescriptions, setPrescriptions] = useState<PrescriptionData[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLogData[]>([]);
  const [stats, setStats] = useState({ today: 0, thisWeek: 0, allTime: 0 });
  const [isRefreshing, setIsRefreshing] = useState<Record<string, boolean>>({});

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
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
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

      {/* System Status Summary */}
      <AccordionSection
        title="System Status Summary"
        isExpanded={systemStatusExpanded}
        onToggle={() => setSystemStatusExpanded(!systemStatusExpanded)}
        onRefresh={() => handleRefresh("System Status", loadHealthData)}
      >
        {healthData && (
          <div className="space-y-4">
            {/* Stat Pills */}
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

            {/* Overall Status */}
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Overall System Health</span>
                <Badge className={getStatusColor(healthData.overallStatus)}>
                  {healthData.overallStatus?.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </AccordionSection>

      {/* API Status Details */}
      <AccordionSection
        title="API Status Details"
        isExpanded={apiDetailsExpanded}
        onToggle={() => setApiDetailsExpanded(!apiDetailsExpanded)}
        summary={healthData ? `${healthData.summary?.operational || 0}/${healthData.summary?.total || 0} Operational` : ""}
        onRefresh={() => handleRefresh("API Details", loadHealthData)}
      >
        {healthData?.healthChecks && (
          <div className="space-y-6">
            {["database", "external", "internal"].map((category) => {
              const categoryAPIs = healthData.healthChecks.filter((api: HealthCheck) => api.category === category);
              if (categoryAPIs.length === 0) return null;

              return (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                    {category} APIs
                  </h3>
                  <div className="space-y-2">
                    {categoryAPIs.map((api: HealthCheck, idx: number) => (
                      <div key={idx} className="p-4 rounded-lg border border-gray-200 flex items-center justify-between">
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
              );
            })}
          </div>
        )}
      </AccordionSection>

      {/* System Activity Logs */}
      <AccordionSection
        title="System Activity Logs"
        isExpanded={systemLogsExpanded}
        onToggle={() => setSystemLogsExpanded(!systemLogsExpanded)}
        summary={`${systemLogs.length} recent entries`}
        onRefresh={() => handleRefresh("System Logs", loadSystemLogs)}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Time</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Action</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">User</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Details</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {systemLogs.slice(0, 20).map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="py-3 px-2 text-gray-900">
                    {new Date(log.created_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-3 px-2 text-gray-900 font-medium">{log.action}</td>
                  <td className="py-3 px-2 text-gray-600">{log.user_name || log.user_email}</td>
                  <td className="py-3 px-2 text-gray-900">{log.details}</td>
                  <td className="py-3 px-2">
                    <Badge variant="outline" className={getStatusColor(log.status)}>
                      {log.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AccordionSection>

      {/* Quick Stats Panel */}
      <AccordionSection
        title="Quick Stats"
        isExpanded={quickStatsExpanded}
        onToggle={() => setQuickStatsExpanded(!quickStatsExpanded)}
        summary={`${stats.allTime} total prescriptions`}
        onRefresh={() => handleRefresh("Quick Stats", loadStats)}
      >
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{stats.today}</div>
            <div className="text-sm text-gray-500 mt-1">Today</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{stats.thisWeek}</div>
            <div className="text-sm text-gray-500 mt-1">This Week</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{stats.allTime}</div>
            <div className="text-sm text-gray-500 mt-1">All Time</div>
          </div>
        </div>
      </AccordionSection>

      {/* Recent Prescriptions */}
      <AccordionSection
        title="Recent Prescriptions"
        isExpanded={recentPrescriptionsExpanded}
        onToggle={() => setRecentPrescriptionsExpanded(!recentPrescriptionsExpanded)}
        summary={`${prescriptions.length} recent prescriptions`}
        onRefresh={() => handleRefresh("Recent Prescriptions", loadPrescriptions)}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Provider</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Patient</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Medication</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Queue ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {prescriptions.map((rx) => (
                <tr key={rx.id} className="hover:bg-gray-50">
                  <td className="py-3 px-2 text-gray-900">
                    {new Date(rx.submitted_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="py-3 px-2 text-gray-900">{rx.prescriber?.email || "Unknown"}</td>
                  <td className="py-3 px-2 text-gray-900">
                    {rx.patient ? `${rx.patient.first_name} ${rx.patient.last_name}` : "Unknown"}
                  </td>
                  <td className="py-3 px-2 text-gray-900">{rx.medication} {rx.dosage}</td>
                  <td className="py-3 px-2">
                    <Badge variant="outline">{rx.status}</Badge>
                  </td>
                  <td className="py-3 px-2 font-mono text-xs text-gray-600">{rx.queue_id || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AccordionSection>
    </div>
  );
}
