import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@core/supabase";
import { getUser } from "@core/auth";

export async function GET(request: NextRequest) {
  try {
    const { user, userRole } = await getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    if (!userRole || !["admin", "super_admin"].includes(userRole)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const categoryName = request.nextUrl.searchParams.get("category");
    if (!categoryName) {
      return NextResponse.json(
        { error: "category query parameter is required" },
        { status: 400 },
      );
    }

    const supabase = await createServerClient();

    const { data: meds, error } = await supabase
      .from("pharmacy_medications")
      .select("id, name, strength, pharmacy_id, pharmacies(name)")
      .eq("category", categoryName)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching category medications:", error);
      return NextResponse.json(
        { error: "Failed to fetch medications" },
        { status: 500 },
      );
    }

    const pharmacyMap = new Map<
      string,
      { pharmacy_id: string; pharmacy_name: string; medications: { id: number; name: string; strength: string | null }[] }
    >();

    for (const med of meds || []) {
      const pid = med.pharmacy_id;
      const pharmacyData = (med as unknown as { pharmacies: { name: string } | { name: string }[] | null }).pharmacies;
      const pname = Array.isArray(pharmacyData) ? pharmacyData[0]?.name : pharmacyData?.name || "Unknown";

      if (!pharmacyMap.has(pid)) {
        pharmacyMap.set(pid, { pharmacy_id: pid, pharmacy_name: pname, medications: [] });
      }
      pharmacyMap.get(pid)!.medications.push({
        id: med.id,
        name: med.name,
        strength: med.strength,
      });
    }

    return NextResponse.json({
      category: categoryName,
      pharmacies: Array.from(pharmacyMap.values()),
      total: (meds || []).length,
    });
  } catch (error) {
    console.error("Error in category medications GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
