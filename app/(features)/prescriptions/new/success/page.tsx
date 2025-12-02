"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import DefaultLayout from "@/components/layout/DefaultLayout";

export default function PrescriptionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [queueId, setQueueId] = useState<string>("");
  const [encounterId, setEncounterId] = useState<string>("");

  useEffect(() => {
    const queue = searchParams.get("queueId");
    const encounter = searchParams.get("encounterId");

    if (queue) setQueueId(queue);
    if (encounter) setEncounterId(encounter);
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
            <p className="text-muted-foreground mb-4">
              Your prescription has been sent to the pharmacy for processing.
            </p>

            {queueId && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
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
