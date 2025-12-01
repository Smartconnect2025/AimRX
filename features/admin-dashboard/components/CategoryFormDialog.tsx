"use client";

import React, { useState, useEffect } from "react";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Category } from "../types";

interface CategoryFormData {
  name: string;
  slug: string;
}

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  onSubmit: (data: CategoryFormData) => Promise<void>;
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSubmit,
}: CategoryFormDialogProps) {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    slug: "",
  });

  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState<string>("");

  // Reset form when category changes or dialog opens/closes
  useEffect(() => {
    if (category) {
      // Editing existing category
      setFormData({
        name: category.name,
        slug: category.slug,
      });
    } else {
      // Creating new category - reset to default values
      setFormData({
        name: "",
        slug: "",
      });
    }
    setNameError("");
  }, [category, open]);

  const handleInputChange = (field: keyof CategoryFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (name: string) => {
    handleInputChange("name", name);
    if (!category) {
      // Auto-generate slug for new categories
      handleInputChange("slug", generateSlug(name));
    }
    // Clear name error when user starts typing
    if (nameError) {
      setNameError("");
    }
  };

  const validateName = async (name: string) => {
    if (!name.trim()) {
      setNameError("Category name is required");
      return false;
    }

    // Check for duplicate names (only for new categories)
    if (!category) {
      try {
        const response = await fetch("/api/admin/categories");
        if (response.ok) {
          const data = await response.json();
          const existingCategory = data.categories.find(
            (cat: Category) => cat.name.toLowerCase() === name.toLowerCase(),
          );
          if (existingCategory) {
            setNameError("A category with this name already exists");
            return false;
          }
        }
      } catch (error) {
        console.error("Error validating category name:", error);
        // Don't block submission on validation error
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate name
    const isNameValid = await validateName(formData.name);
    if (!isNameValid) {
      return;
    }

    // Ensure slug is generated
    const finalFormData = {
      ...formData,
      slug: formData.slug || generateSlug(formData.name),
    };

    setLoading(true);
    try {
      await onSubmit(finalFormData);
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting form:", error);
      // Handle specific error messages from the API
      if (error instanceof Error && error.message.includes("duplicate")) {
        setNameError("A category with this name already exists");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {category ? "Edit Category" : "Create New Category"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Category Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter category name"
              required
              className={nameError ? "border-red-500" : ""}
            />
            {nameError && <p className="text-sm text-red-500">{nameError}</p>}
          </div>

          {/* Slug is auto-generated and hidden from UI */}

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
            <Button type="submit" disabled={loading}>
              {loading
                ? "Saving..."
                : category
                  ? "Update Category"
                  : "Create Category"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
