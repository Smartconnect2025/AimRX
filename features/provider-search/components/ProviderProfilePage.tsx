"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useProviderProfile } from "../hooks/useProviderProfile";
import { ProviderInfoCard } from "./ProviderProfileHeader";
import { ProviderProfileSection } from "./ProviderProfileSection";
import { ProviderAvailability } from "./ProviderAvailability";
import { ProviderQualifications } from "./ProviderQualifications";
import { ProviderServices } from "./ProviderServices";
import { ProviderProfileProps } from "../types/provider-profile";

export function ProviderProfilePage({
  providerId,
  searchParams,
}: ProviderProfileProps) {
  const router = useRouter();

  const { provider, isLoading, error } = useProviderProfile(providerId);

  const handleBack = () => {
    // Preserve search context by including search params in the back navigation
    const searchQuery = searchParams.q;
    const filters = searchParams.filters;

    let backUrl = "/provider-search";
    const params = new URLSearchParams();

    if (searchQuery && typeof searchQuery === "string") {
      params.set("q", searchQuery);
    }

    if (filters && typeof filters === "string") {
      params.set("filters", filters);
    }

    if (params.toString()) {
      backUrl += `?${params.toString()}`;
    }

    router.push(backUrl);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error || "Provider not found"}</p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {/* Back Button */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Search Results
        </Button>
      </div>

      {/* Provider Header */}
      <ProviderInfoCard provider={provider} />

      <div className="grid gap-6 lg:grid-cols-3 mt-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Professional Bio */}
          {provider.professional_bio && (
            <ProviderProfileSection title="About">
              <p className="text-gray-700 leading-relaxed">
                {provider.professional_bio}
              </p>
            </ProviderProfileSection>
          )}

          {/* Qualifications */}
          <ProviderQualifications provider={provider} />

          {/* Services */}
          <ProviderServices provider={provider} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Availability */}
          <ProviderAvailability provider={provider} />
        </div>
      </div>
    </div>
  );
}
