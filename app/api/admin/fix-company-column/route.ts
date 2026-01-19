import { NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";

export async function POST() {
  try {
    const supabase = createAdminClient();

    console.log("Adding company_name column to providers table...");

    // Execute raw SQL to add the column
    const { error } = await supabase.rpc("exec_sql", {
      sql: `
        DO $$
        BEGIN
          -- Add company_name column if it doesn't exist
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'providers'
            AND column_name = 'company_name'
          ) THEN
            ALTER TABLE providers ADD COLUMN company_name TEXT;
            RAISE NOTICE 'Added company_name column';
          ELSE
            RAISE NOTICE 'company_name column already exists';
          END IF;
        END $$;
      `
    });

    if (error) {
      console.error("Error adding column:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log("Column added successfully!");

    // Verify it was added
    const { data: verifyData, error: verifyError } = await supabase
      .from("providers")
      .select("id, company_name")
      .limit(1);

    if (verifyError) {
      return NextResponse.json({
        success: true,
        columnAdded: true,
        accessible: false,
        message: "Column added but not yet accessible via API. May need schema reload.",
        error: verifyError.message
      });
    }

    return NextResponse.json({
      success: true,
      columnAdded: true,
      accessible: true,
      message: "company_name column successfully added and is accessible!",
      sample: verifyData
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
