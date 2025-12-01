"use client";

import React, { useState, useEffect } from "react";
import { Package, ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "./ImageUpload";
import { RichTextEditor } from "./RichTextEditor";
import { generateProductUrl } from "@/features/admin-dashboard/utils/urlGenerator";
import { isSupabaseStorageUrl } from "@/core/services/imageUploadService";
import type { Product, Category, ProductFormData } from "../types";

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  categories: Category[];
  onSubmit: (data: ProductFormData) => Promise<void>;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  categories,
  onSubmit,
}: ProductFormDialogProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    slug: "",
    description: "",
    category_id: 0,
    image_url: "",
    stripe_product_id: "",
    stock_quantity: 0,
    low_stock_threshold: 10,
    is_active: true,
    is_best_seller: false,
    requires_prescription: false,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [urlCopied, setUrlCopied] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);

  // Reset form when product changes or dialog opens/closes
  useEffect(() => {
    if (product) {
      // Editing existing product
      setFormData({
        name: product.name,
        slug: product.slug,
        description: product.description || "",
        category_id: product.category_id,
        image_url: product.image_url || "",
        stripe_product_id: product.stripe_product_id || "",
        // Note: active_ingredient, benefits, safety_info, and pricing fields
        // have been removed from Product interface as they're now handled by Stripe
        stock_quantity: product.stock_quantity,
        low_stock_threshold: product.low_stock_threshold,
        is_active: product.is_active,
        is_best_seller: product.is_best_seller,
        requires_prescription: product.requires_prescription,
      });
    } else {
      // Creating new product - reset to default values
      setFormData({
        name: "",
        slug: "",
        description: "",
        category_id: categories.length > 0 ? categories[0].id : 0,
        image_url: "",
        stripe_product_id: "",
        // Removed fields: active_ingredient, benefits, safety_info, subscription_price, subscription_price_discounted
        stock_quantity: 0,
        low_stock_threshold: 10,
        is_active: true,
        is_best_seller: false,
        requires_prescription: false,
      });
    }
    // Clear any existing errors when form resets
    setErrors({});
  }, [product, categories, open]);

  const handleInputChange = (
    field: keyof ProductFormData,
    value: string | number | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    } else if (formData.name.length > 150) {
      newErrors.name = "Product name must be 150 characters or less";
    }

    if (!formData.slug.trim()) {
      newErrors.slug = "Slug is required";
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug =
        "Slug can only contain lowercase letters, numbers, and hyphens";
    }

    if (formData.category_id === 0) {
      newErrors.category_id = "Category is required";
    }

    if (formData.stock_quantity < 0) {
      newErrors.stock_quantity = "Stock quantity cannot be negative";
    }

    if (formData.low_stock_threshold < 0) {
      newErrors.low_stock_threshold = "Low stock threshold cannot be negative";
    }

    if (
      formData.stripe_product_id &&
      !/^prod_[a-zA-Z0-9]+$/.test(formData.stripe_product_id)
    ) {
      newErrors.stripe_product_id = "Invalid Stripe product ID format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (name: string) => {
    handleInputChange("name", name);
    if (!product) {
      // Auto-generate slug for new products
      handleInputChange("slug", generateSlug(name));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Prevent submission if image is still uploading
    if (isImageUploading) {
      setErrors((prev) => ({
        ...prev,
        image_url: "Please wait for image upload to complete",
      }));
      return;
    }

    setLoading(true);
    try {
      // Debug: Log the current image URL
      console.log("Form submission - image_url:", formData.image_url);
      console.log(
        "isSupabaseStorageUrl:",
        formData.image_url
          ? isSupabaseStorageUrl(formData.image_url)
          : "no URL",
      );
      console.log(
        "startsWith blob:",
        formData.image_url ? formData.image_url.startsWith("blob:") : "no URL",
      );

      // Validate that image_url is a proper Supabase Storage URL or empty
      // Temporarily allow any URL for debugging
      if (
        formData.image_url &&
        !isSupabaseStorageUrl(formData.image_url) &&
        !formData.image_url.startsWith("blob:") &&
        !formData.image_url.startsWith("http")
      ) {
        console.log("Validation failed for URL:", formData.image_url);
        setErrors((prev) => ({
          ...prev,
          image_url: "Please upload a valid image file",
        }));
        setLoading(false);
        return;
      }

      await onSubmit(formData);
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = async () => {
    if (!formData.slug) return;

    const url = generateProductUrl(formData.slug);
    try {
      await navigator.clipboard.writeText(url);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy URL:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto border border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {product ? "Edit Product" : "Create New Product"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cover Image Upload */}
          <div className="space-y-2">
            <Label>Cover Image *</Label>
            <ImageUpload
              value={formData.image_url}
              onChange={(url) => handleInputChange("image_url", url)}
              onError={(error) =>
                setErrors((prev) => ({ ...prev, image_url: error }))
              }
              onUploadingChange={(uploading) => {
                setIsImageUploading(uploading);
                if (uploading) {
                  // Clear any existing image errors when upload starts
                  setErrors((prev) => ({ ...prev, image_url: "" }));
                }
              }}
            />
            {errors.image_url && (
              <p className="text-sm text-destructive">{errors.image_url}</p>
            )}
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Enter product name (max 150 characters)"
                maxLength={150}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {formData.name.length}/150 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleInputChange("slug", e.target.value)}
                placeholder="product-slug"
                className={errors.slug ? "border-destructive" : ""}
              />
              {errors.slug && (
                <p className="text-sm text-destructive">{errors.slug}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <RichTextEditor
              value={formData.description}
              onChange={(content) => handleInputChange("description", content)}
              placeholder="Enter product description with rich formatting..."
              className="min-h-[200px]"
              toolbarConfig={{
                showHeadings: false,
                showLists: true,
                showCode: false,
                showQuote: true,
                showLink: true,
                showImage: false,
                showTable: false,
                showUndoRedo: true,
              }}
            />
            <p className="text-xs text-muted-foreground">
              Use the toolbar above to format your description with bold,
              italic, lists, quotes, and links.
            </p>
          </div>

          {/* Product URL Generation */}
          {formData.slug && (
            <div className="space-y-2">
              <Label>Product URL</Label>
              <div className="flex gap-2">
                <Input
                  value={generateProductUrl(formData.slug)}
                  readOnly
                  className="bg-muted"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyUrl}
                  disabled={!formData.slug}
                >
                  {urlCopied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open(generateProductUrl(formData.slug), "_blank")
                  }
                  disabled={!formData.slug}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Auto-generated shareable URL for this product
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="stripe_product_id">
              Stripe Product ID (Optional)
            </Label>
            <Input
              id="stripe_product_id"
              value={formData.stripe_product_id || ""}
              onChange={(e) =>
                handleInputChange("stripe_product_id", e.target.value)
              }
              placeholder="Optional - prod_xxxxxxxxxxxxx"
              className={errors.stripe_product_id ? "border-destructive" : ""}
            />
            {errors.stripe_product_id && (
              <p className="text-sm text-destructive">
                {errors.stripe_product_id}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Find this in your Stripe dashboard. If not provided, the product
              will not be purchasable as no prices will be displayed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category_id.toString()}
                onValueChange={(value) =>
                  handleInputChange("category_id", parseInt(value))
                }
              >
                <SelectTrigger
                  className={errors.category_id ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id.toString()}
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category_id && (
                <p className="text-sm text-destructive">{errors.category_id}</p>
              )}
            </div>
          </div>

          {/* Note: Medical Information and Pricing sections removed */}
          {/* These fields are now managed by Stripe: active_ingredient, benefits, safety_info, pricing */}

          {/* Inventory */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Inventory</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock_quantity">Stock Quantity *</Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  min="0"
                  value={formData.stock_quantity}
                  onChange={(e) =>
                    handleInputChange(
                      "stock_quantity",
                      parseInt(e.target.value) || 0,
                    )
                  }
                  placeholder="0"
                  className={errors.stock_quantity ? "border-destructive" : ""}
                  required
                />
                {errors.stock_quantity && (
                  <p className="text-sm text-destructive">
                    {errors.stock_quantity}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
                <Input
                  id="low_stock_threshold"
                  type="number"
                  min="0"
                  value={formData.low_stock_threshold}
                  onChange={(e) =>
                    handleInputChange(
                      "low_stock_threshold",
                      parseInt(e.target.value) || 10,
                    )
                  }
                  placeholder="10"
                  className={
                    errors.low_stock_threshold ? "border-destructive" : ""
                  }
                />
                {errors.low_stock_threshold && (
                  <p className="text-sm text-destructive">
                    {errors.low_stock_threshold}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Product Flags */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Product Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    handleInputChange("is_active", checked as boolean)
                  }
                />
                <Label htmlFor="is_active">Active Product</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_best_seller"
                  checked={formData.is_best_seller}
                  onCheckedChange={(checked) =>
                    handleInputChange("is_best_seller", checked as boolean)
                  }
                />
                <Label htmlFor="is_best_seller">Best Seller</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requires_prescription"
                  checked={formData.requires_prescription}
                  onCheckedChange={(checked) =>
                    handleInputChange(
                      "requires_prescription",
                      checked as boolean,
                    )
                  }
                />
                <Label htmlFor="requires_prescription">
                  Requires Prescription
                </Label>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="border border-border"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || isImageUploading}>
              {loading
                ? "Saving..."
                : isImageUploading
                  ? "Uploading Image..."
                  : product
                    ? "Update Product"
                    : "Create Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
