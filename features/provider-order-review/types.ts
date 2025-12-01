/**
 * Provider Order Review Types
 * 
 * Type definitions for provider order review functionality
 */

export interface AddressData {
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  phone_number: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

export interface QuestionnaireData {
  // General questions
  smoke?: "yes" | "no";
  alcohol?: "yes" | "no";
  recreationalDrugs?: "yes" | "no";
  heartProblems?: string[];
  sexLife?: string;
  erectionFrequency?: string;
  symptoms?: string[];
  erectionHardness?: string;
  symptomDuration?: string;
  state?: string;
  
  // Demographics
  firstName?: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string;
  weight?: number;
  heightFeet?: number;
  heightInches?: number;
  phone?: string;
  smoking?: {
    does: "yes" | "no";
    frequency?: string;
  };
  alcohol_details?: {
    does: "yes" | "no";
    frequency?: string;
  };
  
  // Medical history
  medicalDiagnoses?: string[];
  hasSurgeries?: "yes" | "no";
  surgeryDetails?: string;
  visionHearingIssues?: string[];
  recentSymptoms?: string[];
  
  // Current medications
  prescriptionMedications?: {
    taking: "yes" | "no";
    list?: string;
  };
  nitrates?: "yes" | "no";
  alphaBlockers?: "yes" | "no";
  supplements?: {
    taking: "yes" | "no";
    list?: string;
  };
  conditions?: string[];
  
  // Semaglutide questionnaire (optional)
  semaglutideMTC?: string;
  semaglutidePregnancy?: string;
  semaglutidePancreatitis?: string;
  semaglutideAllergic?: string;
  semaglutideGLP1?: string;
  semaglutideRetinopathy?: string;
  semaglutideKidney?: string;
  semaglutideLiver?: string;
  semaglutideMedications?: string;
  semaglutideMentalHealth?: string;
  semaglutideSideEffects?: string;
}

export interface OrderReviewData {
  id: string;
  created_at: string;
  user_id: string;
  user_email: string;
  shipping_address: AddressData;
  billing_address?: AddressData | null;
  order_items: OrderItem[];
  questionnaire_data?: QuestionnaireData;
  review_status: "pending" | "in_review" | "completed";
  reviewed_by?: string;
  total_amount: number;
  reviewed_at?: string;
}

export interface OrderReviewState {
  isLoading: boolean;
  error: string | null;
  isStartingReview: boolean;
  isReleasingReview: boolean;
} 