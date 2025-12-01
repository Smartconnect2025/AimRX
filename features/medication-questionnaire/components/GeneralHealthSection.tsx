"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/utils/tailwind-utils";
import { UseFormReturn } from "react-hook-form";
import { MedicationQuestionnaireData } from "../types";

interface GeneralHealthSectionProps {
  form: UseFormReturn<MedicationQuestionnaireData>;
}

export function GeneralHealthSection({ form }: GeneralHealthSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">
          General Health Information
        </h2>
        <p className="text-muted-foreground mb-6">
          Please provide some general health information to help us ensure safe
          medication therapy.
        </p>
      </div>

      <div className="grid gap-6">
        <FormField
          control={form.control}
          name="generalHealthQuestions.lastPhysicalExam"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>When was your last physical examination?</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Select date of last physical exam</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="generalHealthQuestions.currentlyTreatedByDoctor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Are you currently being treated by a doctor for any condition?
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select yes or no" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch("generalHealthQuestions.currentlyTreatedByDoctor") ===
          "yes" && (
          <FormField
            control={form.control}
            name="generalHealthQuestions.doctorName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Doctor&apos;s name (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Dr. Smith" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="generalHealthQuestions.smokingStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What is your smoking status?</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select smoking status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="never">Never smoked</SelectItem>
                  <SelectItem value="former">Former smoker</SelectItem>
                  <SelectItem value="current">Current smoker</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="generalHealthQuestions.alcoholConsumption"
          render={({ field }) => (
            <FormItem>
              <FormLabel>How often do you consume alcohol?</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select alcohol consumption" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">
                    I don&apos;t drink alcohol
                  </SelectItem>
                  <SelectItem value="occasionally">
                    Occasionally (special occasions)
                  </SelectItem>
                  <SelectItem value="1-2 drinks per week">
                    1-2 drinks per week
                  </SelectItem>
                  <SelectItem value="3-7 drinks per week">
                    3-7 drinks per week
                  </SelectItem>
                  <SelectItem value="more than 7 per week">
                    More than 7 drinks per week
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
