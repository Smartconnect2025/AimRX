import { ArrowLeft } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TextViewerProps {
  title: string;
  content: string;
}

export const TextViewer = ({ title, content }: TextViewerProps) => {
  const processedContent = content.split("\n\n").map((paragraph) => (
    <p key={paragraph.slice(0, 32) + paragraph.length} className="mb-4">
      {paragraph}
    </p>
  ));

  return (
    <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
      </DialogHeader>

      <div className="mt-4 prose prose-sm max-w-none">{processedContent}</div>

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
