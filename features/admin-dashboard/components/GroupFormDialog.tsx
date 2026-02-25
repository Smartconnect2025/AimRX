"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Group {
  id: string;
  name: string;
  platform_manager: string | null;
}

interface GroupFormData {
  name: string;
  platformManager: string;
}

interface GroupFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  editingGroup?: Group | null;
}

export function GroupFormDialog({
  open,
  onOpenChange,
  onSuccess,
  editingGroup,
}: GroupFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<GroupFormData>({
    name: "",
    platformManager: "",
  });

  useEffect(() => {
    if (editingGroup) {
      setFormData({
        name: editingGroup.name,
        platformManager: editingGroup.platform_manager || "",
      });
    } else {
      setFormData({
        name: "",
        platformManager: "",
      });
    }
  }, [editingGroup, open]);

  const handleInputChange = (field: keyof GroupFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingGroup
        ? `/api/admin/groups/${editingGroup.id}`
        : "/api/admin/groups";

      const method = editingGroup ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(
          editingGroup
            ? "Group updated successfully"
            : "Group created successfully",
        );
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to save group");
      }
    } catch (error) {
      console.error("Error saving group:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border border-border">
        <DialogHeader>
          <DialogTitle>
            {editingGroup ? "Edit Group" : "Create New Group"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Group Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
              placeholder="Enter group name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="platformManager">Platform Manager</Label>
            <Input
              id="platformManager"
              value={formData.platformManager}
              onChange={(e) =>
                handleInputChange("platformManager", e.target.value)
              }
              placeholder="Enter platform manager name"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border border-border"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? editingGroup
                  ? "Updating..."
                  : "Creating..."
                : editingGroup
                  ? "Update Group"
                  : "Create Group"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
