"use client";

import { useState, useEffect } from "react";
import { Package, TrendingUp, DollarSign, ShoppingCart, Calendar, User, Pill } from "lucide-react";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
}

interface Prescriber {
  id: string;
  email: string;
  raw_user_meta_data: {
    full_name?: string;
  };
}

interface Medication {
  id: string;
  name: string;
  strength: string | null;
  form: string | null;
  category: string | null;
}

interface Order {
  id: string;
  prescriber_id: string;
  patient_id: string;
  medication: string;
  dosage: string;
  vial_size: string | null;
  form: string | null;
  quantity: number;
  refills: number;
  sig: string;
  patient_price: string | null;
  doctor_price: string | null;
  profit_cents: number;
  total_paid_cents: number;
  status: string;
  submitted_at: string;
  tracking_number: string | null;
  patient: Patient;
  prescriber: Prescriber;
  medication_details: Medication | null;
}

interface Analytics {
  totalOrders: number;
  totalRevenue: number;
  totalProfit: number;
  ordersByStatus: Record<string, number>;
  ordersByMonth: Record<string, number>;
  topMedications: Array<{ name: string; count: number; revenue: number }>;
  doctorBreakdown: Array<{ name: string; orders: number; revenue: number; profit: number }>;
  totalDoctors: number;
}

export default function PharmacyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/pharmacy-orders");
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders || []);
        setAnalytics(data.analytics || null);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      submitted: "bg-blue-100 text-blue-700",
      billing: "bg-yellow-100 text-yellow-700",
      approved: "bg-purple-100 text-purple-700",
      packed: "bg-orange-100 text-orange-700",
      shipped: "bg-indigo-100 text-indigo-700",
      delivered: "bg-green-100 text-green-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const filteredOrders = selectedStatus === "all"
    ? orders
    : orders.filter(o => o.status === selectedStatus);

  return (
    <div className="container mx-auto max-w-full py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Pharmacy Orders Dashboard</h1>
        <p className="text-gray-600">View and manage all prescriptions sent to your pharmacy</p>
      </div>

      {/* ANALYTICS CARDS */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <User className="h-8 w-8 opacity-80" />
              <div className="text-right">
                <div className="text-sm opacity-90">Active Doctors</div>
                <div className="text-3xl font-bold">{analytics.totalDoctors}</div>
              </div>
            </div>
            <div className="text-xs opacity-75">Prescribing in system</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <ShoppingCart className="h-8 w-8 opacity-80" />
              <div className="text-right">
                <div className="text-sm opacity-90">Total Orders</div>
                <div className="text-3xl font-bold">{analytics.totalOrders}</div>
              </div>
            </div>
            <div className="text-xs opacity-75">All time prescriptions</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="h-8 w-8 opacity-80" />
              <div className="text-right">
                <div className="text-sm opacity-90">Total Revenue</div>
                <div className="text-3xl font-bold">${analytics.totalRevenue.toFixed(0)}</div>
              </div>
            </div>
            <div className="text-xs opacity-75">Patient payments received</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-8 w-8 opacity-80" />
              <div className="text-right">
                <div className="text-sm opacity-90">Total Profit</div>
                <div className="text-3xl font-bold">${analytics.totalProfit.toFixed(0)}</div>
              </div>
            </div>
            <div className="text-xs opacity-75">Doctor markup earnings</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Package className="h-8 w-8 opacity-80" />
              <div className="text-right">
                <div className="text-sm opacity-90">Avg Order Value</div>
                <div className="text-3xl font-bold">
                  ${analytics.totalOrders > 0 ? (analytics.totalRevenue / analytics.totalOrders).toFixed(0) : "0"}
                </div>
              </div>
            </div>
            <div className="text-xs opacity-75">Per prescription</div>
          </div>
        </div>
      )}

      {/* ORDERS BY STATUS & MONTH CHARTS */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Orders by Status */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-lg mb-4">
              Orders by Status
            </h3>
            <div className="space-y-3">
              {Object.entries(analytics.ordersByStatus).map(([status, count]) => {
                const percentage = (count / analytics.totalOrders) * 100;
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium capitalize">{status}</span>
                      <span className="text-sm text-gray-600">{count} orders</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Orders by Month */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-lg mb-4">
              Orders by Month (Last 6 Months)
            </h3>
            <div className="space-y-3">
              {Object.entries(analytics.ordersByMonth).map(([month, count]) => {
                const maxCount = Math.max(...Object.values(analytics.ordersByMonth));
                const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                return (
                  <div key={month}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{month}</span>
                      <span className="text-sm text-gray-600">{count} orders</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* BEST-SELLING MEDICATIONS & DOCTOR BREAKDOWN */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Best-Selling Medications */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-lg mb-4">
              Best-Selling Medications
            </h3>
            <div className="space-y-3">
              {analytics.topMedications.slice(0, 5).map((med, index) => {
                const maxCount = analytics.topMedications[0]?.count || 1;
                const percentage = (med.count / maxCount) * 100;
                return (
                  <div key={med.name} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-pink-600">#{index + 1}</span>
                        <span className="text-sm font-medium">{med.name}</span>
                      </div>
                      <span className="text-sm text-gray-600">{med.count} orders • ${med.revenue.toFixed(0)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-pink-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Doctor Payment Breakdown */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-lg mb-4">
              Top Doctors by Revenue
            </h3>
            <div className="space-y-3">
              {analytics.doctorBreakdown.slice(0, 5).map((doctor, index) => {
                const maxRevenue = analytics.doctorBreakdown[0]?.revenue || 1;
                const percentage = (doctor.revenue / maxRevenue) * 100;
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-indigo-600">#{index + 1}</span>
                        <span className="text-sm font-medium">{doctor.name}</span>
                      </div>
                      <span className="text-sm text-gray-600">{doctor.orders} orders</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Revenue: ${doctor.revenue.toFixed(0)}</span>
                      <span>Profit: ${doctor.profit.toFixed(0)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* DOCTOR PAYMENT BREAKDOWN TABLE */}
      {analytics && analytics.doctorBreakdown.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold mb-6">
            Complete Doctor Payment Breakdown
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-sm">Rank</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Doctor Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Total Orders</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Total Revenue</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Total Profit (Doctor)</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Pharmacy Received</th>
                </tr>
              </thead>
              <tbody>
                {analytics.doctorBreakdown.map((doctor, index) => {
                  const pharmacyReceived = doctor.revenue - doctor.profit;
                  return (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold text-sm">
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{doctor.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">{doctor.orders}</td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-semibold text-gray-900">${doctor.revenue.toFixed(2)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-semibold text-green-600">+${doctor.profit.toFixed(2)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-semibold text-blue-600">${pharmacyReceived.toFixed(2)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ORDERS TABLE */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">
              All Orders
            </h2>
            <p className="text-sm text-gray-600 mt-1">{filteredOrders.length} orders</p>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-md border border-gray-300 bg-white text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="billing">Billing</option>
              <option value="approved">Approved</option>
              <option value="packed">Packed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <p className="text-gray-500 text-center py-12">Loading orders...</p>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No orders yet</p>
            <p className="text-sm text-gray-400">Orders will appear here when doctors prescribe medications</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-sm">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Patient</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Doctor</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Medication</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Qty</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Price</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Profit</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const patientPrice = order.total_paid_cents / 100;
                  const profit = order.profit_cents / 100;
                  const orderDate = new Date(order.submitted_at);

                  return (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium">
                              {orderDate.toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium">
                              {order.patient.first_name} {order.patient.last_name}
                            </div>
                            <div className="text-xs text-gray-500">{order.patient.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          {order.prescriber.raw_user_meta_data?.full_name || order.prescriber.email}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Pill className="h-4 w-4 text-blue-500" />
                          <div>
                            <div className="text-sm font-medium">{order.medication}</div>
                            <div className="text-xs text-gray-500">
                              {order.vial_size && `${order.vial_size} • `}
                              {order.form}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">{order.quantity}</td>
                      <td className="py-3 px-4">
                        <div className="text-sm font-semibold">${patientPrice.toFixed(2)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm font-semibold text-green-600">+${profit.toFixed(2)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded capitalize ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
