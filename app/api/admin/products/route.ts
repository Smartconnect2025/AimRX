import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@core/supabase";
import { getUser } from "@core/auth";
import { stripePriceServiceServer } from "@/features/product-catalog/services/stripe-price-service.server";

export async function GET(request: NextRequest) {
  try {
    // Check if the current user is an admin
    const { user, userRole } = await getUser();

    if (!user || userRole !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search");
    const category_id = searchParams.get("category_id");

    const offset = (page - 1) * limit;
    const supabase = createClient();

    // Build query with filters
    let query = supabase.from("products").select(
      `
        *,
        categories!inner (
          id,
          name,
          slug
        )
      `,
      { count: "exact" },
    );

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply category filter
    if (category_id) {
      const categoryIds = category_id
        .split(",")
        .map((id) => parseInt(id.trim()));
      query = query.in("category_id", categoryIds);
    }

    // Get total count with filters
    const { count } = await query;

    // Get paginated results with filters
    const { data: products, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching products:", error);
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 },
      );
    }

    // Transform the data to match the expected format
    const transformedProducts =
      products?.map(
        (product: {
          id: number;
          stripe_product_id?: string;
          categories?: { name?: string };
          [key: string]: unknown;
        }) => ({
          ...product,
          category_name: product.categories?.name,
          stock_quantity: product.stock_quantity || 0,
        }),
      ) || [];

    // Fetch Stripe prices for products that have stripe_product_id
    const productsWithPrices = await Promise.all(
      transformedProducts.map(async (product) => {
        if (product.stripe_product_id) {
          try {
            const pricing = await stripePriceServiceServer.getProductPricing(
              product.stripe_product_id,
            );
            if (pricing.found) {
              return {
                ...product,
                stripe_prices: pricing.prices,
                lowest_stripe_price: pricing.lowestPrice,
              };
            }
          } catch (error) {
            console.error(
              `Error fetching Stripe prices for product ${product.id}:`,
              error,
            );
          }
        }
        return product;
      }),
    );

    return NextResponse.json({
      products: productsWithPrices,
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error in products GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if the current user is an admin
    const { user, userRole } = await getUser();

    if (!user || userRole !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const supabase = createClient();

    // Validate required fields
    if (
      !body.name ||
      !body.slug ||
      !body.category_id ||
      body.subscription_price === undefined ||
      body.subscription_price === null
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check if slug already exists
    const { data: existingProduct } = await supabase
      .from("products")
      .select("id")
      .eq("slug", body.slug)
      .single();

    if (existingProduct) {
      return NextResponse.json(
        { error: "Product with this slug already exists" },
        { status: 400 },
      );
    }

    // Create product
    const { data: product, error } = await supabase
      .from("products")
      .insert({
        name: body.name,
        slug: body.slug,
        description: body.description,
        category_id: body.category_id,
        image_url: body.image_url,
        stripe_product_id: body.stripe_product_id || null,
        active_ingredient: body.active_ingredient,
        benefits: body.benefits,
        safety_info: body.safety_info,
        subscription_price: body.subscription_price,
        subscription_price_discounted: body.subscription_price_discounted,
        stock_quantity: body.stock_quantity || 0,
        low_stock_threshold: body.low_stock_threshold || 10,
        is_active: body.is_active !== undefined ? body.is_active : true,
        is_best_seller: body.is_best_seller || false,
        requires_prescription: body.requires_prescription || false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating product:", error);
      return NextResponse.json(
        { error: "Failed to create product" },
        { status: 500 },
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error in products POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
