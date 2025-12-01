"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  Package,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Copy,
  ExternalLink,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { useAdminProducts } from "../hooks/useAdminProducts";
import type { Product, ProductFormData } from "../types";
import { ProductFormDialog } from "./ProductFormDialog";
import { getStockStatus } from "@/features/product-catalog/utils";
import { ProductCard } from "@/features/product-catalog/components/product/ProductCard";
import { generateProductUrl } from "@/features/admin-dashboard/utils/urlGenerator";
import {
  deleteImage,
  isSupabaseStorageUrl,
} from "@/core/services/imageUploadService";

export function ProductsTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [urlCopied, setUrlCopied] = useState<string | null>(null);

  const {
    products,
    categories,
    loading,
    currentPage,
    totalCount,
    pageSize,
    createProduct,
    updateProduct,
    deleteProduct,
    refreshProducts,
    handlePageChange,
    fetchProducts,
    bulkUpdateProducts,
  } = useAdminProducts();

  // Debounced search effect to prevent excessive API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const filters = {
        search: searchTerm,
        category_id:
          selectedCategories.length > 0
            ? selectedCategories.join(",")
            : undefined,
      };

      // Reset to first page when filters change
      fetchProducts(1, filters);
      if (currentPage !== 1) {
        handlePageChange(1);
      }
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timeoutId);
  }, [
    searchTerm,
    selectedCategories,
    fetchProducts,
    currentPage,
    handlePageChange,
  ]);

  const handleFormSubmit = async (data: ProductFormData) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
      } else {
        // Add required database fields that are no longer in the form
        const createData = {
          ...data,
          active_ingredient: "", // Default empty - managed by Stripe
          benefits: "", // Default empty - managed by Stripe
          safety_info: "", // Default empty - managed by Stripe
          subscription_price: 0, // Default 0 - pricing managed by Stripe
          subscription_price_discounted: 0, // Default 0 - pricing managed by Stripe
        };
        await createProduct(createData);
      }
      setIsFormOpen(false);
      setEditingProduct(null);
      refreshProducts();
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    try {
      // Delete associated image from storage if it exists
      if (
        deletingProduct.image_url &&
        isSupabaseStorageUrl(deletingProduct.image_url)
      ) {
        try {
          await deleteImage(deletingProduct.image_url, "products");
        } catch (error) {
          console.error("Failed to delete image from storage:", error);
          // Continue with product deletion even if image deletion fails
        }
      }

      await deleteProduct(deletingProduct.id);
      setDeletingProduct(null);
      refreshProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const handleBulkStatusUpdate = async (isActive: boolean) => {
    if (selectedProducts.length === 0) return;
    try {
      await bulkUpdateProducts(selectedProducts, { is_active: isActive });
      setSelectedProducts([]);
      refreshProducts();
    } catch (error) {
      console.error("Error updating products:", error);
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, productId]);
    } else {
      setSelectedProducts(selectedProducts.filter((id) => id !== productId));
    }
  };

  const handleBestSellerToggle = async (
    product: Product,
    isBestSeller: boolean,
  ) => {
    try {
      await updateProduct(product.id, {
        is_best_seller: isBestSeller,
      });
      refreshProducts();
    } catch (error) {
      console.error("Error updating best seller status:", error);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(products.map((p) => p.id.toString()));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleCopyUrl = async (product: Product) => {
    const url = `${generateProductUrl(product.slug)}?admin=true`;
    try {
      await navigator.clipboard.writeText(url);
      setUrlCopied(product.id.toString());
      setTimeout(() => setUrlCopied(null), 2000);
    } catch (error) {
      console.error("Failed to copy URL:", error);
    }
  };

  const activeFiltersCount = selectedCategories.length;
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Products</h2>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full sm:w-auto border border-border"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filter
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 border border-border">
            <div className="space-y-4">
              <h4 className="font-medium">Categories</h4>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`category-${category.id}`}
                      checked={selectedCategories.includes(category.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedCategories([
                            ...selectedCategories,
                            category.id,
                          ]);
                        } else {
                          setSelectedCategories(
                            selectedCategories.filter(
                              (id) => id !== category.id,
                            ),
                          );
                        }
                      }}
                    />
                    <label
                      htmlFor={`category-${category.id}`}
                      className="text-sm"
                    >
                      {category.name}
                    </label>
                  </div>
                ))}
              </div>
              {activeFiltersCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCategories([])}
                  className="w-full border border-border"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedProducts.length} products selected
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkStatusUpdate(true)}
                  className="border border-border"
                >
                  Activate Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkStatusUpdate(false)}
                  className="border border-border"
                >
                  Deactivate Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedProducts([])}
                  className="border border-border"
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-4 p-6">
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                  <div className="text-muted-foreground">
                    Loading products...
                  </div>
                </div>
              </div>
              {/* Skeleton rows */}
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4">
                  <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                  <div className="h-12 w-12 bg-muted rounded animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                  </div>
                  <div className="h-6 bg-muted rounded animate-pulse w-16" />
                  <div className="h-4 bg-muted rounded animate-pulse w-20" />
                  <div className="h-6 bg-muted rounded animate-pulse w-16" />
                  <div className="h-6 bg-muted rounded animate-pulse w-12" />
                  <div className="h-8 bg-muted rounded animate-pulse w-8" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground/30" />
              <h3 className="mt-4 text-lg font-semibold">No products found</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedCategories.length > 0
                  ? "Try adjusting your search or filters"
                  : "Get started by creating your first product"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 !px-4">
                      <Checkbox
                        checked={selectedProducts.length === products.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="min-w-[80px]">Cover Image</TableHead>
                    <TableHead className="min-w-[200px]">
                      Product Title
                    </TableHead>
                    <TableHead className="min-w-[120px] hidden sm:table-cell">
                      Category
                    </TableHead>
                    <TableHead className="min-w-[120px] hidden md:table-cell">
                      Price
                    </TableHead>
                    <TableHead className="min-w-[80px] hidden lg:table-cell">
                      Stock
                    </TableHead>
                    <TableHead className="min-w-[100px] hidden lg:table-cell">
                      Best Seller
                    </TableHead>
                    {/* <TableHead className="min-w-[80px] hidden sm:table-cell">Status</TableHead> */}
                    <TableHead className="w-32 !px-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => {
                    const stockStatus = getStockStatus(product.stock_quantity);
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="!ps-4">
                          <Checkbox
                            checked={selectedProducts.includes(
                              product.id.toString(),
                            )}
                            onCheckedChange={(checked) =>
                              handleSelectProduct(
                                product.id.toString(),
                                checked as boolean,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="h-12 w-12 rounded-md border border-border bg-muted flex items-center justify-center overflow-hidden">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {product.slug}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline">
                            {product.category_name || "Uncategorized"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {product.lowest_stripe_price ? (
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {product.lowest_stripe_price.formatted}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {product.lowest_stripe_price.isSubscription
                                  ? "Subscription"
                                  : "One-time"}
                              </span>
                              {product.stripe_prices &&
                                product.stripe_prices.length > 1 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{product.stripe_prices.length - 1} more
                                    options
                                  </span>
                                )}
                            </div>
                          ) : (
                            <div className="flex flex-col">
                              <span className="font-medium text-muted-foreground">
                                No pricing
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {product.stripe_product_id
                                  ? "Not synced"
                                  : "Not configured"}
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              style={{
                                color: stockStatus.color,
                                borderColor: stockStatus.color,
                              }}
                            >
                              {product.stock_quantity}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {stockStatus.label}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={product.is_best_seller}
                              onCheckedChange={(checked) =>
                                handleBestSellerToggle(product, checked)
                              }
                            />
                            <span className="text-sm text-muted-foreground">
                              {product.is_best_seller
                                ? "Best Seller"
                                : "Regular"}
                            </span>
                          </div>
                        </TableCell>
                        {/* <TableCell className="hidden sm:table-cell">
                        <Switch
                          checked={product.is_active}
                          onCheckedChange={async (checked) => {
                            try {
                              await updateProduct(product.id, {
                                is_active: checked,
                              });
                              refreshProducts();
                            } catch (error) {
                              console.error(
                                "Error updating product status:",
                                error,
                              );
                            }
                          }}
                        />
                      </TableCell> */}
                        <TableCell className="!pe-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-gray-100"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-40 border border-border"
                            >
                              <DropdownMenuItem
                                onClick={() => setPreviewProduct(product)}
                                className="cursor-pointer"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEdit(product)}
                                className="cursor-pointer"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Product
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleCopyUrl(product)}
                                className="cursor-pointer"
                              >
                                {urlCopied === product.id.toString() ? (
                                  <Check className="h-4 w-4 mr-2" />
                                ) : (
                                  <Copy className="h-4 w-4 mr-2" />
                                )}
                                {urlCopied === product.id.toString()
                                  ? "Copied!"
                                  : "Copy URL"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  window.open(
                                    `${generateProductUrl(product.slug)}?admin=true`,
                                    "_blank",
                                  )
                                }
                                className="cursor-pointer"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open in New Tab
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeletingProduct(product)}
                                className="cursor-pointer text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Product
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, totalCount)} of {totalCount}{" "}
            products
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="border border-border"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = Math.max(1, currentPage - 2) + i;
                if (page > totalPages) return null;
                return (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className={
                      page !== currentPage ? "border border-border" : ""
                    }
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="border border-border"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <ProductFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        product={editingProduct}
        categories={categories}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingProduct}
        onOpenChange={() => setDeletingProduct(null)}
      >
        <AlertDialogContent className="bg-white border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deletingProduct?.name}
              &rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border border-border">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Product Preview */}
      {previewProduct && (
        <Dialog
          open={!!previewProduct}
          onOpenChange={() => setPreviewProduct(null)}
        >
          <DialogContent className="max-w-md bg-white border border-border">
            <DialogHeader>
              <DialogTitle>Product Preview</DialogTitle>
            </DialogHeader>
            <ProductCard
              product={{
                ...previewProduct,
                // Ensure image_url is valid or null to prevent Next.js Image errors
                image_url:
                  previewProduct.image_url &&
                  (previewProduct.image_url.startsWith("http") ||
                    previewProduct.image_url.startsWith("/"))
                    ? previewProduct.image_url
                    : null,
              }}
              showCategory={true}
              className="border-0 shadow-none bg-white"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
