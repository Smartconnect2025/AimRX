"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useFormPersistence } from "@/hooks/useFormPersistence";

import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";

import { SpecialtiesSection } from "../practice-details/SpecialtiesSection";
import { BoardCertificationSection } from "../professional-info/BoardCertificationSection";
import { EducationTrainingSection } from "../professional-info/EducationTrainingSection";
import { LanguagesSpokenSection } from "../professional-info/LanguagesSpokenSection";
import { MedicalLicenseSection } from "../professional-info/MedicalLicenseSection";
import { NPISection } from "../professional-info/NPISection";
import { ProfessionalAssociationsSection } from "../professional-info/ProfessionalAssociationsSection";
import { ProfessionalBioSection } from "../professional-info/ProfessionalBioSection";
import {
  professionalInfoSchema,
  ProfessionalInfoValues,
} from "../professional-info/types";
import { YearsOfExperienceSection } from "../professional-info/YearsOfExperienceSection";
import { useProviderProfile } from "../../hooks/use-provider-profile";
import { safeParseTyped } from "../../utils/json-parsers";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function ProfessionalInfoForm() {
  const { profile, updateProfessionalInfo, isSubmitting } =
    useProviderProfile();

  const form = useForm<ProfessionalInfoValues>({
    resolver: zodResolver(professionalInfoSchema),
    defaultValues: {
      npiNumber: "",
      specialties: [{ specialty: undefined }],
      licenses: [{ licenseNumber: "", state: undefined }],
      certifications: [{ certification: "" }],
      educationTraining: [{ education: "" }],
      languages: [{ language: undefined }],
      associations: [{ association: "" }],
      yearsOfExperience: undefined,
      professionalBio: "",
    },
    mode: "onChange",
  });

  // Persist form data to localStorage (disabled when profile exists)
  useFormPersistence({
    storageKey: `provider-professional-info-${profile?.user_id || 'draft'}`,
    watch: form.watch,
    setValue: form.setValue,
    disabled: !!profile, // Don't persist when editing existing profile
  });

  useEffect(() => {
    if (profile) {
      const specialties = safeParseTyped<{ specialty?: string }>(
        profile.specialties,
      );
      const licenses = safeParseTyped<{
        licenseNumber?: string;
        state?: string;
      }>(profile.medical_licenses);
      const certifications = safeParseTyped<{ certification?: string }>(
        profile.board_certifications,
      );
      const education = safeParseTyped<{ education?: string }>(
        profile.education_training,
      );
      const languages = safeParseTyped<{ language?: string }>(
        profile.languages_spoken,
      );
      const associations = safeParseTyped<{ association?: string }>(
        profile.professional_associations,
      );

      form.reset({
        npiNumber: profile.npi_number || "",
        specialties:
          specialties.length > 0 ? specialties : [{ specialty: undefined }],
        licenses:
          licenses.length > 0
            ? licenses
            : [{ licenseNumber: "", state: undefined }],
        certifications:
          certifications.length > 0 ? certifications : [{ certification: "" }],
        educationTraining:
          education.length > 0 ? education : [{ education: "" }],
        languages: languages.length > 0 ? languages : [{ language: undefined }],
        associations:
          associations.length > 0 ? associations : [{ association: "" }],
        yearsOfExperience: profile.years_of_experience ?? undefined,
        professionalBio: profile.professional_bio || "",
      });
    }
  }, [profile, form]);

  async function onSubmit(data: ProfessionalInfoValues) {
    const success = await updateProfessionalInfo(data);
    if (success) {
      form.reset(form.getValues());
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          Professional Information
        </h2>
      </div>

      <Form {...form}>
        <form
          id="professional-info-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="p-6 space-y-6"
        >
          <NPISection form={form} />

          <Separator className="bg-gray-200" />

          <SpecialtiesSection form={form} />

          <Separator className="bg-gray-200" />

          <MedicalLicenseSection form={form} />

          <Separator className="bg-gray-200" />

          <BoardCertificationSection form={form} />

          <Separator className="bg-gray-200" />

          <EducationTrainingSection form={form} />

          <Separator className="bg-gray-200" />

          <LanguagesSpokenSection form={form} />

          <Separator className="bg-gray-200" />

          <ProfessionalAssociationsSection form={form} />

          <Separator className="bg-gray-200" />

          <YearsOfExperienceSection form={form} />

          <Separator className="bg-gray-200" />

          <ProfessionalBioSection form={form} />

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              variant="default"
              className="px-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
