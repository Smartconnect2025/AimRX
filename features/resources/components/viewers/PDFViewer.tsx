import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, X } from "lucide-react";

interface PDFViewerProps {
  title: string;
  url: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PDFViewer = ({
  title,
  url,
  open,
  onOpenChange,
}: PDFViewerProps) => {
  const [zoom, setZoom] = React.useState(1);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 2));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="h-[85vh] w-full sm:max-w-full">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <div className="flex items-center gap-2 mt-2">
            <Button variant="outline" size="icon" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm">{Math.round(zoom * 100)}%</span>
            <Button variant="outline" size="icon" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 p-4 overflow-auto">
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top center",
            }}
          >
            <iframe
              src={url}
              title={title}
              className="w-full h-[60vh] border-0"
            />
          </div>
        </div>

        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline" className="border border-border">
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
