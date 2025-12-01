"use client";

import { FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { InsuranceFormValues } from "../../schemas/insurance";
import { toast } from "sonner";

interface CardUploadProps {
  form: UseFormReturn<InsuranceFormValues>;
  frontPreview: string | null;
  backPreview: string | null;
  setFrontPreview: (preview: string | null) => void;
  setBackPreview: (preview: string | null) => void;
}

export function CardUpload({
  form,
  frontPreview,
  backPreview,
  setFrontPreview,
  setBackPreview,
}: CardUploadProps) {
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "insuranceCardFront" | "insuranceCardBack"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    // Validate file type
    if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
      toast.error("File must be JPG, PNG, or PDF");
      return;
    }

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (field === "insuranceCardFront") {
          setFrontPreview(reader.result as string);
          form.setValue("insuranceCardFront", {
            file,
            preview: reader.result as string,
          });
        } else {
          setBackPreview(reader.result as string);
          form.setValue("insuranceCardBack", {
            file,
            preview: reader.result as string,
          });
        }
      };
      reader.readAsDataURL(file);
    } else {
      // Handle PDF files (no preview)
      if (field === "insuranceCardFront") {
        form.setValue("insuranceCardFront", { file });
      } else {
        form.setValue("insuranceCardBack", { file });
      }
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Insurance Card Images</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Front of Card */}
        <div className="space-y-2">
          <FormLabel>Front of Insurance Card</FormLabel>
          <Input
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            onChange={(e) => handleFileUpload(e, "insuranceCardFront")}
            className="bg-white"
          />
          {frontPreview && (
            <div className="mt-2">
              <img
                src={frontPreview}
                alt="Front of insurance card"
                className="w-full rounded-lg border"
              />
            </div>
          )}
        </div>

        {/* Back of Card */}
        <div className="space-y-2">
          <FormLabel>Back of Insurance Card</FormLabel>
          <Input
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            onChange={(e) => handleFileUpload(e, "insuranceCardBack")}
            className="bg-white"
          />
          {backPreview && (
            <div className="mt-2">
              <img
                src={backPreview}
                alt="Back of insurance card"
                className="w-full rounded-lg border"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 