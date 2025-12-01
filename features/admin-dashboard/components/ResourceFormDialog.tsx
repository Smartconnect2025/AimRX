"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  X,
  FileText,
  FileVideo,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RichTextEditor } from "./RichTextEditor";
import type { Resource, ResourceType, Tag } from "../types";
import { createClient as createSupabaseClient } from "@/core/supabase";

const isValidHttpUrl = (value?: string) => {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const isYouTubeUrl = (value?: string) => {
  if (!value) return false;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "m.youtube.com") {
      return url.pathname === "/watch" && url.searchParams.has("v");
    }
    if (host === "youtu.be") {
      return url.pathname.length > 1;
    }
    return false;
  } catch {
    return false;
  }
};

const resourceFormSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    url: z.string().optional(),
    content: z.string().optional(),
    type: z.enum(["PDF", "Article", "Video", "Link", "Text Content"] as const),
    tags: z.array(z.string().min(1, "Tag cannot be empty")),
    cover_src: z.string().optional(),
  })
  .refine(
    (data) => {
      // URL is required for Video and Link types
      if (["Video", "Link"].includes(data.type) && !data.url) {
        return false;
      }
      // URL must be valid for Video and Link when provided
      if (
        ["Video", "Link"].includes(data.type) &&
        data.url &&
        !isValidHttpUrl(data.url)
      ) {
        return false;
      }
      // Content is required for Text Content type
      if (data.type === "Text Content" && !data.content) {
        return false;
      }
      // For PDF and Article, URL is optional
      return true;
    },
    {
      message:
        "Provide a valid URL for Video/Link; Content is required for Text Content",
      path: ["url", "content"],
    },
  );

export type ResourceFormData = z.infer<typeof resourceFormSchema>;

interface ResourceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource?: Resource | null;
  onSubmit: (data: ResourceFormData) => void;
}

export function ResourceFormDialog({
  open,
  onOpenChange,
  resource,
  onSubmit,
}: ResourceFormDialogProps) {
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfInfo, setPdfInfo] = useState<{
    name: string;
    sizeLabel: string;
  } | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<ResourceFormData>({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: {
      title: "",
      description: "",
      url: "",
      content: "",
      type: "Article",
      tags: [],
      cover_src: "",
    },
    mode: "onSubmit", // Only validate on form submission
  });

  const [localTags, setLocalTags] = useState<string[]>([]);

  // Fetch available tags
  const fetchAvailableTags = async () => {
    try {
      setIsLoadingTags(true);
      const response = await fetch("/api/admin/tags?limit=100"); // Get all tags
      if (response.ok) {
        const data = await response.json();
        setAvailableTags(data.tags || []);
      }
    } catch (error) {
      console.error("Error fetching tags:", error);
      toast.error("Failed to load available tags");
    } finally {
      setIsLoadingTags(false);
    }
  };

  // Reset form when dialog opens/closes or resource changes
  useEffect(() => {
    if (open) {
      // Fetch available tags when dialog opens
      fetchAvailableTags();

      if (resource) {
        // Editing existing resource
        form.reset({
          title: resource.title || "",
          description: resource.description || "",
          url: resource.url || "",
          content: resource.content || "",
          type: (resource.type as ResourceType) || "Article",
          tags: resource.tags || [],
          cover_src: resource.cover_src || "",
        });
        setLocalTags(resource.tags || []);
        setCoverPreview(resource.cover_src || null);
        setCoverFile(null);
        if ((resource.type as ResourceType) === "PDF" && resource.url) {
          try {
            const u = new URL(resource.url);
            const name = decodeURIComponent(
              u.pathname.split("/").pop() || "document.pdf",
            );
            setPdfInfo({ name, sizeLabel: "(stored)" });
          } catch {
            setPdfInfo({ name: resource.url, sizeLabel: "(stored)" });
          }
        } else {
          setPdfInfo(null);
        }
        setPdfFile(null);
      } else {
        // Creating new resource
        form.reset({
          title: "",
          description: "",
          url: "",
          content: "",
          type: "Article",
          tags: [],
          cover_src: "",
        });
        setLocalTags([]);
        setCoverPreview(null);
        setCoverFile(null);
        setPdfFile(null);
        setPdfInfo(null);
      }
    }
  }, [open, resource, form]);

  const handleCoverFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type (JPG, PNG, WebP only)
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please select a JPG, PNG, or WebP image file");
      if (coverInputRef.current) coverInputRef.current.value = "";
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size must be less than 5MB");
      if (coverInputRef.current) coverInputRef.current.value = "";
      return;
    }

    // Validate image dimensions
    const img = new Image();
    img.onload = () => {
      const aspectRatio = img.width / img.height;
      const targetRatio = 16 / 9; // 1200x630 ratio
      const tolerance = 0.1; // 10% tolerance

      if (Math.abs(aspectRatio - targetRatio) > tolerance) {
        toast.error(
          "Image should have a 16:9 aspect ratio (recommended: 1200x630px)",
        );
        if (coverInputRef.current) coverInputRef.current.value = "";
        return;
      }

      if (img.width < 800 || img.height < 450) {
        toast.error("Image should be at least 800x450px for best quality");
        if (coverInputRef.current) coverInputRef.current.value = "";
        return;
      }

      setCoverFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    };

    img.onerror = () => {
      toast.error("Invalid image file");
      if (coverInputRef.current) coverInputRef.current.value = "";
      return;
    };

    img.src = URL.createObjectURL(file);
  };

  const handleAddTag = (tagName: string) => {
    if (tagName && !localTags.includes(tagName)) {
      setLocalTags([...localTags, tagName]);
    }
  };

  const handleRemoveTag = (index: number) => {
    setLocalTags(localTags.filter((_, i) => i !== index));
  };

  // Get available tags that are not already selected
  const availableTagsToShow = availableTags.filter(
    (tag) => !localTags.includes(tag.name),
  );

  const handleSubmit = async (data: ResourceFormData) => {
    try {
      setIsUploading(true);

      // Handle cover image upload if there's a new file
      if (coverFile) {
        // In a real implementation, you would upload to Supabase Storage here
        // For now, we'll use the preview URL as a placeholder
        data.cover_src = coverPreview || "";
      }

      // For PDF resources, upload file to Supabase Storage if selected
      if (data.type === "PDF") {
        const supabase = createSupabaseClient();
        if (pdfFile) {
          const slugify = (s: string) =>
            s
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)+/g, "");
          const filename = `${slugify(data.title || "document")}-${Date.now()}.pdf`;
          const filePath = `resources/pdfs/${filename}`;
          const { error: uploadError } = await supabase.storage
            .from("resources")
            .upload(filePath, pdfFile, {
              contentType: "application/pdf",
              upsert: true,
            });
          if (uploadError) {
            console.error("PDF upload error:", uploadError);
            toast.error("Failed to upload PDF");
            return;
          }
          const { data: pub } = supabase.storage
            .from("resources")
            .getPublicUrl(filePath);
          data.url = pub.publicUrl;
        }
      }

      // Include the local tags in the submission
      const submissionData = {
        ...data,
        tags: localTags,
      };

      await onSubmit(submissionData);
      toast.success(
        resource
          ? "Resource updated successfully"
          : "Resource created successfully",
      );
    } catch (error) {
      console.error("Error saving resource:", error);
      toast.error("Failed to save resource");
    } finally {
      setIsUploading(false);
    }
  };

  const getTypeIcon = (type: ResourceType) => {
    switch (type) {
      case "PDF":
        return <FileText size={16} />;
      case "Article":
        return <FileText size={16} />;
      case "Text Content":
        return <FileText size={16} />;
      case "Video":
        return <FileVideo size={16} />;
      case "Link":
        return <ExternalLink size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border border-border">
        <DialogHeader>
          <DialogTitle>
            {resource ? "Edit Resource" : "Create New Resource"}
          </DialogTitle>
          <DialogDescription>
            {resource
              ? "Update the resource information below"
              : "Fill in the details to create a new educational resource"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input
                {...form.register("title")}
                placeholder="Enter resource title"
                className="mt-1"
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Description *</label>
              <Textarea
                {...form.register("description")}
                placeholder="Enter resource description"
                className="mt-1"
                rows={3}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Resource Type *</label>
              <Select
                value={form.watch("type")}
                onValueChange={(value) =>
                  form.setValue("type", value as ResourceType, {
                    shouldValidate: false,
                  })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["PDF", "Article", "Text Content", "Video", "Link"].map(
                    (type) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(type as ResourceType)}
                          {type}
                        </div>
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* URL Field - Hidden for Text Content and PDF */}
            {form.watch("type") !== "Text Content" &&
              form.watch("type") !== "PDF" && (
                <div>
                  <label className="text-sm font-medium">
                    URL {["Video", "Link"].includes(form.watch("type")) && "*"}
                  </label>
                  <Input
                    {...form.register("url")}
                    placeholder={
                      form.watch("type") === "Article"
                        ? "Enter article URL (optional)"
                        : "Enter resource URL"
                    }
                    className="mt-1"
                  />
                  {form.formState.errors.url && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.url.message}
                    </p>
                  )}
                </div>
              )}

            {/* PDF Upload for PDF type */}
            {form.watch("type") === "PDF" && (
              <div>
                <label className="text-sm font-medium">PDF File</label>
                <div className="mt-1 flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      // Check file size (50MB limit)
                      if (file.size > 50 * 1024 * 1024) {
                        toast.error("PDF file size must be less than 50MB");
                        // Clear the input
                        e.target.value = "";
                        return;
                      }

                      setPdfFile(file);
                      setPdfInfo({
                        name: file.name,
                        sizeLabel: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
                      });
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPdfFile(null);
                      setPdfInfo(null);
                      // Clear the file input
                      const fileInput = document.querySelector(
                        'input[type="file"][accept=".pdf"]',
                      ) as HTMLInputElement;
                      if (fileInput) fileInput.value = "";
                    }}
                  >
                    Clear
                  </Button>
                </div>
                {pdfInfo && (
                  <p className="text-xs text-gray-600 mt-1">
                    Selected: <strong>{pdfInfo.name}</strong>{" "}
                    {pdfInfo.sizeLabel}
                  </p>
                )}
                {!pdfInfo && resource?.url && (
                  <p className="text-xs text-gray-600 mt-1">
                    Current: <strong>PDF file</strong>
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  <strong>Maximum file size:</strong> 50MB
                </p>
              </div>
            )}

            {/* Rich Text Editor for Text Content type */}
            {form.watch("type") === "Text Content" && (
              <div>
                <label className="text-sm font-medium">Content *</label>
                <div className="mt-1">
                  <RichTextEditor
                    value={form.watch("content") || ""}
                    onChange={(content) =>
                      form.setValue("content", content, {
                        shouldValidate: false,
                      })
                    }
                    placeholder="Enter your rich text content here..."
                    className="min-h-[200px]"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use the toolbar above to format your content. You can add
                    headers, lists, links, images, tables, and code blocks.
                  </p>
                  {form.formState.errors.content && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.content.message}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* Video Preview for YouTube URLs */}
          {form.watch("type") === "Video" &&
            form.watch("url") &&
            isYouTubeUrl(form.watch("url")) && (
              <div className="mt-2">
                <label className="text-sm font-medium">Preview</label>
                <div className="mt-1 aspect-video w-full">
                  {(() => {
                    const value = form.watch("url") as string;
                    let videoId = "";
                    try {
                      const u = new URL(value);
                      const host = u.hostname.replace(/^www\./, "");
                      if (host === "youtube.com" || host === "m.youtube.com") {
                        videoId = u.searchParams.get("v") || "";
                      } else if (host === "youtu.be") {
                        videoId = u.pathname.slice(1);
                      }
                    } catch {}
                    const embed = videoId
                      ? `https://www.youtube.com/embed/${videoId}`
                      : undefined;
                    return embed ? (
                      <iframe
                        className="w-full h-full rounded-md border"
                        src={embed}
                        title="YouTube video preview"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    ) : null;
                  })()}
                </div>
              </div>
            )}

          {/* Cover Image */}
          <div>
            <label className="text-sm font-medium">Cover Image</label>
            <div className="mt-1 space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleCoverFileChange}
                  ref={coverInputRef}
                  className="flex-1"
                />
                {(coverPreview || coverFile) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCoverFile(null);
                      setCoverPreview(null);
                      form.setValue("cover_src", "");
                      // Clear the file input
                      if (coverInputRef.current)
                        coverInputRef.current.value = "";
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {coverPreview && (
                <div className="relative">
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    className="w-32 h-18 object-cover rounded-lg border"
                  />
                </div>
              )}

              <div className="space-y-1">
                <p className="text-xs text-gray-500">
                  <strong>Recommended:</strong> 1200x630px (16:9 landscape
                  ratio)
                </p>
                <p className="text-xs text-gray-500">
                  <strong>Formats:</strong> JPG, PNG, WebP •{" "}
                  <strong>Max size:</strong> 5MB
                </p>
                <p className="text-xs text-gray-500">
                  <strong>Minimum:</strong> 800x450px for best quality
                </p>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium">Tags</label>
            <div className="mt-1 space-y-3">
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 justify-between border border-border"
                      disabled={
                        isLoadingTags || availableTagsToShow.length === 0
                      }
                    >
                      {isLoadingTags
                        ? "Loading tags..."
                        : availableTagsToShow.length === 0
                          ? "No tags available"
                          : "Select a tag"}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full max-h-60 overflow-y-auto">
                    {availableTagsToShow.map((tag) => (
                      <DropdownMenuItem
                        key={tag.id}
                        onClick={() => handleAddTag(tag.name)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{tag.name}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({tag.usage_count} uses)
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {localTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {localTags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(index)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border border-border"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUploading || !form.formState.isValid}
              className="bg-primary hover:bg-primary/90"
            >
              {isUploading
                ? "Saving..."
                : resource
                  ? "Update Resource"
                  : "Create Resource"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
