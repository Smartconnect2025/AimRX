"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@core/supabase";
import { Badge } from "@/components/ui/badge";

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

interface APIType {
  name: string;
  count: number;
  actions: string[];
}

export default function APILogsPage() {
  const supabase = createClient();
  const [systemLogs, setSystemLogs] = useState<SystemLogData[]>([]);
  const [selectedAPI, setSelectedAPI] = useState<string | null>(null);
  const [apiTypes, setApiTypes] = useState<APIType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load system logs from database
  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: logsData, error: logsError } = await supabase
        .from("system_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (logsError) {
        console.error("Error loading system logs:", logsError);
      } else {
        const logs = (logsData as SystemLogData[]) || [];
        setSystemLogs(logs);

        // Group logs by action type to create API types
        const actionGroups = logs.reduce((acc, log) => {
          const action = log.action;
          if (!acc[action]) {
            acc[action] = { count: 0, actions: [] };
          }
          acc[action].count++;
          return acc;
        }, {} as Record<string, { count: number; actions: string[] }>);

        const types: APIType[] = Object.entries(actionGroups).map(([name, data]) => ({
          name,
          count: data.count,
          actions: [name],
        }));

        setApiTypes(types);

        // Select first API type by default
        if (types.length > 0 && !selectedAPI) {
          setSelectedAPI(types[0].name);
        }
      }
    } catch (error) {
      console.error("Error loading logs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, selectedAPI]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Filter logs based on selected API
  const filteredLogs = selectedAPI
    ? systemLogs.filter((log) => log.action === selectedAPI)
    : systemLogs;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "success":
        return "bg-green-100 text-green-800 border-green-200";
      case "error":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">API & Logs Dashboard</h1>
      </div>

      <div className="flex gap-6">
        {/* Left Sidebar - API Types List */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="font-semibold text-sm text-gray-700">API Types</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  Loading...
                </div>
              ) : apiTypes.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No logs available
                </div>
              ) : (
                apiTypes.map((api) => (
                  <button
                    key={api.name}
                    onClick={() => setSelectedAPI(api.name)}
                    className={`w-full px-4 py-3 text-left transition-colors ${
                      selectedAPI === api.name
                        ? "bg-blue-50 border-l-4 border-l-blue-600"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {api.name}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {api.count}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area - Logs */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedAPI || "All Logs"}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {filteredLogs.length} recent entries
                  </p>
                </div>
              </div>
            </div>

            {/* Logs Table */}
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-12 text-center text-gray-500">
                  Loading logs...
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  No logs found for this API type
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Queue ID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(log.created_at).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className={getStatusColor(log.status)}
                          >
                            {log.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {log.details}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {log.user_name || log.user_email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                          {log.queue_id || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
