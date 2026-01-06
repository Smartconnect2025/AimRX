import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";

interface CSVRow {
  name: string;
  strength?: string;
  form?: string;
  ndc?: string;
  retail_price: string;
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
  const lines = text.split("\n").filter((line) => line.trim());
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
    console.log("Starting bulk upload...");
    const supabase = createAdminClient();

    // Get the file and pharmacy_id from form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const pharmacyId = formData.get("pharmacy_id") as string;

    if (!file) {
      console.log("No file uploaded");
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
      console.log("No pharmacy_id provided");
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

    console.log("File received:", file.name, "Size:", file.size, "Pharmacy ID:", pharmacyId);

    // Validate file type
    if (!file.name.endsWith(".csv")) {
      console.log("Invalid file type");
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
    console.log("File content length:", text.length);
    const rows = parseCSV(text);
    console.log("Parsed rows:", rows.length);

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
        if (!row.name || !row.retail_price) {
          errors.push(
            `Row ${rowNumber}: Missing required fields (name or retail_price)`
          );
          failed++;
          continue;
        }

        // Parse retail price (convert dollars to cents)
        const retailPrice = parseFloat(row.retail_price);
        if (isNaN(retailPrice) || retailPrice < 0) {
          errors.push(
            `Row ${rowNumber}: Invalid retail_price "${row.retail_price}"`
          );
          failed++;
          continue;
        }
        const retailPriceCents = Math.round(retailPrice * 100);

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

        // Insert medication (use pharmacyId from form data)
        const { error: insertError } = await supabase
          .from("pharmacy_medications")
          .insert({
            pharmacy_id: pharmacyId,
            name: row.name,
            strength: row.strength || null,
            form: row.form || "Injection",
            ndc: row.ndc || null,
            retail_price_cents: retailPriceCents,
            doctor_markup_percent: 0, // Default to 0
            category: row.category || null,
            dosage_instructions: row.dosage_instructions || null,
            detailed_description: row.detailed_description || null,
            is_active: true, // Default to active
            in_stock: inStock,
            preparation_time_days: preparationTimeDays,
            notes: row.notes || null,
          });

        if (insertError) {
          console.error(
            `Error inserting row ${rowNumber}:`,
            insertError
          );
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
