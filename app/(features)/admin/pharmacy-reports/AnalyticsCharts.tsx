"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

interface Order {
  id: string;
  queue_id: string;
  date: string;
  patient: string;
  medication: string;
  quantity: number;
  refills: number;
  sig: string;
  price: number;
  medicationPrice: number;
  providerFees: number;
  status: string;
}

interface ProviderData {
  provider: { id: string; name: string; email: string; group_id: string | null };
  orders: Order[];
  totalOrders: number;
  totalAmount: number;
  totalMedicationAmount: number;
  totalProviderFees: number;
}

interface PharmacyReport {
  pharmacy: { id: string; name: string };
  providers: ProviderData[];
  totalOrders: number;
  totalAmount: number;
}

interface AnalyticsChartsProps {
  reports: PharmacyReport[];
}

const BLUE_PALETTE = [
  "#1E3A8A",
  "#2563EB",
  "#3B82F6",
  "#60A5FA",
  "#93C5FD",
  "#BFDBFE",
  "#1E40AF",
  "#1D4ED8",
];

const STATUS_COLORS: Record<string, string> = {
  submitted: "#3B82F6",
  billing: "#8B5CF6",
  approved: "#10B981",
  packed: "#F59E0B",
  shipped: "#6366F1",
  delivered: "#059669",
};

const CustomTooltip = ({ active, payload, label, prefix }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string; prefix?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3" data-testid="chart-tooltip">
      <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {prefix === "$" ? `$${Number(entry.value).toFixed(2)}` : entry.value}
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsCharts({ reports }: AnalyticsChartsProps) {
  const revenueOverTime = useMemo(() => {
    const dailyMap: Record<string, { date: string; revenue: number; orders: number }> = {};
    reports.forEach((report) => {
      report.providers.forEach((p) => {
        p.orders.forEach((order) => {
          const day = new Date(order.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          const sortKey = new Date(order.date).toISOString().split("T")[0];
          if (!dailyMap[sortKey]) {
            dailyMap[sortKey] = { date: day, revenue: 0, orders: 0 };
          }
          dailyMap[sortKey].revenue += order.price;
          dailyMap[sortKey].orders += 1;
        });
      });
    });
    return Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => ({ ...v, revenue: Math.round(v.revenue * 100) / 100 }));
  }, [reports]);

  const statusDistribution = useMemo(() => {
    const statusMap: Record<string, number> = {};
    reports.forEach((report) => {
      report.providers.forEach((p) => {
        p.orders.forEach((order) => {
          const status = order.status || "unknown";
          statusMap[status] = (statusMap[status] || 0) + 1;
        });
      });
    });
    return Object.entries(statusMap)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: STATUS_COLORS[name] || "#94A3B8",
      }))
      .sort((a, b) => b.value - a.value);
  }, [reports]);

  const topProviders = useMemo(() => {
    const providerMap: Record<string, { name: string; revenue: number; orders: number }> = {};
    reports.forEach((report) => {
      report.providers.forEach((p) => {
        const key = p.provider.id;
        if (!providerMap[key]) {
          providerMap[key] = { name: p.provider.name, revenue: 0, orders: 0 };
        }
        providerMap[key].revenue += p.totalAmount;
        providerMap[key].orders += p.totalOrders;
      });
    });
    return Object.values(providerMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8)
      .map((p) => ({ ...p, revenue: Math.round(p.revenue * 100) / 100 }));
  }, [reports]);

  const pharmacyComparison = useMemo(() => {
    return reports
      .map((r) => ({
        name: r.pharmacy.name.length > 18 ? r.pharmacy.name.slice(0, 18) + "..." : r.pharmacy.name,
        revenue: Math.round(r.totalAmount * 100) / 100,
        orders: r.totalOrders,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [reports]);

  const allOrders = reports.flatMap((r) => r.providers.flatMap((p) => p.orders));

  if (allOrders.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          No data available for charts. Adjust your filters to see analytics.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2" data-testid="analytics-charts">
      <Card className="md:col-span-2" data-testid="chart-revenue-trend">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-[#1E3A8A]">Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueOverTime} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E3A8A" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1E3A8A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#6B7280" }} />
                <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<CustomTooltip prefix="$" />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#1E3A8A"
                  strokeWidth={2.5}
                  fill="url(#revenueGradient)"
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="chart-status-distribution">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-[#1E3A8A]">Order Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  animationDuration={1000}
                  animationEasing="ease-out"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [value, name]}
                  contentStyle={{
                    background: "white",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                    padding: "8px 12px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span className="text-xs text-gray-600 ml-1">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="chart-top-providers">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-[#1E3A8A]">Top Providers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProviders} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#6B7280" }} tickFormatter={(v) => `$${v}`} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#374151" }}
                  width={120}
                />
                <Tooltip content={<CustomTooltip prefix="$" />} />
                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="#1E3A8A"
                  radius={[0, 4, 4, 0]}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {pharmacyComparison.length > 1 && (
        <Card className="md:col-span-2" data-testid="chart-pharmacy-comparison">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-[#1E3A8A]">Pharmacy Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pharmacyComparison} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip content={<CustomTooltip prefix="$" />} />
                  <Bar dataKey="revenue" name="Revenue" animationDuration={1000} animationEasing="ease-out" radius={[4, 4, 0, 0]}>
                    {pharmacyComparison.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={BLUE_PALETTE[index % BLUE_PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
