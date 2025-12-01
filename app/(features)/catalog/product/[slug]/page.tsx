import { notFound } from "next/navigation";
import { ProductDetailPage } from "@/features/product-catalog";
import { productService } from "@/features/product-catalog/services/productService";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPageRoute({ params }: ProductPageProps) {
  const { slug } = await params;

  // Fetch the product by slug from Supabase with Stripe pricing
  const product = await productService.getProductBySlugWithStripePricing(slug);

  if (!product) {
    notFound();
  }

  return <ProductDetailPage product={product} />;
}

// Generate static params from database (optional - can be removed for fully dynamic pages)
export async function generateStaticParams() {
  try {
    // For now, return empty array to use dynamic generation
    // In production, you might want to fetch popular products for static generation
    return [];

    // Alternative: Fetch from database for static generation
    // const { productService } = await import("@/features/product-catalog/services/productService");
    // const products = await productService.getAllActiveProducts(); // You'd need to implement this method
    // return products.map((product) => ({
    //   slug: product.slug,
    // }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}
