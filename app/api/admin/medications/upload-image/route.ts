import { NextRequest, NextResponse } from "next/server";
import { uploadMedicationImage } from "@/core/services/storage/medicationImageStorage";

/**
 * POST /api/admin/medications/upload-image
 * Upload a medication image to Supabase Storage
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const medicationName = formData.get("medicationName") as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (!medicationName) {
      return NextResponse.json(
        { success: false, error: "Medication name is required" },
        { status: 400 }
      );
    }

    // Upload to Supabase Storage
    const result = await uploadMedicationImage(file, medicationName);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      message: "Image uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading medication image:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
