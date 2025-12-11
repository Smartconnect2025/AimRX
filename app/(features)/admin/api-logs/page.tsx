"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@core/auth";
import { createClient } from "@core/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Activity,
  RefreshCw,
  Database,
  TrendingUp,
} from "lucide-react";
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

export default function APILogsPage() {
  const { user } = useUser();
  const supabase = createClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [prescriptions, setPrescriptions] = useState<PrescriptionData[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLogData[]>([]);
  const [stats, setStats] = useState({
    today: 0,
    thisWeek: 0,
    allTime: 0,
  });

  // Load data from Supabase
  const loadData = useCallback(async () => {
    try {
      // Load last 10 prescriptions with patient info
      const { data: rxData, error: rxError } = await supabase
        .from("prescriptions")
        .select(
          `
          id,
          queue_id,
          submitted_at,
          medication,
          dosage,
          status,
          prescriber_id,
          patient:patients(first_name, last_name)
        `
        )
        .order("submitted_at", { ascending: false })
        .limit(10);

      if (rxError) {
        console.error("Error loading prescriptions:", rxError);
        setPrescriptions([]);
      } else if (rxData) {
        const formattedData = rxData.map((rx) => ({
          ...rx,
          patient: Array.isArray(rx.patient) ? rx.patient[0] : rx.patient,
          prescriber: { email: rx.prescriber_id },
        }));

        setPrescriptions(formattedData as unknown as PrescriptionData[]);
      }

      // Load prescription stats
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

      // Load last 50 system logs
      const { data: logsData, error: logsError } = await supabase
        .from("system_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (logsError) {
        console.error("Error loading system logs:", logsError);
      } else {
        setSystemLogs((logsData as SystemLogData[]) || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load dashboard data");
    }
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    toast.success("Data refreshed");
    setIsRefreshing(false);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">API & Logs</h1>
            <p className="text-gray-600 mt-2">
              Monitor system activity and prescription flow
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-[#00AEEF] hover:bg-[#0098D4]"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Today
              </CardTitle>
              <Database className="h-5 w-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.today}</div>
            <p className="text-xs text-gray-500 mt-1">Prescriptions submitted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                This Week
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.thisWeek}</div>
            <p className="text-xs text-gray-500 mt-1">Prescriptions submitted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                All Time
              </CardTitle>
              <Activity className="h-5 w-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.allTime}</div>
            <p className="text-xs text-gray-500 mt-1">Total prescriptions</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Prescriptions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Recent Prescriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {prescriptions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No prescriptions yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Patient</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Medication</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Queue ID</th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptions.map((rx) => (
                    <tr key={rx.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {new Date(rx.submitted_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {rx.patient
                          ? `${rx.patient.first_name} ${rx.patient.last_name}`
                          : "Unknown"}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {rx.medication} {rx.dosage}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {rx.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm font-mono text-gray-600">
                        {rx.queue_id || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Logs */}
      <Card>
        <CardHeader>
          <CardTitle>System Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {systemLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No activity logs yet
            </div>
          ) : (
            <div className="space-y-3">
              {systemLogs.slice(0, 20).map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
                >
                  <Activity className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {log.action}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{log.details}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {log.user_email}
                      {log.queue_id && ` • Queue: ${log.queue_id}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
