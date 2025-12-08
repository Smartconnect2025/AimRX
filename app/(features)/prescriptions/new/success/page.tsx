"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import DefaultLayout from "@/components/layout/DefaultLayout";
import { usePharmacy } from "@/contexts/PharmacyContext";

export default function PrescriptionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [queueId, setQueueId] = useState<string>("");
  const [encounterId, setEncounterId] = useState<string>("");
  const { pharmacy, isLoading } = usePharmacy();
  const [selectedPharmacy, setSelectedPharmacy] = useState<{name: string, color: string} | null>(null);

  useEffect(() => {
    const queue = searchParams.get("queueId");
    const encounter = searchParams.get("encounterId");

    if (queue) setQueueId(queue);
    if (encounter) setEncounterId(encounter);

    // Load selected pharmacy from sessionStorage
    const savedData = sessionStorage.getItem("prescriptionData");
    if (savedData) {
      const data = JSON.parse(savedData);
      if (data.selectedPharmacyName && data.selectedPharmacyColor) {
        setSelectedPharmacy({
          name: data.selectedPharmacyName,
          color: data.selectedPharmacyColor,
        });
      }
    }
  }, [searchParams]);

  const handleGoToDashboard = () => {
    router.push("/prescriptions");
  };

  return (
    <DefaultLayout>
      <div className="container mx-auto max-w-2xl py-16 px-4">
        <div className="bg-white rounded-lg border border-border shadow-sm p-8">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
          </div>

          {/* Success Message */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-3">
              Prescription Submitted Successfully!
            </h1>
            {selectedPharmacy ? (
              <>
                <p className="text-lg text-gray-700 mb-2">
                  Prescription successfully sent to{" "}
                  <span
                    className="font-bold text-xl"
                    style={{ color: selectedPharmacy.color }}
                  >
                    {selectedPharmacy.name}
                  </span>
                </p>
                <div
                  className="inline-block px-4 py-2 rounded-full text-sm font-semibold text-white mt-2"
                  style={{ backgroundColor: selectedPharmacy.color }}
                >
                  ✓ {selectedPharmacy.name}
                </div>
              </>
            ) : !isLoading && pharmacy ? (
              <>
                <p className="text-lg text-gray-700 mb-2">
                  Prescription successfully sent to{" "}
                  <span
                    className="font-bold"
                    style={{ color: pharmacy.primary_color || "#1E3A8A" }}
                  >
                    {pharmacy.name}
                  </span>
                </p>
                {pharmacy.tagline && (
                  <p className="text-sm italic text-gray-500 mb-4">
                    {pharmacy.tagline}
                  </p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground mb-4">
                Your prescription has been sent to the pharmacy for processing.
              </p>
            )}

            {queueId && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4 mt-6">
                <p className="text-sm text-muted-foreground mb-1">Queue ID</p>
                <p className="text-lg font-mono font-semibold text-foreground">
                  {queueId}
                </p>
              </div>
            )}

            {encounterId && (
              <p className="text-sm text-muted-foreground">
                Linked to encounter visit
              </p>
            )}
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleGoToDashboard}
              size="lg"
              className="bg-primary hover:bg-primary/90"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
