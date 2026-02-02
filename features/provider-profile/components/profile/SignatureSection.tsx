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
  const [isEmpty, setIsEmpty] = useState(true);

  const currentSignature = form.watch("signatureUrl");

  // Load existing signature when component mounts or signature changes
  useEffect(() => {
    if (currentSignature && sigRef.current) {
      // Clear first to avoid overlapping
      sigRef.current.clear();
      // Load the saved signature image
      sigRef.current.fromDataURL(currentSignature, {
        width: 400,
        height: 150,
      });
      setIsEmpty(false);
    }
  }, [currentSignature]);

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
            <div className="border rounded-lg bg-white p-1">
              <SignatureCanvas
                ref={sigRef}
                canvasProps={{
                  className: "w-full h-[150px] cursor-crosshair",
                  style: {
                    width: "100%",
                    height: "150px",
                  },
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
