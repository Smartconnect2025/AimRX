"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, SquarePen } from "lucide-react";
import { useCheckout } from "../hooks/useCheckout";
import { OrderSummary } from "./OrderSummary";
import { AddressForm } from "./AddressForm";
import { PaymentDetailsForm } from "./PaymentDetailsForm";
import { OrderConfirmation } from "./OrderConfirmation";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CheckoutPage() {
  const router = useRouter();
  const { forms, state, actions } = useCheckout();

  // Local state for shipping address edit mode
  const [shippingEditMode, setShippingEditMode] = useState(false);
  // Local state for billing address edit mode
  const [billingEditMode, setBillingEditMode] = useState(true);

  // Redirect if cart is empty
  useEffect(() => {
    // Don't redirect if cart is still loading
    if (state.isLoading) {
      return;
    }
    // Don't redirect if we just placed an order
    if (state.orderSuccessful) {
      return;
    }
    // Redirect if cart is empty
    if (state.items.length === 0) {
      router.push("/");
    }
  }, [state.items.length, state.orderSuccessful, router, state.isLoading]);

  // Check if questionnaire is required and completed
  useEffect(() => {
    // Check if cart contains any weight loss medications
    const hasWeightLossMedications = state.items.some(
      (item) => item.category_name === "WEIGHT LOSS",
    );

    // Only require questionnaire if there are weight loss medications
    if (hasWeightLossMedications) {
      const questionnaireCompleted = localStorage.getItem(
        "questionnaireCompleted",
      );
      if (!questionnaireCompleted) {
        router.push("/test-questionnaire");
      }
    }
  }, [state.items, router]);

  if (state.orderSuccessful) {
    return <OrderConfirmation />;
  }

  if (state.items.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <main className="flex-1 py-16">
      <div className="container mx-auto px-4">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          {/* Order Summary */}
          <OrderSummary
            items={state.items}
            subtotal={state.subtotal}
            className="order-first lg:order-last"
          />

          {/* Forms */}
          <Card className="p-6 order-last lg:order-first rounded-lg shadow-sm border-gray-100">
            {/* Shipping Address Form */}
            <div className="mb-8">
              <div>
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                  <h2 className="text-xl font-semibold">Shipping address</h2>
                  {shippingEditMode ? (
                    <Button
                      variant="outline"
                      onClick={() => setShippingEditMode(false)}
                    >
                      Done
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={() => setShippingEditMode(true)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <SquarePen className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
                {state.addresses && state.addresses.length > 1 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Select a saved address
                    </label>
                    <Select
                      value={state.selectedShippingAddressId}
                      onValueChange={actions.setSelectedShippingAddressId}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Choose address" />
                      </SelectTrigger>
                      <SelectContent>
                        {state.addresses.map((addr) => (
                          <SelectItem key={addr.id} value={addr.id}>
                            {addr.given_name} {addr.family_name} —{" "}
                            {addr.address_line_1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <AddressForm
                  form={forms.shippingForm}
                  summaryMode={!shippingEditMode}
                />
              </div>
            </div>

            {/* Payment Details Form */}
            <PaymentDetailsForm form={forms.paymentForm} />

            {/* Billing Address Form */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                <h2 className="text-xl font-semibold">Billing address</h2>
                {!state.sameAsShipping &&
                  (billingEditMode ? (
                    <Button
                      variant="outline"
                      onClick={() => setBillingEditMode(false)}
                    >
                      Done
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={() => setBillingEditMode(true)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <SquarePen className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  ))}
              </div>
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id="sameAsShipping"
                  checked={state.sameAsShipping}
                  onCheckedChange={(checked) =>
                    actions.setSameAsShipping(checked as boolean)
                  }
                />
                <label
                  htmlFor="sameAsShipping"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Same as shipping address
                </label>
              </div>
              {!state.sameAsShipping && (
                <div>
                  {state.addresses && state.addresses.length > 1 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">
                        Select a saved address
                      </label>
                      <Select
                        value={state.selectedBillingAddressId}
                        onValueChange={actions.setSelectedBillingAddressId}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Choose address" />
                        </SelectTrigger>
                        <SelectContent>
                          {state.addresses.map((addr) => (
                            <SelectItem key={addr.id} value={addr.id}>
                              {addr.given_name} {addr.family_name} —{" "}
                              {addr.address_line_1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <AddressForm
                    form={forms.billingForm}
                    summaryMode={!billingEditMode}
                  />
                </div>
              )}
            </div>

            <Button
              onClick={actions.handlePlaceOrder}
              disabled={state.isLoading}
              variant="default"
              className="mt-6 py-6 rounded-full"
              size="lg"
            >
              {state.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Place order"
              )}
            </Button>
          </Card>
        </div>
      </div>
    </main>
  );
}
