import { ArrowLeft } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface VideoViewerProps {
  title: string;
  url: string;
  description?: string;
}

export const VideoViewer = ({ title, url, description }: VideoViewerProps) => {
  return (
    <DialogContent className="sm:max-w-[800px]">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
        {description && (
          <DialogDescription className="text-sm text-muted-foreground">
            {description}
          </DialogDescription>
        )}
      </DialogHeader>

      <div className="mt-4 aspect-video w-full">
        <iframe
          src={url}
          title={title}
          className="w-full h-full border-0 rounded-md"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <div className="mt-6 flex justify-start">
        <DialogClose asChild>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </DialogClose>
      </div>
    </DialogContent>
  );
};
