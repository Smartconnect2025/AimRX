"use client";

import { SearchFilters as SearchFiltersType } from "../types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils/tailwind-utils";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useServiceTypes } from "../hooks/useServiceTypes";
// Static data for provider search filters
const STATES = ["CA", "NY", "TX", "FL", "IL", "PA", "OH", "GA", "NC", "MI"];

const INSURANCE_PLANS = ["Blue Cross", "Aetna", "Cigna", "United Healthcare"];

// Service types will be fetched dynamically from the hook

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFiltersChange: (filters: SearchFiltersType) => void;
  className?: string;
}

export function SearchFilters({
  filters,
  onFiltersChange,
  className,
}: SearchFiltersProps) {
  const { serviceTypes, isLoading: serviceTypesLoading } = useServiceTypes();
  const toggleServiceType = (type: string) => {
    const currentTypes = filters.serviceTypes || [];
    if (currentTypes.includes(type)) {
      // If type is already selected, remove it (deselect)
      const newFilters = {
        ...filters,
        serviceTypes: currentTypes.filter((t) => t !== type),
      };
      onFiltersChange(newFilters);
    } else {
      // If type is not selected, add it
      const newFilters = {
        ...filters,
        serviceTypes: [...currentTypes, type],
      };
      onFiltersChange(newFilters);
    }
  };

  const toggleInsurancePlan = (plan: string) => {
    const currentPlans = filters.insurancePlans || [];
    if (currentPlans.includes(plan)) {
      // If plan is already selected, remove it (deselect)
      const newFilters = {
        ...filters,
        insurancePlans: currentPlans.filter((p) => p !== plan),
      };
      onFiltersChange(newFilters);
    } else {
      // If plan is not selected, add it
      const newFilters = {
        ...filters,
        insurancePlans: [...currentPlans, plan],
      };
      onFiltersChange(newFilters);
    }
  };

  const handleStateChange = (value: string) => {
    if (value === "all") {
      // Remove licensedState from filters
      const restFilters = { ...filters };
      delete restFilters.licensedState;
      onFiltersChange(restFilters);
    } else {
      const newFilters = { ...filters, licensedState: value };
      onFiltersChange(newFilters);
    }
  };

  const handleClearAll = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Licensed State Select */}
        <div className="space-y-2">
          <Label>Licensed State</Label>
          <Select
            value={filters.licensedState || "all"}
            onValueChange={handleStateChange}
          >
            <SelectTrigger size="sm" className="h-7 px-2.5 text-xs">
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {STATES.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Service Types Tags */}
        <div className="space-y-2">
          <Label>Service Type</Label>
          <div className="flex flex-wrap gap-2">
            {serviceTypesLoading ? (
              <div className="text-sm text-muted-foreground">
                Loading service types...
              </div>
            ) : (
              serviceTypes.map((type) => (
                <Button
                  key={type}
                  variant={
                    (filters.serviceTypes || []).includes(type)
                      ? "default"
                      : "outline"
                  }
                  onClick={() => toggleServiceType(type)}
                  className={`gap-1.5 h-7 px-2.5 text-xs ${
                    (filters.serviceTypes || []).includes(type)
                      ? "bg-[#4BCBC7] hover:bg-[#3BABA7] border-0"
                      : "border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                  }`}
                  size="sm"
                >
                  {type}
                </Button>
              ))
            )}
          </div>
        </div>

        {/* Insurance Plans Tags */}
        <div className="space-y-2">
          <Label>Insurance Plans</Label>
          <div className="flex flex-wrap gap-2">
            {INSURANCE_PLANS.map((plan) => (
              <Button
                key={plan}
                variant={
                  (filters.insurancePlans || []).includes(plan)
                    ? "default"
                    : "outline"
                }
                onClick={() => toggleInsurancePlan(plan)}
                className={`gap-1.5 h-7 px-2.5 text-xs ${
                  (filters.insurancePlans || []).includes(plan)
                    ? "bg-[#4BCBC7] hover:bg-[#3BABA7] border-0"
                    : "border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                }`}
                size="sm"
              >
                {plan}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
