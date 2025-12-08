import { NextResponse } from "next/server";
import { createServerClient } from "@core/supabase/server";

/**
 * Get all orders/prescriptions for the pharmacy admin's pharmacy
 * GET /api/admin/pharmacy-orders
 */
export async function GET() {
  const supabase = await createServerClient();

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get pharmacy admin's pharmacy
    const { data: adminLink } = await supabase
      .from("pharmacy_admins")
      .select("pharmacy_id")
      .eq("user_id", user.id)
      .single();

    if (!adminLink) {
      return NextResponse.json(
        { success: false, error: "You are not linked to any pharmacy" },
        { status: 403 }
      );
    }

    const pharmacyId = adminLink.pharmacy_id;

    // Get all prescriptions for this pharmacy with related data
    const { data: prescriptions, error } = await supabase
      .from("prescriptions")
      .select(`
        *,
        patient:patients(
          id,
          first_name,
          last_name,
          email,
          phone,
          date_of_birth
        ),
        prescriber:prescriber_id(
          id,
          email,
          raw_user_meta_data
        ),
        medication:pharmacy_medications(
          id,
          name,
          strength,
          form,
          category
        )
      `)
      .eq("pharmacy_id", pharmacyId)
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error("Error fetching pharmacy orders:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch orders" },
        { status: 500 }
      );
    }

    // Calculate analytics
    const totalOrders = prescriptions?.length || 0;
    const totalRevenue = prescriptions?.reduce((sum, p) => sum + (p.total_paid_cents || 0), 0) || 0;
    const totalProfit = prescriptions?.reduce((sum, p) => sum + (p.profit_cents || 0), 0) || 0;

    // Orders by status
    const ordersByStatus = prescriptions?.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Orders by month (last 6 months)
    const ordersByMonth: Record<string, number> = {};
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      ordersByMonth[key] = 0;
    }

    prescriptions?.forEach((p) => {
      const date = new Date(p.submitted_at);
      const key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (ordersByMonth[key] !== undefined) {
        ordersByMonth[key]++;
      }
    });

    return NextResponse.json({
      success: true,
      orders: prescriptions,
      analytics: {
        totalOrders,
        totalRevenue: totalRevenue / 100, // Convert cents to dollars
        totalProfit: totalProfit / 100, // Convert cents to dollars
        ordersByStatus,
        ordersByMonth,
      },
    });
  } catch (error) {
    console.error("Error in get pharmacy orders:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch pharmacy orders",
      },
      { status: 500 }
    );
  }
}
