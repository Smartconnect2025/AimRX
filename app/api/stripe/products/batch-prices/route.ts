import { NextRequest, NextResponse } from "next/server";
import { stripePriceServiceServer } from "@/features/product-catalog/services/stripe-price-service.server";

export async function POST(request: NextRequest) {
  try {
    const { productIds } = await request.json();

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: "Product IDs array is required" },
        { status: 400 },
      );
    }

    // Limit batch size to prevent timeout
    if (productIds.length > 20) {
      return NextResponse.json(
        { error: "Too many product IDs. Maximum 20 allowed." },
        { status: 400 },
      );
    }

    const pricingMap =
      await stripePriceServiceServer.getBatchProductPricing(productIds);

    return NextResponse.json({
      success: true,
      data: Object.fromEntries(
        productIds.map((productId: string) => {
          const summary = pricingMap[productId];
          return [
            productId,
            {
              prices: summary?.prices || [],
              lowestPrice: summary?.lowestPrice || null,
            },
          ];
        }),
      ),
    });
  } catch (error: unknown) {
    console.error("Error fetching batch Stripe prices:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch batch prices",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
