"use client";

import { ProviderProfileSection } from "./ProviderProfileSection";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  MessageSquare,
  Phone,
  User,
  MapPin,
  Building,
} from "lucide-react";
import { ProviderProfile } from "../types/provider-profile";

interface ProviderServicesProps {
  provider: ProviderProfile;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function ProviderServices({ provider }: ProviderServicesProps) {
  const services = Array.isArray(provider.services_offered)
    ? provider.services_offered
    : [];
  const hospitalAffiliations = Array.isArray(provider.hospital_affiliations)
    ? provider.hospital_affiliations
    : [];
  const practiceAddress = provider.practice_address as unknown;

  const getServiceTypeIcon = (serviceType: string) => {
    const type = serviceType.toLowerCase();
    if (
      type.includes("video") ||
      type.includes("telehealth") ||
      type.includes("virtual")
    ) {
      return <Video className="w-4 h-4" />;
    }
    if (type.includes("chat") || type.includes("messaging")) {
      return <MessageSquare className="w-4 h-4" />;
    }
    if (type.includes("phone") || type.includes("telephone")) {
      return <Phone className="w-4 h-4" />;
    }
    if (
      type.includes("person") ||
      type.includes("in-person") ||
      type.includes("office")
    ) {
      return <User className="w-4 h-4" />;
    }
    return null;
  };

  return (
    <ProviderProfileSection title="Services & Practice">
      <div className="space-y-6">
        {/* Service Types */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Service Types</h4>
          <div className="flex flex-wrap gap-2">
            {Array.isArray(provider.serviceTypes) &&
              provider.serviceTypes.map((serviceType) => (
                <Badge
                  key={serviceType}
                  variant="secondary"
                  className="flex items-center gap-1 bg-blue-100 text-blue-800"
                >
                  {getServiceTypeIcon(serviceType)}
                  {serviceType}
                </Badge>
              ))}
          </div>
        </div>

        {/* Services Offered */}
        {services.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Services Offered</h4>
            <div className="grid gap-2 md:grid-cols-2">
              {services.map((service: unknown, index: number) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="text-sm text-gray-700">
                    {typeof service === "string"
                      ? service
                      : (service as any)?.name ||
                        (service as any)?.service ||
                        JSON.stringify(service)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Practice Information */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Building className="w-4 h-4" />
            Practice Information
          </h4>
          <div className="space-y-3">
            {practiceAddress &&
            typeof practiceAddress === "object" &&
            practiceAddress !== null ? (
              <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">
                    {typeof practiceAddress === "string"
                      ? practiceAddress
                      : (practiceAddress as any)?.name || "Practice Location"}
                  </p>
                  {typeof practiceAddress === "object" && (
                    <div className="text-sm text-gray-600 mt-1">
                      {(practiceAddress as any)?.street && (
                        <p>{(practiceAddress as any).street}</p>
                      )}
                      {(practiceAddress as any)?.city &&
                        (practiceAddress as any)?.state && (
                          <p>
                            {(practiceAddress as any).city},{" "}
                            {(practiceAddress as any).state}{" "}
                            {(practiceAddress as any)?.zip}
                          </p>
                        )}
                      {(practiceAddress as any)?.phone && (
                        <p>Phone: {(practiceAddress as any).phone}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {provider.practice_type && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Building className="w-4 h-4 text-gray-500" />
                <div>
                  <span className="font-medium text-gray-900">
                    Practice Type:{" "}
                  </span>
                  <span className="text-gray-700 capitalize">
                    {provider.practice_type}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hospital Affiliations */}
        {hospitalAffiliations.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Building className="w-4 h-4" />
              Hospital Affiliations
            </h4>
            <div className="space-y-2">
              {hospitalAffiliations.map(
                (affiliation: unknown, index: number) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-900">
                      {typeof affiliation === "string"
                        ? affiliation
                        : (affiliation as any)?.name ||
                          (affiliation as any)?.affiliation ||
                          JSON.stringify(affiliation)}
                    </div>
                    {typeof affiliation === "object" &&
                      (affiliation as any)?.role && (
                        <p className="text-sm text-gray-600 mt-1">
                          {(affiliation as any).role}
                        </p>
                      )}
                    {typeof affiliation === "object" &&
                      (affiliation as any)?.location && (
                        <p className="text-sm text-gray-600">
                          {(affiliation as any).location}
                        </p>
                      )}
                  </div>
                ),
              )}
            </div>
          </div>
        )}

        {/* Fallback if no services */}
        {services.length === 0 &&
          !practiceAddress &&
          hospitalAffiliations.length === 0 && (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm">
                Service details are being updated. Please contact the provider
                for more information.
              </p>
            </div>
          )}
      </div>
    </ProviderProfileSection>
  );
}
