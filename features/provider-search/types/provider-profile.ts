export interface ProviderProfile {
  id: string;
  first_name: string;
  last_name: string;
  specialty: string | null;
  avatar_url: string | null;
  professional_bio: string | null;
  years_of_experience: number | null;
  specialties: unknown;
  medical_licenses: unknown;
  board_certifications: unknown;
  education_training: unknown;
  languages_spoken: unknown;
  professional_associations: unknown;
  services_offered: unknown;
  insurance_plans_accepted: unknown;
  hospital_affiliations: unknown;
  practice_address: unknown;
  practice_type: "solo" | "group" | "hospital" | "clinic" | "telehealth" | null;
  // Legacy fields for backward compatibility
  licensedStates: string[];
  serviceTypes: string[];
  insurancePlans: string[];
  availability: {
    status: "scheduled" | "unavailable";
    nextSlots?: string[];
    workingHours?: {
      [key: string]: {
        start: string;
        end: string;
        isAvailable: boolean;
      };
    };
  };
}

export interface ProviderProfileProps {
  providerId: string;
  searchParams: {
    [key: string]: string | string[] | undefined;
  };
}

export interface ProviderInfoCardProps {
  provider: ProviderProfile;
}

export interface ProviderProfileSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}
