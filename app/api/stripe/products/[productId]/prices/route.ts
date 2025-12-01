import { NextRequest, NextResponse } from "next/server";
import { stripePriceServiceServer } from "@/features/product-catalog/services/stripe-price-service.server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const { productId } = await params;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 },
      );
    }

    const pricing = await stripePriceServiceServer.getProductPricing(productId);

    if (!pricing.found) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        productId,
        prices: pricing.prices,
        lowestPrice: pricing.lowestPrice,
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching Stripe product prices:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch product prices",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
