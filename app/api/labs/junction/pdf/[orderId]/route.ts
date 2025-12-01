import { JunctionLabDataService } from "@/features/labs/services/junctionLabData";
import { createServerClient } from "@core/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 },
      );
    }

    // Get or create Junction user
    const junctionUserId = await JunctionLabDataService.getJunctionUserId(
      user.id,
    );

    const labService = new JunctionLabDataService(user.id, junctionUserId);

    const pdfBlob = await labService.getLabResultPdf(orderId);

    // Convert blob to array buffer for response
    const arrayBuffer = await pdfBlob.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="lab-result-${orderId}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error fetching lab result PDF:", error);
    return NextResponse.json(
      { error: "Failed to fetch lab result PDF" },
      { status: 500 },
    );
  }
}
