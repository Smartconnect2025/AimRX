"use client";

import React, { useRef, useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import SignatureCanvas from "react-signature-canvas";

import { Button } from "@/components/ui/button";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Trash2 } from "lucide-react";

import { ProfileFormValues } from "./types";

interface SignatureSectionProps {
  form: UseFormReturn<ProfileFormValues>;
}

export const SignatureSection: React.FC<SignatureSectionProps> = ({ form }) => {
  const sigRef = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isCanvasReady, setIsCanvasReady] = useState(false);

  const currentSignature = form.watch("signatureUrl");

  // Sync canvas internal resolution with its CSS size (run once on mount)
  useEffect(() => {
    const setupCanvas = () => {
      const canvas = sigRef.current?.getCanvas();
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;

      // Set internal resolution to match display size
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;

      const ctx = canvas.getContext("2d");
      ctx?.scale(ratio, ratio);

      setIsCanvasReady(true);
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(setupCanvas, 50);
    window.addEventListener("resize", setupCanvas);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", setupCanvas);
    };
  }, []);

  // Load existing signature after canvas is ready
  useEffect(() => {
    if (!isCanvasReady || !currentSignature || !sigRef.current) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    sigRef.current.fromDataURL(currentSignature, {
      width: rect.width,
      height: rect.height,
    });
    setIsEmpty(false);
  }, [isCanvasReady, currentSignature]);

  const handleClear = () => {
    sigRef.current?.clear();
    form.setValue("signatureUrl", "", { shouldDirty: true });
    setIsEmpty(true);
  };

  const handleEnd = () => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      const dataUrl = sigRef.current.toDataURL("image/png");
      form.setValue("signatureUrl", dataUrl, { shouldDirty: true });
      setIsEmpty(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Signature</h3>
        {!isEmpty && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <p className="text-sm text-gray-500">
        Draw your signature below. This will be used for prescriptions and other
        documents.
      </p>

      <FormField
        control={form.control}
        name="signatureUrl"
        render={() => (
          <FormItem>
            <FormLabel className="sr-only">Signature</FormLabel>
            <div ref={containerRef} className="border rounded-lg bg-white p-1 h-[150px]">
              <SignatureCanvas
                ref={sigRef}
                canvasProps={{
                  className: "cursor-crosshair w-full h-full",
                }}
                penColor="black"
                backgroundColor="white"
                onEnd={handleEnd}
              />
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {isEmpty && !currentSignature && (
        <p className="text-xs text-gray-400 italic">
          No signature saved. Draw your signature above and save to store it.
        </p>
      )}
    </div>
  );
};
