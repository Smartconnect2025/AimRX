"use client";

import { useState } from "react";
import { FileText, FileVideo, ExternalLink, Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatResourceDate } from "../utils/formatResourceDate";
import type { Resource, ResourceType } from "../types";

interface ResourceViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: Resource | null;
}

export function ResourceViewDialog({
  open,
  onOpenChange,
  resource,
}: ResourceViewDialogProps) {
  const [imageError, setImageError] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

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

  if (!resource) return null;

  const getTypeIcon = (type: ResourceType) => {
    switch (type) {
      case "PDF":
        return <FileText size={20} />;
      case "Article":
        return <FileText size={20} />;
      case "Text Content":
        return <FileText size={20} />;
      case "Video":
        return <FileVideo size={20} />;
      case "Link":
        return <ExternalLink size={20} />;
      default:
        return <FileText size={20} />;
    }
  };

  const getTypeColor = (type: ResourceType) => {
    switch (type) {
      case "PDF":
        return "bg-red-100 text-red-800";
      case "Article":
        return "bg-blue-100 text-blue-800";
      case "Text Content":
        return "bg-indigo-100 text-indigo-800";
      case "Video":
        return "bg-purple-100 text-purple-800";
      case "Link":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleUrlClick = (url: string) => {
    if (url) {
      window.open(url, "_blank");
    }
  };

  const formatUrl = (url: string) => {
    if (url.length > 50) {
      return url.substring(0, 47) + "...";
    }
    return url;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTypeIcon(resource.type as ResourceType)}
            Resource Details
          </DialogTitle>
          <DialogDescription>
            View detailed information about this resource
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cover Image */}
          {resource.cover_src && !imageError && (
            <div className="relative">
              <img
                src={resource.cover_src}
                alt={resource.title}
                className="w-full h-64 object-cover rounded-lg border"
                onError={() => setImageError(true)}
              />
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {resource.title}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {resource.description}
              </p>
            </div>

            {/* Resource Type Badge */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Type:</span>
              <Badge
                variant="outline"
                className={`flex items-center gap-2 ${getTypeColor(resource.type as ResourceType)}`}
              >
                {getTypeIcon(resource.type as ResourceType)}
                {resource.type}
              </Badge>
            </div>

            {/* URL Section */}
            {resource.url &&
              resource.type !== "PDF" &&
              resource.type !== "Text Content" && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    URL:
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUrlClick(resource.url!)}
                    className="h-auto p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    <span className="text-sm">{formatUrl(resource.url)}</span>
                  </Button>
                </div>
              )}

            {/* Text Content Section */}
            {resource.type === "Text Content" && resource.content && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    Content:
                  </span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: resource.content }}
                  />
                </div>
              </div>
            )}

            {/* PDF Preview */}
            {resource.type === "PDF" && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  PDF Preview
                </h3>
                {(() => {
                  if (!resource.url) {
                    return (
                      <div className="bg-gray-50 p-4 rounded-lg border text-sm text-gray-600">
                        PDF URL is missing.
                      </div>
                    );
                  }
                  try {
                    // Validate URL

                    new URL(resource.url);
                  } catch {
                    return (
                      <div className="bg-gray-50 p-4 rounded-lg border text-sm text-gray-600">
                        Invalid PDF URL.
                      </div>
                    );
                  }
                  return (
                    <div
                      className="bg-white rounded-lg border overflow-hidden"
                      style={{ height: "70vh" }}
                    >
                      {!pdfError ? (
                        <iframe
                          src={resource.url}
                          className="w-full h-full"
                          title={resource.title}
                          onError={() =>
                            setPdfError("Failed to load PDF preview.")
                          }
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-sm text-gray-600">
                          {pdfError}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Tags */}
            {resource.tags && resource.tags.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Tags:
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {resource.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Created Date */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                Created:
              </span>
              <span className="text-sm text-gray-600">
                {formatResourceDate(resource.created_at)}
              </span>
            </div>
          </div>

          {/* Content Preview for Article */}
          {resource.type === "Article" && resource.url && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Content Preview
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <p className="text-sm text-gray-600 italic">
                  Content preview would be displayed here for Article resources.
                  This would show the actual article content or a preview of the
                  rich text.
                </p>
              </div>
            </div>
          )}

          {/* Video Preview for Video Content */}
          {resource.type === "Video" && resource.url && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Video Preview
              </h3>
              {(() => {
                const value = resource.url as string;
                if (isYouTubeUrl(value)) {
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
                    <div className="bg-white rounded-lg border overflow-hidden">
                      <div className="aspect-video w-full">
                        <iframe
                          className="w-full h-full"
                          src={embed}
                          title="YouTube video preview"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg border text-sm text-gray-600">
                      Unable to parse YouTube link.
                    </div>
                  );
                }
                return (
                  <div className="bg-gray-50 p-4 rounded-lg border text-sm text-gray-600">
                    Embedded preview is available for YouTube links. Use the
                    Open Resource button to view.
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Dialog Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border border-border"
          >
            Close
          </Button>
          {resource.url && resource.type !== "PDF" && (
            <Button
              onClick={() => handleUrlClick(resource.url!)}
              className="bg-primary hover:bg-primary/90"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Resource
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
