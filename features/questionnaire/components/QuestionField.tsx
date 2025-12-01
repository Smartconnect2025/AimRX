"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { Question } from "../types";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

interface QuestionFieldProps {
  question: Question;
}

export function QuestionField({ question }: QuestionFieldProps) {
  const { control } = useFormContext();

  type FieldType = {
    value: string | string[] | undefined;
    onChange: (value: string | string[]) => void;
    onBlur: () => void;
    name: string;
  };

  const renderFieldContent = (field: FieldType) => {
    switch (question.type) {
      case "single-select":
        return (
          <RadioGroup
            onValueChange={field.onChange}
            defaultValue={
              typeof field.value === "string" ? field.value : undefined
            }
            className="flex flex-col space-y-3"
          >
            {question.options.map((option) => (
              <div key={option.id} className="flex items-center space-x-3">
                <RadioGroupItem value={option.value} id={option.id} />
                <label
                  htmlFor={option.id}
                  className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </RadioGroup>
        );

      case "multi-select":
        return (
          <div className="space-y-3">
            {question.options.map((option) => (
              <div key={option.id} className="flex items-center space-x-3">
                <Checkbox
                  id={option.id}
                  checked={
                    Array.isArray(field.value) &&
                    field.value.includes(option.value)
                  }
                  onCheckedChange={(checked) => {
                    const currentValues = Array.isArray(field.value)
                      ? field.value
                      : [];
                    const newValues = checked
                      ? [...currentValues, option.value]
                      : currentValues.filter((v: string) => v !== option.value);
                    field.onChange(newValues);
                  }}
                />
                <label
                  htmlFor={option.id}
                  className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );

      case "text-input":
        return (
          <Input
            value={typeof field.value === "string" ? field.value : ""}
            onChange={(e) => field.onChange(e.target.value)}
            onBlur={field.onBlur}
            name={field.name}
            placeholder={question.placeholder}
            maxLength={question.maxLength}
          />
        );
    }
  };

  return (
    <FormField
      control={control}
      name={question.id}
      render={({ field }) => (
        <FormItem className="space-y-4">
          <FormLabel className="text-base">
            {question.question}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </FormLabel>
          {question.description && (
            <p className="text-sm text-muted-foreground">
              {question.description}
            </p>
          )}
          <FormControl>{renderFieldContent(field)}</FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
