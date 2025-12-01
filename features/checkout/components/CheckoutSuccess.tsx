"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, Calendar, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "@/features/cart/hooks/useCart";

interface SessionData {
  id: string;
  payment_status: string;
  status: string;
  amount_total: number;
  amount_subtotal: number;
  amount_discount: number;
  currency: string;
  line_items: LineItem[];
  billing_frequency: string | null;
}

interface LineItem {
  id: string;
  price_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  amount_total: number;
  amount_subtotal: number;
  currency: string;
}

interface OrderData {
  exists: boolean;
  order_id: string | null;
}

export default function CheckoutSuccess() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [orderData, setOrderData] = useState<OrderData | null>(null);

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID provided");
      setIsLoading(false);
      return;
    }

    // Verify the session and load detailed data
    const loadSessionData = async () => {
      try {
        // Fetch detailed session data
        const response = await fetch(`/api/stripe/session/${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setSessionData(data.session);
            setOrderData(data.order);

            // Clear cart only on successful payment
            if (data.session.payment_status === "paid") {
              clearCart();
            }
          } else {
            setError(data.error || "Failed to load session data");
          }
        } else {
          setError("Failed to verify payment");
        }
      } catch (error) {
        console.error("Error loading session data:", error);
        setError("Network error occurred");
        // Still clear cart as a fallback since user reached success page
        clearCart();
      }

      setIsLoading(false);
    };

    loadSessionData();
  }, [sessionId, clearCart]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Processing your order...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md mx-auto text-center">
          <div className="text-red-500 mb-4">
            <CheckCircle className="h-12 w-12 mx-auto" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Error</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <Button onClick={() => router.push("/")} className="w-full">
            Return to Home
          </Button>
        </Card>
      </div>
    );
  }

  // Format currency amount
  const formatAmount = (amount: number, currency: string = "usd") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-green-500 mb-4">
            <CheckCircle className="h-16 w-16 mx-auto" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Order Confirmed!
          </h1>
          <p className="text-gray-600 text-lg">
            Thank you for your purchase. We&apos;ve sent you a confirmation
            email.
          </p>
        </div>

        {/* Order Details */}
        {sessionData && (
          <div className="space-y-6 mb-8">
            {/* Order Summary Card */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Order Summary</h2>
                {orderData?.order_id && (
                  <span className="text-sm text-gray-500">
                    Order #{orderData.order_id.slice(-8).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Line Items */}
              <div className="space-y-4 mb-6">
                {sessionData.line_items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {item.product_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatAmount(item.amount_total, sessionData.currency)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>
                    {formatAmount(
                      sessionData.amount_subtotal,
                      sessionData.currency,
                    )}
                  </span>
                </div>
                {sessionData.amount_discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>
                      -
                      {formatAmount(
                        sessionData.amount_discount,
                        sessionData.currency,
                      )}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200">
                  <span>Total Paid</span>
                  <span>
                    {formatAmount(
                      sessionData.amount_total,
                      sessionData.currency,
                    )}
                  </span>
                </div>
              </div>
            </Card>

            {/* Payment & Billing Info */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Payment Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Payment Status</p>
                  <p className="font-medium capitalize">
                    {sessionData.payment_status}
                  </p>
                </div>
                {sessionData.billing_frequency && (
                  <div>
                    <p className="text-sm text-gray-600 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Billing Frequency
                    </p>
                    <p className="font-medium capitalize">
                      {sessionData.billing_frequency}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button onClick={() => router.push("/orders")} className="w-full">
            View My Orders
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/catalog")}
            className="w-full"
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>
  );
}
