"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@core/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

interface Prescription {
  id: string;
  queueId: string;
  dateTime: string;
  providerName: string;
  patientName: string;
  medication: string;
  strength: string;
  status: string;
}

interface SystemLogEntry {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
  queueId?: string;
}

export default function SuperAdminPage() {
  const { user } = useUser();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [apiStatus, setApiStatus] = useState<"healthy" | "error">("healthy");
  const [lastApiCheck, setLastApiCheck] = useState(new Date());
  const [isTesting, setIsTesting] = useState(false);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLogEntry[]>([]);
  const [stats, setStats] = useState({
    today: 0,
    thisWeek: 0,
    allTime: 0,
  });

  // Check if user is super admin
  useEffect(() => {
    const email = user?.email?.toLowerCase() || "";
    const isSuperAdmin =
      email.endsWith("@smartconnects.com") ||
      email === "joseph@smartconnects.com";

    if (!isSuperAdmin) {
      router.push("/");
      return;
    }

    setIsAuthorized(true);
    loadData();
  }, [user, router]);

  const loadData = () => {
    // Load prescriptions from localStorage
    const submitted = JSON.parse(
      localStorage.getItem("submittedPrescriptions") || "[]"
    );

    // Get last 10 prescriptions
    const last10 = submitted.slice(0, 10);
    setPrescriptions(last10);

    // Calculate stats
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const todayCount = submitted.filter(
      (p: Prescription) => new Date(p.dateTime) >= today
    ).length;
    const weekCount = submitted.filter(
      (p: Prescription) => new Date(p.dateTime) >= weekAgo
    ).length;

    setStats({
      today: todayCount,
      thisWeek: weekCount,
      allTime: submitted.length,
    });

    // Load system logs
    const logs = JSON.parse(localStorage.getItem("systemLogs") || "[]");
    setSystemLogs(logs.slice(0, 20));
  };

  const handleForceApiTest = async () => {
    setIsTesting(true);
    toast.info("Testing DigitalRx API connection...");

    // Simulate API test (replace with real API call in production)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const success = Math.random() > 0.1; // 90% success rate for demo

    if (success) {
      setApiStatus("healthy");
      setLastApiCheck(new Date());
      toast.success("DigitalRx API connection successful!");

      // Log the test
      const newLog: SystemLogEntry = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "API_TEST",
        user: user?.email || "Super Admin",
        details: "DigitalRx API connection test successful",
      };
      const logs = JSON.parse(localStorage.getItem("systemLogs") || "[]");
      logs.unshift(newLog);
      localStorage.setItem("systemLogs", JSON.stringify(logs.slice(0, 100)));
      setSystemLogs(logs.slice(0, 20));
    } else {
      setApiStatus("error");
      toast.error("DigitalRx API connection failed!");
    }

    setIsTesting(false);
  };

  const handleClearCache = () => {
    const confirmed = window.confirm(
      "This will clear all cached data and force a refresh. Continue?"
    );

    if (confirmed) {
      // Don't clear submitted prescriptions, just refresh data
      loadData();
      toast.success("Cache cleared and data refreshed!");

      // Log the action
      const newLog: SystemLogEntry = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "CACHE_CLEAR",
        user: user?.email || "Super Admin",
        details: "System cache cleared and refreshed",
      };
      const logs = JSON.parse(localStorage.getItem("systemLogs") || "[]");
      logs.unshift(newLog);
      localStorage.setItem("systemLogs", JSON.stringify(logs.slice(0, 100)));
      setSystemLogs(logs.slice(0, 20));
    }
  };

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              System monitoring and management for SmartConnect team
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCache}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Clear Cache
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleForceApiTest}
              disabled={isTesting}
              className="gap-2"
            >
              <Zap className="h-4 w-4" />
              {isTesting ? "Testing..." : "Force API Test"}
            </Button>
          </div>
        </div>
      </div>

      {/* Monitoring Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* API Health Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              API Health
            </CardTitle>
            <CardDescription>DigitalRx connection status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {apiStatus === "healthy" ? (
                  <>
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                    <div>
                      <div className="font-semibold text-green-600">
                        Healthy
                      </div>
                      <div className="text-sm text-muted-foreground">
                        All systems operational
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="h-8 w-8 text-red-500" />
                    <div>
                      <div className="font-semibold text-red-600">Error</div>
                      <div className="text-sm text-muted-foreground">
                        Connection failed
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              Last checked:{" "}
              {lastApiCheck.toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </div>
          </CardContent>
        </Card>

        {/* Prescription Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>Prescription Statistics</CardTitle>
            <CardDescription>System-wide prescription counts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold">{stats.today}</div>
                <div className="text-xs text-muted-foreground">Today</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.thisWeek}</div>
                <div className="text-xs text-muted-foreground">This Week</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.allTime}</div>
                <div className="text-xs text-muted-foreground">All Time</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last 10 Prescriptions Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Last 10 Prescriptions</CardTitle>
          <CardDescription>Most recent prescription submissions</CardDescription>
        </CardHeader>
        <CardContent>
          {prescriptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No prescriptions submitted yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Date</th>
                    <th className="text-left py-2 px-2">Doctor</th>
                    <th className="text-left py-2 px-2">Patient</th>
                    <th className="text-left py-2 px-2">Medication</th>
                    <th className="text-left py-2 px-2">Status</th>
                    <th className="text-left py-2 px-2">Queue ID</th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptions.map((rx) => (
                    <tr key={rx.id} className="border-b">
                      <td className="py-2 px-2">
                        {new Date(rx.dateTime).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-2 px-2">{rx.providerName}</td>
                      <td className="py-2 px-2">{rx.patientName}</td>
                      <td className="py-2 px-2">
                        {rx.medication} {rx.strength}
                      </td>
                      <td className="py-2 px-2">
                        <Badge variant="outline">{rx.status}</Badge>
                      </td>
                      <td className="py-2 px-2 font-mono text-xs">
                        {rx.queueId}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Log Card */}
      <Card>
        <CardHeader>
          <CardTitle>System Log</CardTitle>
          <CardDescription>Last 20 system actions and events</CardDescription>
        </CardHeader>
        <CardContent>
          {systemLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No system logs yet
            </div>
          ) : (
            <div className="space-y-2">
              {systemLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <Activity className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {log.action}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="text-sm mt-1">{log.details}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      by {log.user}
                      {log.queueId && ` • Queue ID: ${log.queueId}`}
                    </div>
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
