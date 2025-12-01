import { useEffect, useState } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { envConfig } from "@/core/config/envConfig";

let stripePromise: Promise<Stripe | null>;

/**
 * Hook to get Stripe instance for client-side operations
 */
export function useStripe() {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeStripe = async () => {
      try {
        if (!stripePromise) {
          stripePromise = loadStripe(envConfig.STRIPE_PUBLISHABLE_KEY);
        }

        const stripeInstance = await stripePromise;
        setStripe(stripeInstance);
      } catch (err) {
        setError("Failed to load Stripe");
        console.error("Stripe initialization error:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeStripe();
  }, []);

  return {
    stripe,
    loading,
    error,
  };
}

/**
 * Hook to redirect to Stripe Checkout
 */
export function useStripeCheckout() {
  const { stripe, loading, error } = useStripe();

  const redirectToCheckout = async (sessionId: string) => {
    if (!stripe) {
      throw new Error("Stripe not loaded");
    }

    const { error: stripeError } = await stripe.redirectToCheckout({
      sessionId,
    });

    if (stripeError) {
      throw new Error(stripeError.message);
    }
  };

  return {
    redirectToCheckout,
    loading,
    error,
  };
}
