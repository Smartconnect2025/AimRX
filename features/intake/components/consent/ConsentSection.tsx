"use client";

import { UseFormReturn, FieldValues, FieldPath } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";

interface ConsentSectionProps<T extends FieldValues = FieldValues> {
  title: string;
  description: string;
  consents: {
    id: string;
    title: string;
    content: string;
  }[];
  form: UseFormReturn<T>;
  fieldPrefix: string;
}

export function ConsentSection<T extends FieldValues = FieldValues>({
  title,
  description,
  consents,
  form,
  fieldPrefix,
}: ConsentSectionProps<T>) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="space-y-4">
        {consents.map((consent) => (
          <div
            key={consent.id}
            className="space-y-4 p-4 border rounded-lg bg-gray-50"
          >
            <div>
              <h4 className="font-medium">{consent.title}</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {consent.content}
              </p>
            </div>

            <FormField
              control={form.control}
              name={`${fieldPrefix}.${consent.id}` as FieldPath<T>}
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value as boolean}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>I have read and agree to the above</FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
