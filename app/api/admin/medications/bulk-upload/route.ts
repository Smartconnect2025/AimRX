import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";
import { createServerClient } from "@core/supabase/server";

interface CSVRow {
  name: string;
  strength?: string;
  vial_size?: string;
  form?: string;
  ndc?: string;
  retail_price_cents: string;
  aimrx_site_pricing_cents?: string;
  category?: string;
  dosage_instructions?: string;
  detailed_description?: string;
  in_stock?: string;
  preparation_time_days?: string;
  notes?: string;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function parseCSV(text: string): CSVRow[] {
  // Split by newlines while respecting quoted fields that may contain newlines
  const lines: string[] = [];
  let currentLine = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      inQuotes = !inQuotes;
      currentLine += char;
    } else if (char === '\n' && !inQuotes) {
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = "";
    } else if (char === '\r') {
      // Skip carriage returns
      continue;
    } else {
      currentLine += char;
    }
  }

  // Add the last line if it exists
  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });

    rows.push(row as unknown as CSVRow);
  }

  return rows;
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const authSupabase = await createServerClient();
    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userRole } = await authSupabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (userRole?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Create Supabase admin client
    const supabase = createAdminClient();

    // Get the file and pharmacy_id from form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const pharmacyId = formData.get("pharmacy_id") as string;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: "No file uploaded",
          imported: 0,
          failed: 0,
        },
        { status: 400 }
      );
    }

    if (!pharmacyId) {
      return NextResponse.json(
        {
          success: false,
          message: "Pharmacy selection is required",
          imported: 0,
          failed: 0,
        },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid file type. Please upload a CSV file.",
          imported: 0,
          failed: 0,
        },
        { status: 400 }
      );
    }

    // Read file content
    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "CSV file is empty or invalid",
          imported: 0,
          failed: 0,
        },
        { status: 400 }
      );
    }

    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because row 1 is headers and we start from row 2

      try {
        // Validate required fields (pharmacy_id comes from form data, not CSV)
        if (!row.name || row.name.trim() === "" || !row.retail_price_cents || row.retail_price_cents.trim() === "") {
          errors.push(
            `Row ${rowNumber}: Missing required fields (name="${row.name || 'empty'}", retail_price_cents="${row.retail_price_cents || 'empty'}")`
          );
          failed++;
          continue;
        }

        // Parse retail_price_cents (already in cents)
        const retailPriceCents = parseInt(row.retail_price_cents.trim());
        if (isNaN(retailPriceCents) || retailPriceCents < 0) {
          errors.push(
            `Row ${rowNumber}: Invalid retail_price_cents "${row.retail_price_cents}"`
          );
          failed++;
          continue;
        }

        // Parse aimrx_site_pricing_cents (optional, already in cents)
        let aimrxSitePricingCents: number | null = null;
        if (row.aimrx_site_pricing_cents && row.aimrx_site_pricing_cents.trim() !== "") {
          const parsed = parseInt(row.aimrx_site_pricing_cents.trim());
          if (!isNaN(parsed) && parsed >= 0) {
            aimrxSitePricingCents = parsed;
          }
        }

        // Parse in_stock
        const inStock =
          row.in_stock?.toLowerCase() === "false" ? false : true;

        // Parse preparation_time_days
        let preparationTimeDays: number | null = null;
        if (row.preparation_time_days) {
          const parsedDays = parseInt(row.preparation_time_days);
          if (!isNaN(parsedDays) && parsedDays >= 0 && parsedDays <= 30) {
            preparationTimeDays = parsedDays;
          }
        }

        // Insert medication using Supabase
        const { error: insertError } = await supabase
          .from("pharmacy_medications")
          .insert({
            pharmacy_id: pharmacyId,
            name: row.name,
            strength: row.strength || null,
            vial_size: row.vial_size || null,
            form: row.form || "Injection",
            ndc: row.ndc || null,
            retail_price_cents: retailPriceCents,
            aimrx_site_pricing_cents: aimrxSitePricingCents,
            category: row.category || null,
            dosage_instructions: row.dosage_instructions || null,
            detailed_description: row.detailed_description || null,
            is_active: true, // Default to active
            in_stock: inStock,
            preparation_time_days: preparationTimeDays,
            notes: row.notes?.trim() || null,
          });

        if (insertError) {
          console.error(`Error inserting row ${rowNumber}:`, insertError);
          errors.push(
            `Row ${rowNumber}: Database error - ${insertError.message}`
          );
          failed++;
        } else {
          imported++;
        }

      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error);
        errors.push(
          `Row ${rowNumber}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
        failed++;
      }
    }

    // Return results
    const success = imported > 0;
    const message = success
      ? `Successfully imported ${imported} medication(s)`
      : "Failed to import any medications";

    return NextResponse.json({
      success,
      message,
      imported,
      failed,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Limit to first 10 errors
    });
  } catch (error) {
    console.error("Error in bulk upload:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Server error during upload",
        imported: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      },
      { status: 500 }
    );
  }
}
