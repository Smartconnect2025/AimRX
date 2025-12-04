import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { envConfig } from "@core/config";
import { cookies } from "next/headers";

// GET - Fetch all medications or search
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");

    const cookieStore = await cookies();
    const supabase = createServerClient(
      envConfig.NEXT_PUBLIC_SUPABASE_URL,
      envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore in server components
            }
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = supabase
      .from("medication_catalog")
      .select("*")
      .order("medication_name", { ascending: true });

    // If search term is provided, filter results
    if (search && search.trim() !== "") {
      const searchTerm = `%${search.trim()}%`;
      query = query.or(`medication_name.ilike.${searchTerm},sig.ilike.${searchTerm},form.ilike.${searchTerm}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching medication catalog:", error);
      return NextResponse.json(
        { error: "Failed to fetch medications" },
        { status: 500 }
      );
    }

    return NextResponse.json({ medications: data || [] });
  } catch (error) {
    console.error("Error in GET /api/medication-catalog:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new medication
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      envConfig.NEXT_PUBLIC_SUPABASE_URL,
      envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore in server components
            }
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const { data, error } = await supabase
      .from("medication_catalog")
      .insert({
        medication_name: body.medication_name,
        vial_size: body.vial_size || null,
        dosage_amount: body.dosage_amount || null,
        dosage_unit: body.dosage_unit || null,
        form: body.form || null,
        quantity: body.quantity || null,
        refills: body.refills || null,
        sig: body.sig || null,
        pharmacy_notes: body.pharmacy_notes || null,
        patient_price: body.patient_price || null,
        doctor_price: body.doctor_price || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating medication:", error);
      return NextResponse.json(
        { error: "Failed to create medication" },
        { status: 500 }
      );
    }

    return NextResponse.json({ medication: data }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/medication-catalog:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
