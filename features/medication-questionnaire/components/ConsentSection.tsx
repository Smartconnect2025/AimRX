"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Shield } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { MedicationQuestionnaireData } from "../types";

interface ConsentSectionProps {
  form: UseFormReturn<MedicationQuestionnaireData>;
  medications: Array<{
    id: string;
    name: string;
    category: string;
  }>;
  warnings: string[];
}

export function ConsentSection({
  form,
  medications,
  warnings,
}: ConsentSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Consent & Acknowledgment</h2>
        <p className="text-muted-foreground mb-6">
          Please review and acknowledge the following information before
          completing your questionnaire.
        </p>
      </div>

      {/* Medication-specific warnings */}
      {warnings.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <div className="font-medium mb-2">
              Important Safety Information:
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* General safety information */}
      <div className="p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-3 flex items-center">
          <Shield className="h-4 w-4 mr-2" />
          Your Safety is Our Priority
        </h4>
        <div className="text-sm text-blue-800 space-y-2">
          <p>By completing this questionnaire, you understand that:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>
              This questionnaire helps our licensed healthcare providers
              evaluate your suitability for medication therapy
            </li>
            <li>
              You must provide accurate and complete information for your safety
            </li>
            <li>
              Weight loss medications require ongoing monitoring and follow-up
            </li>
            <li>
              Results may vary, and medication therapy should be combined with
              lifestyle changes
            </li>
            <li>
              You should report any side effects or concerns to your healthcare
              provider immediately
            </li>
          </ul>
        </div>
      </div>

      {/* Consent checkboxes */}
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="consent.acknowledgeRisks"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm">
                  I acknowledge that I have read and understand the potential
                  risks and side effects associated with the medications I am
                  requesting ({medications.map((m) => m.name).join(", ")}).
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="consent.consentToTreatment"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm">
                  I consent to treatment and understand that this questionnaire
                  will be reviewed by a licensed healthcare provider who will
                  determine my eligibility for the requested medication(s). I
                  agree to follow all treatment recommendations and report any
                  concerns.
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
      </div>

      <Alert className="border-green-200 bg-green-50">
        <Shield className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <div className="font-medium mb-1">Next Steps:</div>
          <p className="text-sm">
            After submitting this questionnaire, a licensed healthcare provider
            will review your information and determine if the requested
            medication is appropriate for you. You&apos;ll receive a response
            within 1-2 business days.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
