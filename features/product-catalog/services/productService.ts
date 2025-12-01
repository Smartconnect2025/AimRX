/**
 * Product Service - Supabase operations for product management
 * Uses Drizzle schema types for type safety
 */
import type {
  InsertCategory,
  InsertProduct,
  UpdateCategory,
  UpdateProduct,
} from "@/core/database/schema";
import { getUser } from "@core/auth/get-user";
import { createClient } from "@core/supabase/client";
import type { Category, Product } from "../types";

type CreateProductData = InsertProduct;
type UpdateProductData = UpdateProduct & { id: number };
type CreateCategoryData = InsertCategory;
type UpdateCategoryData = UpdateCategory & { id: number };

export const productService = {
  /**
   * Create a new product
   */
  async createProduct(productData: CreateProductData): Promise<Product> {
    const { user, userRole } = await getUser();
    if (!user || userRole !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }
    const supabase = createClient();

    const { data, error } = await supabase
      .from("products")
      .insert([productData])
      .select(
        `
        *,
        category:categories(name, color)
      `,
      )
      .single();

    if (error) {
      console.error("Error creating product:", error);
      throw new Error(`Failed to create product: ${error.message}`);
    }

    return this.transformProduct(data);
  },

  /**
   * Update an existing product
   */
  async updateProduct(productData: UpdateProductData): Promise<Product> {
    const { user, userRole } = await getUser();
    if (!user || userRole !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }
    const supabase = createClient();
    const { id, ...updateData } = productData;

    const { data, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        *,
        category:categories(name, color)
      `,
      )
      .single();

    if (error) {
      console.error("Error updating product:", error);
      throw new Error(`Failed to update product: ${error.message}`);
    }

    return this.transformProduct(data);
  },

  /**
   * Delete a product (soft delete by setting is_active to false)
   */
  async deleteProduct(productId: number): Promise<void> {
    const { user, userRole } = await getUser();
    if (!user || userRole !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }
    const supabase = createClient();

    const { error } = await supabase
      .from("products")
      .update({ is_active: false })
      .eq("id", productId);

    if (error) {
      console.error("Error deleting product:", error);
      throw new Error(`Failed to delete product: ${error.message}`);
    }
  },

  /**
   * Get a single product by ID
   */
  async getProductById(productId: number): Promise<Product | null> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("products")
      .select(
        `
        *,
        category:categories(name, color)
      `,
      )
      .eq("id", productId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Product not found
      }
      console.error("Error fetching product:", error);
      throw new Error(`Failed to fetch product: ${error.message}`);
    }

    return this.transformProduct(data);
  },

  /**
   * Get a single product by slug
   */
  async getProductBySlug(slug: string): Promise<Product | null> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("products")
      .select(
        `
        *,
        category:categories(name, color)
      `,
      )
      .eq("slug", slug)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Product not found
      }
      console.error("Error fetching product by slug:", error);
      throw new Error(`Failed to fetch product: ${error.message}`);
    }

    return this.transformProduct(data);
  },

  /**
   * Create a new category
   */
  async createCategory(categoryData: CreateCategoryData): Promise<Category> {
    const { user, userRole } = await getUser();
    if (!user || userRole !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }
    const supabase = createClient();

    const { data, error } = await supabase
      .from("categories")
      .insert([categoryData])
      .select("*")
      .single();

    if (error) {
      console.error("Error creating category:", error);
      throw new Error(`Failed to create category: ${error.message}`);
    }

    return this.transformCategory(data);
  },

  /**
   * Update an existing category
   */
  async updateCategory(categoryData: UpdateCategoryData): Promise<Category> {
    const { user, userRole } = await getUser();
    if (!user || userRole !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }
    const supabase = createClient();
    const { id, ...updateData } = categoryData;

    const { data, error } = await supabase
      .from("categories")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Error updating category:", error);
      throw new Error(`Failed to update category: ${error.message}`);
    }

    return this.transformCategory(data);
  },

  /**
   * Delete a category (soft delete by setting is_active to false)
   */
  async deleteCategory(categoryId: number): Promise<void> {
    const { user, userRole } = await getUser();
    if (!user || userRole !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }
    const supabase = createClient();

    const { error } = await supabase
      .from("categories")
      .update({ is_active: false })
      .eq("id", categoryId);

    if (error) {
      console.error("Error deleting category:", error);
      throw new Error(`Failed to delete category: ${error.message}`);
    }
  },

  /**
   * Transform database product to frontend Product interface
   */
  transformProduct(dbProduct: Record<string, unknown>): Product {
    return {
      id: dbProduct.id as number,
      name: dbProduct.name as string,
      description: (dbProduct.description as string | null) ?? null,
      slug: dbProduct.slug as string,
      image_url: (dbProduct.image_url as string | null) ?? null,
      category_id: dbProduct.category_id as number,
      is_active: dbProduct.is_active as boolean,
      is_best_seller: dbProduct.is_best_seller as boolean,
      requires_prescription: dbProduct.requires_prescription as boolean,
      created_at: new Date(dbProduct.created_at as string),
      updated_at: new Date(dbProduct.updated_at as string),

      // Stripe integration fields
      stripe_product_id: dbProduct.stripe_product_id as string | null,
      stripe_price_ids: dbProduct.stripe_price_ids as string | null,

      // Inventory fields (now part of products table)
      stock_quantity: (dbProduct.stock_quantity || 0) as number,
      low_stock_threshold: (dbProduct.low_stock_threshold || 10) as number,

      // Additional computed fields from joins
      category_name:
        (dbProduct.category_name as string) ||
        ((dbProduct.category as Record<string, unknown>)?.name as string) ||
        undefined,
      category_color:
        (dbProduct.category_color as string) ||
        ((dbProduct.category as Record<string, unknown>)?.color as string) ||
        undefined,
    };
  },

  /**
   * Get product with Stripe pricing details
   */
  async getProductWithStripePricing(
    productId: number,
  ): Promise<Product | null> {
    const product = await this.getProductById(productId);
    if (!product || !product.stripe_product_id) {
      return product;
    }

    try {
      // Fetch Stripe pricing details
      const { stripePriceServiceServer } = await import(
        "../services/stripe-price-service.server"
      );
      const prices = await stripePriceServiceServer.getProductPrices(
        product.stripe_product_id,
      );

      return {
        ...product,
        stripe_prices: prices,
      };
    } catch (error) {
      console.error("Error fetching Stripe pricing:", error);
      return product; // Return product without pricing if Stripe fails
    }
  },

  /**
   * Get product by slug with Stripe pricing details
   */
  async getProductBySlugWithStripePricing(
    slug: string,
  ): Promise<Product | null> {
    const product = await this.getProductBySlug(slug);
    if (!product || !product.stripe_product_id) {
      return product;
    }

    try {
      // Fetch Stripe pricing details
      const { stripePriceServiceServer } = await import(
        "../services/stripe-price-service.server"
      );
      const prices = await stripePriceServiceServer.getProductPrices(
        product.stripe_product_id,
      );

      return {
        ...product,
        stripe_prices: prices,
      };
    } catch (error) {
      console.error("Error fetching Stripe pricing:", error);
      return product; // Return product without pricing if Stripe fails
    }
  },

  /**
   * Transform database category to frontend Category interface
   */
  transformCategory(dbCategory: Record<string, unknown>): Category {
    return {
      id: dbCategory.id as number,
      name: dbCategory.name as string,
      slug: dbCategory.slug as string,
      description: dbCategory.description as string | null,
      display_order: dbCategory.display_order as number,
      is_active: dbCategory.is_active as boolean,
      color: dbCategory.color as string | null,
      image_url: dbCategory.image_url as string | null,
      created_at: new Date(dbCategory.created_at as string),
      updated_at: new Date(dbCategory.updated_at as string),

      // Additional computed fields
      product_count: 0, // Will be calculated separately
    };
  },
};
