"use client";

import { ProviderProfileSection } from "./ProviderProfileSection";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Award, Globe, Users } from "lucide-react";
import { ProviderProfile } from "../types/provider-profile";

interface ProviderQualificationsProps {
  provider: ProviderProfile;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function ProviderQualifications({
  provider,
}: ProviderQualificationsProps) {
  const specialties = Array.isArray(provider.specialties)
    ? provider.specialties
    : [];
  const licenses = Array.isArray(provider.medical_licenses)
    ? provider.medical_licenses
    : [];
  const certifications = Array.isArray(provider.board_certifications)
    ? provider.board_certifications
    : [];
  const education = Array.isArray(provider.education_training)
    ? provider.education_training
    : [];
  const languages = Array.isArray(provider.languages_spoken)
    ? provider.languages_spoken
    : [];
  const associations = Array.isArray(provider.professional_associations)
    ? provider.professional_associations
    : [];

  return (
    <ProviderProfileSection title="Qualifications & Experience">
      <div className="space-y-6">
        {/* Specialties */}
        {specialties.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4" />
              Specialties
            </h4>
            <div className="flex flex-wrap gap-2">
              {specialties.map((specialty: unknown, index: number) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-blue-100 text-blue-800"
                >
                  {typeof specialty === "string"
                    ? specialty
                    : (specialty as any)?.name ||
                      (specialty as any)?.specialty ||
                      JSON.stringify(specialty)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Medical Licenses */}
        {licenses.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4" />
              Medical Licenses
            </h4>
            <div className="space-y-2">
              {licenses.map((license: unknown, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <span className="font-medium text-gray-900">
                      {typeof license === "string"
                        ? license
                        : (license as any)?.state ||
                          (license as any)?.name ||
                          (license as any)?.license ||
                          JSON.stringify(license)}
                    </span>
                    {typeof license === "object" &&
                      (license as any)?.number && (
                        <p className="text-sm text-gray-600">
                          License #{(license as any).number}
                        </p>
                      )}
                  </div>
                  {typeof license === "object" && (license as any)?.expiry && (
                    <span className="text-sm text-gray-500">
                      Expires{" "}
                      {new Date((license as any).expiry).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Board Certifications */}
        {certifications.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4" />
              Board Certifications
            </h4>
            <div className="space-y-2">
              {certifications.map((cert: unknown, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="font-medium text-gray-900">
                    {typeof cert === "string"
                      ? cert
                      : (cert as any)?.name ||
                        (cert as any)?.certification ||
                        JSON.stringify(cert)}
                  </span>
                  {typeof cert === "object" && (cert as any)?.year && (
                    <span className="text-sm text-gray-500">
                      {(cert as any).year}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education & Training */}
        {education.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Education & Training
            </h4>
            <div className="space-y-2">
              {education.map((edu: unknown, index: number) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium text-gray-900">
                    {typeof edu === "string"
                      ? edu
                      : (edu as any)?.degree ||
                        (edu as any)?.institution ||
                        (edu as any)?.education ||
                        JSON.stringify(edu)}
                  </div>
                  {typeof edu === "object" && (
                    <div className="text-sm text-gray-600 mt-1">
                      {(edu as any)?.institution && (
                        <span>{(edu as any).institution}</span>
                      )}
                      {(edu as any)?.year && (
                        <span className="ml-2">({(edu as any).year})</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {languages.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Languages Spoken
            </h4>
            <div className="flex flex-wrap gap-2">
              {languages.map((language: unknown, index: number) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-green-50 text-green-800 border-green-200"
                >
                  {typeof language === "string"
                    ? language
                    : (language as any)?.name ||
                      (language as any)?.language ||
                      JSON.stringify(language)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Professional Associations */}
        {associations.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Professional Associations
            </h4>
            <div className="space-y-2">
              {associations.map((association: unknown, index: number) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900">
                    {typeof association === "string"
                      ? association
                      : (association as any)?.name ||
                        (association as any)?.association ||
                        JSON.stringify(association)}
                  </span>
                  {typeof association === "object" &&
                    (association as any)?.role && (
                      <p className="text-sm text-gray-600 mt-1">
                        {(association as any).role}
                      </p>
                    )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fallback if no qualifications */}
        {specialties.length === 0 &&
          licenses.length === 0 &&
          certifications.length === 0 &&
          education.length === 0 &&
          languages.length === 0 &&
          associations.length === 0 && (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm">
                Qualification details are being updated. Please contact the
                provider for more information.
              </p>
            </div>
          )}
      </div>
    </ProviderProfileSection>
  );
}
