"use client";

import { Download, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DocumentType {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  size: string;
  url: string;
}

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentType | null;
}

export function DocumentViewer({
  isOpen,
  onClose,
  document,
}: DocumentViewerProps) {
  const [imageZoom, setImageZoom] = useState(100);
  const [imageRotation, setImageRotation] = useState(0);

  const handleZoomIn = () => {
    setImageZoom((prev) => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setImageZoom((prev) => Math.max(prev - 25, 25));
  };

  const handleRotate = () => {
    setImageRotation((prev) => (prev + 90) % 360);
  };

  const handleDownload = () => {
    if (!document) return;

    const link = window.document.createElement("a");
    link.href = document.url;
    link.download = document.name;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    toast.success("Download started");
  };

  const handleClose = () => {
    setImageZoom(100);
    setImageRotation(0);
    onClose();
  };

  const formatUploadDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[95vh] p-0 bg-white">
        <DialogHeader className="p-6 pb-4 border-b bg-white">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              {document?.name}
            </DialogTitle>
            <div className="flex items-center space-x-2 pr-4">
              {document?.type === "image" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomOut}
                    disabled={imageZoom <= 25}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-600 min-w-[60px] text-center">
                    {imageZoom}%
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomIn}
                    disabled={imageZoom >= 300}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleRotate}>
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-6 bg-white">
          {document && (
            <>
              {document.type === "pdf" && (
                <div className="w-full h-[70vh] bg-white">
                  <iframe
                    src={document.url}
                    className="w-full h-full border-0 rounded-lg"
                    title={document.name}
                  />
                </div>
              )}

              {document.type === "image" && (
                <div className="flex justify-center items-center min-h-[60vh] bg-gray-50 rounded-lg overflow-auto">
                  <div className="inline-block min-w-min">
                    <img
                      src={document.url}
                      alt={document.name}
                      className="transition-transform duration-200"
                      style={{
                        transform: `scale(${
                          imageZoom / 100
                        }) rotate(${imageRotation}deg)`,
                        transformOrigin: "center",
                        imageRendering: "crisp-edges",
                        maxWidth: "none",
                        height: "auto",
                      }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-4 border-t bg-white text-sm text-gray-600">
          <div className="flex justify-between items-center">
            <span>
              Uploaded on {document && formatUploadDate(document.uploadDate)}
            </span>
            <span>{document?.size}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
