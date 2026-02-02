import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@core/supabase/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];

/**
 * Upload patient documents
 * POST /api/patients/[patientId]/documents
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerClient();
  const { id: patientId } = await params;

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

    // Verify patient exists
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id")
      .eq("id", patientId)
      .single();

    if (patientError || !patient) {
      return NextResponse.json(
        { success: false, error: "Patient not found" },
        { status: 404 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `File type ${file.type} not supported. Allowed types: PNG, JPEG, PDF`,
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File too large. Maximum size is 10MB`,
        },
        { status: 400 }
      );
    }

    // Determine file type category
    let fileType = "other";
    if (file.type.startsWith("image/")) {
      fileType = "image";
    } else if (file.type === "application/pdf") {
      fileType = "pdf";
    }

    // Create unique file path
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const storagePath = `patient-documents/${patientId}/${fileName}`;

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("patient-files")
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading file to storage:", uploadError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to upload file",
          details: uploadError.message,
        },
        { status: 500 }
      );
    }

    // Get signed URL for the file (private bucket requires signed URLs)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("patient-files")
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7); // 7 days expiry

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error("Error creating signed URL:", signedUrlError);
      // Clean up uploaded file
      await supabase.storage.from("patient-files").remove([storagePath]);
      return NextResponse.json(
        { success: false, error: "Failed to generate file URL" },
        { status: 500 }
      );
    }

    const fileUrl = signedUrlData.signedUrl;

    // Save document metadata to database
    const { data: document, error: dbError } = await supabase
      .from("patient_documents")
      .insert({
        patient_id: patientId,
        name: file.name,
        file_type: fileType,
        mime_type: file.type,
        file_size: file.size,
        file_url: fileUrl,
        storage_path: storagePath,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Error saving document metadata:", dbError);
      // Clean up uploaded file
      await supabase.storage.from("patient-files").remove([storagePath]);

      return NextResponse.json(
        {
          success: false,
          error: "Failed to save document metadata",
          details: dbError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Document uploaded successfully",
      document,
    });
  } catch (error) {
    console.error("Error in document upload:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload document",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Get patient documents
 * GET /api/patients/[patientId]/documents
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerClient();
  const { id: patientId } = await params;

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

    // Fetch documents for patient
    const { data: documents, error } = await supabase
      .from("patient_documents")
      .select("*")
      .eq("patient_id", patientId)
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("Error fetching documents:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch documents",
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Generate fresh signed URLs for all documents
    // All documents are stored in the same bucket "patient-files", just different paths:
    // - Regular docs: patient-documents/{patientId}/{filename}
    // - Prescription docs: prescriptions/{patientId}/{prescriptionId}/{timestamp}.pdf
    const documentsWithFreshUrls = await Promise.all(
      (documents || []).map(async (doc) => {
        if (doc.storage_path) {
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from("patient-files")
            .createSignedUrl(doc.storage_path, 60 * 60 * 24); // 24 hours expiry

          if (!signedUrlError && signedUrlData?.signedUrl) {
            return { ...doc, file_url: signedUrlData.signedUrl };
          }
        }
        // Return original if we couldn't generate fresh URL
        return doc;
      })
    );

    return NextResponse.json({
      success: true,
      documents: documentsWithFreshUrls,
    });
  } catch (error) {
    console.error("Error in get documents:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch documents",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
      );
  }
}

/**
 * Delete patient document
 * DELETE /api/patients/[patientId]/documents
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerClient();
  const { id: patientId } = await params;

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
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("id");

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: "Document ID required" },
        { status: 400 }
      );
    }

    // Get document metadata
    const { data: document, error: fetchError } = await supabase
      .from("patient_documents")
      .select("*")
      .eq("id", documentId)
      .eq("patient_id", patientId)
      .single();

    if (fetchError || !document) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    // Delete file from storage
    const { error: storageError } = await supabase.storage
      .from("patient-files")
      .remove([document.storage_path]);

    if (storageError) {
      console.error("Error deleting file from storage:", storageError);
      // Continue to delete DB record even if storage deletion fails
    }

    // Delete document record from database
    const { error: deleteError } = await supabase
      .from("patient_documents")
      .delete()
      .eq("id", documentId);

    if (deleteError) {
      console.error("Error deleting document record:", deleteError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to delete document",
          details: deleteError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Error in delete document:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete document",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
