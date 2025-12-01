"use client";

/**
 * Question Item Component
 * 
 * Displays a single question-answer pair in a consistent format
 */

import { formatDisplayValue } from "../../utils";

interface QuestionItemProps {
  label: string;
  value: unknown;
  className?: string;
}

export function QuestionItem({ label, value, className = "" }: QuestionItemProps) {
  return (
    <div className={className}>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">
        {formatDisplayValue(value)}
      </dd>
    </div>
  );
} 