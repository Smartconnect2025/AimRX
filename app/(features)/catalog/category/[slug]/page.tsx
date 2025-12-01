import { notFound } from "next/navigation";
import { CategoryPage } from "@/features/product-catalog";
import { createClient } from "@core/supabase/client";
import { productService } from "@/features/product-catalog/services/productService";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPageRoute({ params }: CategoryPageProps) {
  const { slug } = await params;

  // Find the category by slug from database
  const supabase = createClient();

  const { data: categoryData, error: categoryError } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (categoryError || !categoryData) {
    notFound();
  }

  const { data: productsData, error: productsError } = await supabase
    .from("products")
    .select(
      `
      *,
      category:categories(name, color)
    `,
    )
    .eq("category_id", categoryData.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (productsError) {
    console.error("Error fetching products:", productsError);
    notFound();
  }

  // Transform category data
  const category = {
    ...productService.transformCategory(categoryData),
    product_count: productsData.filter(
      (product) => product.category_id === categoryData.id,
    ).length,
  };

  // Transform products data
  const products = productsData.map((product) =>
    productService.transformProduct(product),
  );

  return <CategoryPage category={category} products={products} />;
}

// Generate static params for all categories (optional - for static generation)
export async function generateStaticParams() {
  try {
    // For now, return empty array to use dynamic generation
    // In production, you might want to fetch popular categories for static generation
    return [];

    // Alternative: Fetch from database for static generation
    // const supabase = createClient();
    // const { data: categories } = await supabase
    //   .from("categories")
    //   .select("slug")
    //   .eq("is_active", true);
    //
    // return categories?.map((category) => ({
    //   slug: category.slug,
    // })) || [];
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}
