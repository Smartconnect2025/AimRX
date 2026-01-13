"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, Package, Clock, LogIn } from "lucide-react";

interface PaymentDetails {
  patientName: string;
  providerName: string;
  totalAmountCents: number;
  description: string;
  orderProgress: string;
}

export default function PaymentSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);

  useEffect(() => {
    if (!token) return;
    loadPaymentStatus();
  }, [token]);

  const loadPaymentStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/payments/details/${token}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setPaymentDetails(data.payment);
      }
    } catch (error) {
      console.error("Error loading payment status:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Processing payment...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/login")}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          </div>
          <img
            src="https://i.imgur.com/r65O4DB.png"
            alt="AIM Medical Technologies"
            className="h-24 mx-auto mb-4"
          />
        </div>

        {/* Success Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                Payment Successful!
              </CardTitle>
              <p className="text-muted-foreground text-lg">
                Thank you for your payment
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Payment Details */}
            {paymentDetails && (
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-gray-600">Patient</span>
                  <span className="font-semibold">{paymentDetails.patientName}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-gray-600">Provider</span>
                  <span className="font-semibold">{paymentDetails.providerName}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-gray-600">Description</span>
                  <span className="font-semibold text-right max-w-[60%]">
                    {paymentDetails.description}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3">
                  <span className="text-lg font-bold text-gray-900">Amount Paid</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${(paymentDetails.totalAmountCents / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* What Happens Next */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <Package className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">What Happens Next?</h3>
                  <div className="space-y-3 text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                      <div className="mt-1">1.</div>
                      <p>
                        <strong>Payment Confirmation:</strong> You will receive a confirmation
                        email shortly with your receipt.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="mt-1">2.</div>
                      <p>
                        <strong>Provider Approval:</strong> Your provider will review and approve
                        the order.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="mt-1">3.</div>
                      <p>
                        <strong>Pharmacy Processing:</strong> The pharmacy will prepare your
                        medication.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="mt-1">4.</div>
                      <p>
                        <strong>Shipping:</strong> You&apos;ll receive tracking information once
                        your order ships.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Estimate */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900 mb-1">Expected Timeline</p>
                <p className="text-sm text-gray-700">
                  Your medication will typically be ready for pickup or shipping within 5-10
                  business days. We&apos;ll send you updates via email or text.
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="text-center pt-4">
              <p className="text-sm text-gray-600 mb-2">Questions about your order?</p>
              <p className="text-sm font-medium text-gray-900">
                Contact AIM Medical Technologies
              </p>
              <p className="text-sm text-gray-600">(512) 377-9898 · Mon–Fri 9AM–6PM CST</p>
              <p className="text-sm text-gray-600">106 E 6th St, Suite 900 · Austin, TX 78701</p>
            </div>

            {/* Print Button */}
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="w-full"
            >
              Print Receipt
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          You can safely close this page. A confirmation has been sent to your email.
        </p>
      </div>
    </div>
  );
}
