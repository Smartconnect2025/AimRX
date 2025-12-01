"use client";

import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { formatCardNumber, formatExpiryDate, formatCVC } from "../utils";
import type { UseFormReturn } from "react-hook-form";
import type { PaymentDetails } from "../types";

interface PaymentFormProps {
  form: UseFormReturn<PaymentDetails>;
}

export function PaymentDetailsForm({ form }: PaymentFormProps) {
  return (
    <div className="mb-8">
      <div className="mb-4 pb-4 border-b border-gray-100">
        <h2 className="text-xl font-semibold">Payment details</h2>
      </div>

      <Form {...form}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="cardholderName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cardholder name</FormLabel>
                <FormControl>
                  <Input placeholder="Neha K" {...field} className="bg-white" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cardNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Card number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="0000 0000 0000 0000"
                    {...field}
                    onChange={(e) => {
                      const formatted = formatCardNumber(e.target.value);
                      field.onChange(formatted);
                    }}
                    maxLength={19}
                    className="bg-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="expiryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiry date</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="mm/yy"
                      {...field}
                      onChange={(e) => {
                        const formatted = formatExpiryDate(e.target.value);
                        field.onChange(formatted);
                      }}
                      maxLength={5}
                      className="bg-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cvc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CVC</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="000"
                      {...field}
                      onChange={(e) => {
                        const formatted = formatCVC(e.target.value);
                        field.onChange(formatted);
                      }}
                      maxLength={4}
                      className="bg-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </Form>
    </div>
  );
}
