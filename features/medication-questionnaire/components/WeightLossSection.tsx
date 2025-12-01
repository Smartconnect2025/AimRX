"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { UseFormReturn } from "react-hook-form";
import { MedicationQuestionnaireData } from "../types";

interface WeightLossSectionProps {
  form: UseFormReturn<MedicationQuestionnaireData>;
}

export function WeightLossSection({ form }: WeightLossSectionProps) {
  const hasPreviousAttempts = form.watch(
    "weightLossQuestions.previousWeightLossAttempts",
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Weight Management Goals</h2>
        <p className="text-muted-foreground mb-6">
          Help us understand your weight loss goals and history to provide the
          most appropriate treatment.
        </p>
      </div>

      <div className="grid gap-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="weightLossQuestions.currentWeight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Weight (lbs)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 180" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="weightLossQuestions.goalWeight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Goal Weight (lbs)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 150" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="weightLossQuestions.previousWeightLossAttempts"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Have you tried to lose weight before?</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="no">
                    No, this is my first attempt
                  </SelectItem>
                  <SelectItem value="yes">
                    Yes, I&apos;ve tried before
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {hasPreviousAttempts === "yes" && (
          <FormField
            control={form.control}
            name="weightLossQuestions.previousWeightLossDetails"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Tell us about your previous weight loss attempts
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="What methods did you try? What worked or didn't work for you?"
                    className="resize-none min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="weightLossQuestions.currentDiet"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Are you currently following any specific diet? (Optional)
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Keto, Mediterranean, Low-carb"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="weightLossQuestions.exerciseFrequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>How often do you currently exercise?</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select exercise frequency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">
                    I don&apos;t exercise regularly
                  </SelectItem>
                  <SelectItem value="1-2 times per week">
                    1-2 times per week
                  </SelectItem>
                  <SelectItem value="3-4 times per week">
                    3-4 times per week
                  </SelectItem>
                  <SelectItem value="5+ times per week">
                    5 or more times per week
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Important Note</h4>
        <p className="text-sm text-blue-800">
          Weight loss medications work best when combined with a healthy diet
          and regular exercise. Our healthcare providers may recommend lifestyle
          changes alongside your medication therapy.
        </p>
      </div>
    </div>
  );
}
