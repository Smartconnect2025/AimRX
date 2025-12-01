export interface Provider {
  id: string;
  first_name: string;
  last_name: string;
  specialty: string | null;
  avatarUrl: string;
  licensedStates: string[];
  serviceTypes: string[];
  insurancePlans: string[];
  availability: {
    status: "scheduled" | "unavailable";
    nextSlots?: string[];
  };
}

export interface SearchFilters {
  licensedState?: string;
  serviceTypes?: string[];
  insurancePlans?: string[];
  searchQuery?: string;
}

export interface SearchState {
  providers: Provider[];
  filters: SearchFilters;
  isLoading: boolean;
  error: string | null;
}
