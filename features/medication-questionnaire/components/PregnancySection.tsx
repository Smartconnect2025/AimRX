"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { MedicationQuestionnaireData } from "../types";

interface PregnancySectionProps {
  form: UseFormReturn<MedicationQuestionnaireData>;
}

export function PregnancySection({ form }: PregnancySectionProps) {
  const isPregnant = form.watch("pregnancyStatus.isPregnant");
  const isBreastfeeding = form.watch("pregnancyStatus.isBreastfeeding");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Pregnancy & Breastfeeding
        </h2>
        <p className="text-muted-foreground mb-6">
          These questions are important for your safety, as weight loss
          medications may not be suitable during pregnancy or breastfeeding.
        </p>
      </div>

      {(isPregnant === "yes" || isBreastfeeding === "yes") && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Weight loss medications are generally not recommended during
            pregnancy or breastfeeding. Please consult with your healthcare
            provider before proceeding.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        <FormField
          control={form.control}
          name="pregnancyStatus.isPregnant"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Are you currently pregnant?</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="unsure">I&apos;m not sure</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pregnancyStatus.isBreastfeeding"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Are you currently breastfeeding?</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pregnancyStatus.planningPregnancy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Are you planning to become pregnant in the next 6 months?
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="unsure">I&apos;m not sure</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {(isPregnant === "unsure" ||
        form.watch("pregnancyStatus.planningPregnancy") === "yes") && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            We recommend taking a pregnancy test and consulting with your
            healthcare provider before starting any weight loss medication
            program.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
