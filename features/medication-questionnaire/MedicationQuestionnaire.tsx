"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const questionnaireSchema = z.object({
  smoke: z.enum(["yes", "no"], {
    required_error: "Please select an option",
  }),
  alcohol: z.enum(["yes", "no"], {
    required_error: "Please select an option",
  }),
  recreationalDrugs: z.enum(["yes", "no"], {
    required_error: "Please select an option",
  }),
  heartProblems: z.array(z.string()).refine((value) => value.length > 0, {
    message: "Please select at least one option",
  }),
});

type QuestionnaireFormData = z.infer<typeof questionnaireSchema>;

const heartProblemOptions = [
  { id: "heart-disease", label: "Heart disease" },
  { id: "high-blood-pressure", label: "High blood pressure" },
  { id: "low-blood-pressure", label: "Low blood pressure" },
  { id: "stroke", label: "Stroke or mini-stroke" },
  { id: "chest-pain", label: "Chest pain/angina/heart attack" },
  { id: "none", label: "None of these" },
];

export function MedicationQuestionnaire() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<QuestionnaireFormData>({
    resolver: zodResolver(questionnaireSchema),
    defaultValues: {
      smoke: "no",
      alcohol: "no",
      recreationalDrugs: "no",
      heartProblems: ["none"],
    },
  });

  const handleGoBack = () => {
    router.back();
  };

  const onSubmit = async (data: QuestionnaireFormData) => {
    setIsLoading(true);

    try {
      // Save questionnaire data (in production, this would be an API call)
      console.log("Medical questionnaire completed:", data);

      // Set completion flag for checkout page with timestamp
      const completionData = {
        completed: true,
        timestamp: new Date().toISOString(),
        responses: data,
      };
      localStorage.setItem("questionnaireCompleted", "true");
      localStorage.setItem("questionnaireData", JSON.stringify(completionData));

      toast.success(
        "Medical questionnaire completed successfully! Redirecting to checkout...",
      );

      // Small delay before redirect to allow toast to show
      setTimeout(() => {
        router.push("/checkout");
      }, 1500);
    } catch (error) {
      console.error("Error saving questionnaire:", error);
      toast.error("Failed to save questionnaire");
    } finally {
      setIsLoading(false);
    }
  };

  const handleHeartProblemsChange = (value: string, checked: boolean) => {
    const currentValues = form.getValues("heartProblems");

    if (value === "none") {
      // If "None of these" is selected, clear all others
      if (checked) {
        form.setValue("heartProblems", ["none"]);
      } else {
        form.setValue("heartProblems", []);
      }
    } else {
      // If any other option is selected, remove "none" and toggle the option
      let newValues = currentValues.filter((v) => v !== "none");

      if (checked) {
        newValues.push(value);
      } else {
        newValues = newValues.filter((v) => v !== value);
      }

      // If no options are selected, default to "none"
      if (newValues.length === 0) {
        newValues = ["none"];
      }

      form.setValue("heartProblems", newValues);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center px-4 py-16">
      {/* Header */}
      <div className="w-full max-w-5xl mb-6">
        <Button
          variant="ghost"
          onClick={handleGoBack}
          className="flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="w-full max-w-5xl bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-2xl font-bold mb-8">
          Has any of this information changed?
        </h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Smoking Question */}
            <FormField
              control={form.control}
              name="smoke"
              render={({ field }) => (
                <FormItem className="space-y-4">
                  <FormLabel className="text-base font-medium">
                    Do you smoke?
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-3"
                    >
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="yes" id="smoke-yes" />
                        <label htmlFor="smoke-yes" className="cursor-pointer">
                          Yes
                        </label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="no" id="smoke-no" />
                        <label htmlFor="smoke-no" className="cursor-pointer">
                          No
                        </label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Alcohol Question */}
            <FormField
              control={form.control}
              name="alcohol"
              render={({ field }) => (
                <FormItem className="space-y-4">
                  <FormLabel className="text-base font-medium">
                    Do you drink alcohol?
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-3"
                    >
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="yes" id="alcohol-yes" />
                        <label htmlFor="alcohol-yes" className="cursor-pointer">
                          Yes
                        </label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="no" id="alcohol-no" />
                        <label htmlFor="alcohol-no" className="cursor-pointer">
                          No
                        </label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recreational Drugs Question */}
            <FormField
              control={form.control}
              name="recreationalDrugs"
              render={({ field }) => (
                <FormItem className="space-y-4">
                  <FormLabel className="text-base font-medium">
                    Do you use recreational drugs? (e.g., marijuana, cocaine)
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-3"
                    >
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="yes" id="drugs-yes" />
                        <label htmlFor="drugs-yes" className="cursor-pointer">
                          Yes
                        </label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="no" id="drugs-no" />
                        <label htmlFor="drugs-no" className="cursor-pointer">
                          No
                        </label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Heart Problems Question */}
            <FormField
              control={form.control}
              name="heartProblems"
              render={() => (
                <FormItem className="space-y-4">
                  <FormLabel className="text-base font-medium">
                    Do you have any of the following heart problems?
                  </FormLabel>
                  <p className="text-sm text-gray-600">
                    Can select multiple unless you select &apos;None of
                    these&apos;
                  </p>
                  <div className="space-y-3">
                    {heartProblemOptions.map((option) => (
                      <FormField
                        key={option.id}
                        control={form.control}
                        name="heartProblems"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={option.id}
                              className="flex items-center space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(option.id)}
                                  onCheckedChange={(checked) => {
                                    handleHeartProblemsChange(
                                      option.id,
                                      checked as boolean,
                                    );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="flex-1 cursor-pointer font-normal">
                                {option.label}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex justify-end pt-6">
              <Button type="submit" disabled={isLoading} variant="default">
                {isLoading ? "Submitting..." : "Continue"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
