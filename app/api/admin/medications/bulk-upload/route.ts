import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";
import { createServerClient } from "@core/supabase/server";
import * as XLSX from "xlsx";

interface MedicationRow {
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

function parseCSV(text: string): MedicationRow[] {
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
      continue;
    } else {
      currentLine += char;
    }
  }

  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows: MedicationRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });

    rows.push(row as unknown as MedicationRow);
  }

  return rows;
}

function parseExcel(buffer: ArrayBuffer): MedicationRow[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];

  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });

  return jsonData.map((row) => {
    const mapped: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      const cleanKey = key.trim().toLowerCase().replace(/\s+/g, "_");
      mapped[cleanKey] = String(value ?? "").trim();
    }
    return mapped as unknown as MedicationRow;
  });
}

export async function POST(request: NextRequest) {
  try {
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

    const supabase = createAdminClient();

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

    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");
    const isCSV = fileName.endsWith(".csv");

    if (!isExcel && !isCSV) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.",
          imported: 0,
          failed: 0,
        },
        { status: 400 }
      );
    }

    let rows: MedicationRow[];

    if (isExcel) {
      const buffer = await file.arrayBuffer();
      rows = parseExcel(buffer);
    } else {
      const text = await file.text();
      rows = parseCSV(text);
    }

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "File is empty or has no data rows",
          imported: 0,
          failed: 0,
        },
        { status: 400 }
      );
    }

    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;

      try {
        if (!row.name || row.name.trim() === "" || !row.retail_price_cents || row.retail_price_cents.trim() === "") {
          errors.push(
            `Row ${rowNumber}: Missing required fields (name="${row.name || 'empty'}", retail_price_cents="${row.retail_price_cents || 'empty'}")`
          );
          failed++;
          continue;
        }

        const retailPriceCents = Math.round(parseFloat(row.retail_price_cents.trim()) * 100);
        if (isNaN(retailPriceCents) || retailPriceCents < 0) {
          errors.push(
            `Row ${rowNumber}: Invalid retail_price_cents "${row.retail_price_cents}"`
          );
          failed++;
          continue;
        }

        let aimrxSitePricingCents: number | null = null;
        if (row.aimrx_site_pricing_cents && row.aimrx_site_pricing_cents.trim() !== "") {
          const parsed = Math.round(parseFloat(row.aimrx_site_pricing_cents.trim()) * 100);
          if (!isNaN(parsed) && parsed >= 0) {
            aimrxSitePricingCents = parsed;
          }
        }

        const inStock =
          row.in_stock?.toLowerCase() === "false" ? false : true;

        let preparationTimeDays: number | null = null;
        if (row.preparation_time_days) {
          const parsedDays = parseInt(row.preparation_time_days);
          if (!isNaN(parsedDays) && parsedDays >= 0 && parsedDays <= 30) {
            preparationTimeDays = parsedDays;
          }
        }

        const { error: insertError } = await supabase
          .from("pharmacy_medications")
          .insert({
            pharmacy_id: pharmacyId,
            name: row.name.trim(),
            strength: row.strength?.trim() || null,
            vial_size: row.vial_size?.trim() || null,
            form: row.form?.trim() || "Injection",
            ndc: row.ndc?.trim() || null,
            retail_price_cents: retailPriceCents,
            aimrx_site_pricing_cents: aimrxSitePricingCents,
            category: row.category?.trim() || null,
            dosage_instructions: row.dosage_instructions?.trim() || null,
            detailed_description: row.detailed_description?.trim() || null,
            is_active: true,
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

    const success = imported > 0;
    const message = success
      ? `Successfully imported ${imported} medication(s)`
      : "Failed to import any medications";

    return NextResponse.json({
      success,
      message,
      imported,
      failed,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
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
