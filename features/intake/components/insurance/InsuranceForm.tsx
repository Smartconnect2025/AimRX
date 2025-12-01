"use client";

import { Form } from "@/components/ui/form";
import { useInsuranceForm } from "@/features/intake/hooks/useInsuranceForm";
import { InsuranceProviderSelect } from "./InsuranceProviderSelect";
import { PolicyDetails } from "./PolicyDetails";
import { CardUpload } from "./CardUpload";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function InsuranceForm() {
  const router = useRouter();
  const {
    form,
    onSubmit,
    insuranceCardFrontPreview,
    insuranceCardBackPreview,
    setInsuranceCardFrontPreview,
    setInsuranceCardBackPreview,
    isSubmitting,
  } = useInsuranceForm();

  const handleGoBack = () => {
    router.push("/intake/medical-history");
  };

  return (
    <Form {...form}>
      <form
        className="space-y-6 flex flex-col min-h-[400px]"
        onSubmit={onSubmit}
      >
        <div className="flex-1 space-y-6">
          <InsuranceProviderSelect form={form} />
          <PolicyDetails form={form} />
          <CardUpload
            form={form}
            frontPreview={insuranceCardFrontPreview}
            backPreview={insuranceCardBackPreview}
            setFrontPreview={setInsuranceCardFrontPreview}
            setBackPreview={setInsuranceCardBackPreview}
          />
        </div>
        <div className="flex justify-between items-center pt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={handleGoBack}
            disabled={isSubmitting}
          >
            Go back
          </Button>
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
