import { createClient } from "@/core/supabase/client";

/**
 * Admin Service
 * Handles database operations for admin dashboard metrics
 */

export interface DashboardMetrics {
  totalPatients: number;
  totalProviders: number;
  totalAppointments: number;
  totalOrders: number;
  totalResources: number;
  patientsGrowth: number;
  providersGrowth: number;
  appointmentsGrowth: number;
  ordersGrowth: number;
  resourcesGrowth: number;
}

export interface MonthlyComparison {
  current: number;
  previous: number;
  growth: number;
}

/**
 * Get dashboard metrics for admin overview
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = createClient();

  try {
    // Get current month totals
    const currentMonth = new Date();
    const currentMonthStart = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1,
    );

    // Parallel queries for current totals
    const [
      { count: totalPatients },
      { count: totalProviders },
      { count: totalAppointments },
      { count: totalOrders },
      { count: totalResources },
    ] = await Promise.all([
      supabase.from("patients").select("*", { count: "exact", head: true }),
      supabase.from("providers").select("*", { count: "exact", head: true }),
      supabase.from("appointments").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase.from("resources").select("*", { count: "exact", head: true }),
    ]);

    // Get previous month totals for growth calculation
    const [
      { count: previousPatients },
      { count: previousProviders },
      { count: previousAppointments },
      { count: previousOrders },
      { count: previousResources },
    ] = await Promise.all([
      supabase
        .from("patients")
        .select("*", { count: "exact", head: true })
        .lt("created_at", currentMonthStart.toISOString()),
      supabase
        .from("providers")
        .select("*", { count: "exact", head: true })
        .lt("created_at", currentMonthStart.toISOString()),
      supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .lt("created_at", currentMonthStart.toISOString()),
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .lt("created_at", currentMonthStart.toISOString()),
      supabase
        .from("resources")
        .select("*", { count: "exact", head: true })
        .lt("created_at", currentMonthStart.toISOString()),
    ]);

    // Calculate growth percentages
    const calculateGrowth = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100 * 10) / 10;
    };

    return {
      totalPatients: totalPatients || 0,
      totalProviders: totalProviders || 0,
      totalAppointments: totalAppointments || 0,
      totalOrders: totalOrders || 0,
      totalResources: totalResources || 0,
      patientsGrowth: calculateGrowth(
        totalPatients || 0,
        previousPatients || 0,
      ),
      providersGrowth: calculateGrowth(
        totalProviders || 0,
        previousProviders || 0,
      ),
      appointmentsGrowth: calculateGrowth(
        totalAppointments || 0,
        previousAppointments || 0,
      ),
      ordersGrowth: calculateGrowth(totalOrders || 0, previousOrders || 0),
      resourcesGrowth: calculateGrowth(
        totalResources || 0,
        previousResources || 0,
      ),
    };
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    // Return zero values on error
    return {
      totalPatients: 0,
      totalProviders: 0,
      totalAppointments: 0,
      totalOrders: 0,
      totalResources: 0,
      patientsGrowth: 0,
      providersGrowth: 0,
      appointmentsGrowth: 0,
      ordersGrowth: 0,
      resourcesGrowth: 0,
    };
  }
}

/**
 * Get monthly comparison data for a specific metric
 */
export async function getMonthlyComparison(
  table: string,
  dateField: string = "created_at",
): Promise<MonthlyComparison> {
  const supabase = createClient();

  try {
    const currentMonth = new Date();
    const previousMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - 1,
      1,
    );
    const currentMonthStart = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1,
    );

    const [{ count: current }, { count: previous }] = await Promise.all([
      supabase
        .from(table)
        .select("*", { count: "exact", head: true })
        .gte(dateField, currentMonthStart.toISOString()),
      supabase
        .from(table)
        .select("*", { count: "exact", head: true })
        .gte(dateField, previousMonth.toISOString())
        .lt(dateField, currentMonthStart.toISOString()),
    ]);

    const currentCount = current || 0;
    const previousCount = previous || 0;
    const growth =
      previousCount === 0
        ? currentCount > 0
          ? 100
          : 0
        : Math.round(
            ((currentCount - previousCount) / previousCount) * 100 * 10,
          ) / 10;

    return {
      current: currentCount,
      previous: previousCount,
      growth,
    };
  } catch (error) {
    console.error(`Error fetching monthly comparison for ${table}:`, error);
    return {
      current: 0,
      previous: 0,
      growth: 0,
    };
  }
}
