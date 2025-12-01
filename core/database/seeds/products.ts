import { createSeedClient } from "../client";
import { productsData } from "./data/products";
import { categoriesData } from "./data/categories";
import type { Category, Product } from "../schema";

export async function seedCategories() {
  try {
    console.log("Seeding categories table...");
    console.log(`Attempting to seed ${categoriesData.length} categories`);

    const supabase = createSeedClient();

    // Insert or update category data with conflict resolution
    const { data, error } = await supabase
      .from("categories")
      .upsert(categoriesData, { onConflict: "slug", ignoreDuplicates: true })
      .select();

    if (error) {
      console.error("Upsert error:", error);
      throw error;
    }

    const affectedCount = data?.length || 0;
    if (affectedCount === 0) {
      console.log(
        "WARNING: No categories were inserted or updated (already present)",
      );
    } else {
      console.log(
        `Successfully inserted or updated ${affectedCount} categories`,
      );
      data?.forEach((category: Category) => {
        console.log(`   - ${category.name} (${category.slug})`);
      });
    }
  } catch (error) {
    console.error("Error seeding categories:", error);
    throw error;
  }
}

export async function seedProducts() {
  try {
    console.log("Seeding products table...");
    console.log(`Attempting to seed ${productsData.length} products`);

    const supabase = createSeedClient();

    // Test connection first
    console.log("Testing database connection...");
    const { error: testError } = await supabase
      .from("products")
      .select("id")
      .limit(1);

    if (testError) {
      console.error("Database connection test failed:", testError);
      throw testError;
    }

    console.log("Database connection successful");

    // Ensure categories exist first
    await seedCategories();

    // Insert or update product data with conflict resolution
    const { data, error } = await supabase
      .from("products")
      .upsert(productsData, { onConflict: "slug", ignoreDuplicates: true })
      .select();

    if (error) {
      console.error("Upsert error:", error);
      throw error;
    }

    const affectedCount = data?.length || 0;
    if (affectedCount === 0) {
      console.log(
        "WARNING: No products were inserted or updated (already present)",
      );
    } else {
      console.log(`Successfully inserted or updated ${affectedCount} products`);

      // Log product details for verification with stock status
      data?.forEach((product: Product) => {
        const stockStatus =
          product.stock_quantity === 0
            ? "OUT OF STOCK"
            : `${product.stock_quantity} in stock`;
        const prescriptionStatus = product.requires_prescription
          ? "RX REQUIRED"
          : "OTC";
        const bestSellerStatus = product.is_best_seller ? "BEST SELLER" : "";
        console.log(
          `   - ${product.name} (${stockStatus}, ${prescriptionStatus}) ${bestSellerStatus}`,
        );
      });
    }
  } catch (error) {
    console.error("Error seeding products:", error);
    throw error;
  }
}

export async function main() {
  await seedProducts();
  process.exit(0);
}

// Run the seed if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
}
