"use client";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Lock, Loader2 } from "lucide-react";
import { useQuestionnaireState } from "@/features/medication-questionnaire/hooks/useQuestionnaireState";
import { useRouter } from "next/navigation";
import { useCart } from "../hooks/useCart";
import { convertCartItemsToStripeItems } from "../utils";
import { createCheckoutSessionClient } from "@/features/stripe/services/checkoutService";
import { toast } from "sonner";
import { useState } from "react";

interface CheckoutButtonProps {
  isDisabled?: boolean;
  className?: string;
  onCloseCart?: () => void;
}

export function CheckoutButton({
  isDisabled = false,
  className,
  onCloseCart,
}: CheckoutButtonProps) {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const { isCompleted, requiresQuestionnaire, shouldBlockCheckout } =
    useQuestionnaireState();
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  const handleCheckout = async () => {
    if (shouldBlockCheckout) {
      // Close cart drawer first, then redirect to questionnaire page
      if (onCloseCart) {
        onCloseCart();
      }

      // Small delay to allow drawer to close, then redirect
      setTimeout(() => {
        router.push("/test-questionnaire");
      }, 100);
      return;
    }

    // Validate cart items have selected prices
    const itemsWithoutPrices = items.filter((item) => !item.selectedPrice);
    if (itemsWithoutPrices.length > 0) {
      toast.error(
        "Some items in your cart don't have selected prices. Please refresh and try again.",
      );
      return;
    }

    setIsCreatingSession(true);

    try {
      // Convert cart items to Stripe checkout items
      const stripeItems = convertCartItemsToStripeItems(items);

      // Create Stripe checkout session
      const result = await createCheckoutSessionClient(stripeItems);

      if (result.success && result.url) {
        // Clear cart after successful session creation
        clearCart();

        // Close cart drawer
        if (onCloseCart) {
          onCloseCart();
        }

        // Redirect to Stripe Checkout
        window.location.href = result.url;
      } else {
        toast.error(result.error || "Failed to create checkout session");
        if (result.details) {
          console.error("Checkout session error details:", result.details);
        }
      }
    } catch (error) {
      console.error("Error during checkout:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsCreatingSession(false);
    }
  };

  return (
    <>
      <div className="space-y-3">
        {/* Questionnaire requirement notice */}
        {requiresQuestionnaire && !isCompleted && (
          <Alert className="border-orange-200 bg-orange-50">
            <FileText className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800 text-sm">
              <div className="font-medium mb-1">
                Medical questionnaire required
              </div>
              <p>
                Complete a brief medical questionnaire before checkout to ensure
                safe medication therapy.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Completed questionnaire notice */}
        {requiresQuestionnaire && isCompleted && (
          <Alert className="border-green-200 bg-green-50">
            <FileText className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 text-sm">
              <div className="font-medium">
                Medical questionnaire completed ✓
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Checkout button */}
        <Button
          onClick={handleCheckout}
          disabled={isDisabled || isCreatingSession}
          className={`w-full ${className}`}
          size="lg"
        >
          {isCreatingSession ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating Checkout Session...
            </>
          ) : shouldBlockCheckout ? (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Complete Medical Questionnaire
            </>
          ) : (
            "Proceed to Checkout"
          )}
        </Button>

        {/* Security note */}
        <div className="text-xs text-center text-slate-500">
          <Lock className="h-3 w-3 inline mr-1" />
          Secure checkout with SSL encryption
        </div>
      </div>
    </>
  );
}
