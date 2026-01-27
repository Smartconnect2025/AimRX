import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@core/supabase/server";
import {
  uploadPrescriptionPdf,
  getPrescriptionPdfUrl,
} from "@core/services/storage/prescriptionPdfStorage";

/**
 * POST /api/prescriptions/[id]/pdf
 * Upload a PDF document for a prescription
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("📄 [PDF API] POST request received");
  try {
    const supabase = await createServerClient();
    const { id: prescriptionId } = await params;
    console.log("📄 [PDF API] Prescription ID:", prescriptionId);

    // Auth check
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    console.log("📄 [PDF API] Auth check:", { userId: user?.id, error: userError?.message });

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get prescription to verify ownership and get patient_id
    console.log("📄 [PDF API] Fetching prescription...");
    const { data: prescription, error: rxError } = await supabase
      .from("prescriptions")
      .select("id, patient_id, prescriber_id, pdf_storage_path")
      .eq("id", prescriptionId)
      .single();

    console.log("📄 [PDF API] Prescription query result:", {
      found: !!prescription,
      patientId: prescription?.patient_id,
      prescriberId: prescription?.prescriber_id,
      existingPdfPath: prescription?.pdf_storage_path,
      error: rxError?.message,
    });

    if (rxError || !prescription) {
      console.error("📄 [PDF API] Prescription not found:", rxError);
      return NextResponse.json(
        { success: false, error: "Prescription not found" },
        { status: 404 }
      );
    }

    // Verify prescriber owns this prescription
    if (prescription.prescriber_id !== user.id) {
      console.error("📄 [PDF API] Unauthorized - prescriber mismatch:", {
        prescriberId: prescription.prescriber_id,
        userId: user.id,
      });
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Check if PDF already exists
    if (prescription.pdf_storage_path) {
      console.log("📄 [PDF API] PDF already exists:", prescription.pdf_storage_path);
      return NextResponse.json(
        { success: false, error: "PDF already uploaded for this prescription" },
        { status: 400 }
      );
    }

    // Parse form data
    console.log("📄 [PDF API] Parsing form data...");
    const formData = await request.formData();
    const file = formData.get("file") as File;

    console.log("📄 [PDF API] File from formData:", {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
    });

    if (!file) {
      console.error("📄 [PDF API] No file provided in formData");
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Upload PDF
    console.log("📄 [PDF API] Calling uploadPrescriptionPdf...");
    const result = await uploadPrescriptionPdf(
      supabase,
      file,
      prescription.patient_id,
      prescriptionId,
      user.id
    );

    console.log("📄 [PDF API] Upload result:", result);

    if (!result.success) {
      console.error("📄 [PDF API] Upload failed:", result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    console.log("📄 [PDF API] Upload successful:", {
      documentId: result.documentId,
      storagePath: result.storagePath,
    });

    return NextResponse.json({
      success: true,
      document_id: result.documentId,
      storage_path: result.storagePath,
      url: result.signedUrl,
    });
  } catch (error) {
    console.error("Error uploading prescription PDF:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload PDF" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/prescriptions/[id]/pdf
 * Get a fresh signed URL for the prescription PDF
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { id: prescriptionId } = await params;

    // Auth check
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

    // Get prescription with PDF path
    const { data: prescription, error } = await supabase
      .from("prescriptions")
      .select("pdf_storage_path, prescriber_id, patient_id")
      .eq("id", prescriptionId)
      .single();

    if (error || !prescription) {
      return NextResponse.json(
        { success: false, error: "Prescription not found" },
        { status: 404 }
      );
    }

    if (!prescription.pdf_storage_path) {
      return NextResponse.json(
        { success: false, error: "No PDF attached to this prescription" },
        { status: 404 }
      );
    }

    // Generate fresh signed URL (24 hours)
    const result = await getPrescriptionPdfUrl(
      supabase,
      prescription.pdf_storage_path,
      60 * 60 * 24
    );

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
    });
  } catch (error) {
    console.error("Error getting prescription PDF URL:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get PDF URL" },
      { status: 500 }
    );
  }
}
