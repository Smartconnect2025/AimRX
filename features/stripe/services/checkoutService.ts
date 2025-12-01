import type { StripeCartItem } from "../types";

export interface CreateCheckoutSessionResponse {
  success: boolean;
  sessionId?: string;
  url?: string;
  error?: string;
  details?: string;
}

/**
 * Create a Stripe checkout session (client-side)
 */
export async function createCheckoutSessionClient(
  items: StripeCartItem[],
): Promise<CreateCheckoutSessionResponse> {
  try {
    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Failed to create checkout session",
        details: data.details,
      };
    }

    return data;
  } catch (error: unknown) {
    console.error("Error creating checkout session:", error);
    return {
      success: false,
      error: "Network error",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
