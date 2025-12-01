"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/utils/tailwind-utils";

interface FAQItem {
  question: string;
  answer: string;
}

interface ProductFAQProps {
  items: FAQItem[];
  className?: string;
}

export function ProductFAQ({ items, className }: ProductFAQProps) {
  return (
    <div className={cn("bg-blue-50 py-8 sm:py-12 lg:py-16 w-full", className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <h1 className="text-xs sm:text-sm font-medium text-blue-600 uppercase tracking-widest">
          FAQ&apos;s
        </h1>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-medium my-4 sm:my-6 text-slate-900">
          Common questions
        </h2>
        <Accordion type="single" collapsible className="w-full">
          {items.map((item, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="overflow-hidden border-b border-slate-200 last:border-0 pt-6 sm:pt-8 pb-4 sm:pb-5"
            >
              <AccordionTrigger className="text-left font-semibold text-base sm:text-lg lg:text-xl pb-3 hover:no-underline cursor-pointer text-slate-900">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="overflow-hidden text-slate-700 font-light text-sm sm:text-base lg:text-lg leading-relaxed">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
} 